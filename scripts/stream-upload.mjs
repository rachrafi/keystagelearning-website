#!/usr/bin/env node
// Uploads the finished lesson videos to Cloudflare Stream, with captions,
// and records which Stream video belongs to which page in src/data/stream.json.
//
//   npm run stream -- --dry-run        show what would be uploaded (no internet needed)
//   npm run stream -- --only 40        upload one video (the folder starting "40 - ")
//   npm run stream                     upload everything that isn't on Stream yet
//   npm run stream -- --status         check processing and finish any missing captions
//   npm run stream -- --signing-key    make the key the website uses to sign video passes
//                                      (copied to the clipboard, for the STREAM_SIGNING_KEY secret)
//
// Safe to stop (Ctrl+C) and run again: finished videos are skipped and a
// half-finished one is started again.
//
// Videos are uploaded with "signed URLs required", so they can't be watched
// on Stream until the website hands out a viewing pass (Phase 5).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import * as tus from 'tus-js-client';
import sharp from 'sharp';
import { videos } from '../src/data/catalogue.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(ROOT, '.stream.env');
const STATE_FILE = path.join(ROOT, 'src/data/stream.json');
const POSTER_DIR = path.join(ROOT, 'public/posters');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const VIDEOS_DIR = value('--dir') ?? path.join(os.homedir(), 'Desktop/KeyStageLearning/Videos');

// ---------- matching a folder to a page on the site ----------
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\b20 questions\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function folderInfo(folder) {
  const m = folder.match(/^(\d+)\s*-\s*(.+?)\s*\((KS[^)]*)\)\s*$/);
  if (!m) return null;
  const [, num, title, ks] = m;
  const key = norm(title);
  const video = videos.find((v) => v.kind !== 'short' && norm(v.fullTitle) === key);
  return { num, title, ks, slug: video?.slug ?? null };
}

function folderFiles(dir) {
  const files = fs.readdirSync(dir);
  const mp4 = files.find((f) => f.toLowerCase().endsWith('.mp4'));
  const srt = files.find((f) => f.toLowerCase().endsWith('.srt'));
  const png = files.find((f) => /thumbnail\.png$/i.test(f));
  return { mp4: mp4 && path.join(dir, mp4), srt: srt && path.join(dir, srt), png: png && path.join(dir, png) };
}

function listFolders() {
  if (!fs.existsSync(VIDEOS_DIR)) throw new Error(`Can't find the videos folder: ${VIDEOS_DIR}`);
  return fs.readdirSync(VIDEOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+\s*-/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => parseInt(a) - parseInt(b));
}

// ---------- saved state ----------
const loadState = () => (fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { videos: {} });
const saveState = (s) => fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2) + '\n');

// ---------- credentials (kept on this Mac only, in .stream.env) ----------
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

async function credentials() {
  if (fs.existsSync(ENV_FILE)) {
    const env = Object.fromEntries(fs.readFileSync(ENV_FILE, 'utf8').split('\n')
      .filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
    if (env.CF_ACCOUNT_ID && env.CF_STREAM_TOKEN) return { account: env.CF_ACCOUNT_ID, token: env.CF_STREAM_TOKEN };
  }
  console.log('\nFirst time on this Mac: I need your Cloudflare Account ID and the "Stream uploads" API token.');
  console.log('They are saved in .stream.env in this folder, which is never uploaded to GitHub.\n');
  const account = await ask('Cloudflare Account ID: ');
  const token = await ask('API token (hidden as you paste it): ', true);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/stream?limit=1`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) {
    const why = body.errors?.map((e) => e.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(`Cloudflare didn't accept those details (${why}). Check the Account ID, that the token has "Stream: Edit", and that Stream is switched on.`);
  }
  fs.writeFileSync(ENV_FILE, `CF_ACCOUNT_ID=${account}\nCF_STREAM_TOKEN=${token}\n`, { mode: 0o600 });
  console.log('Details checked and saved.\n');
  return { account, token };
}

// ---------- Cloudflare Stream API ----------
let CF;
async function api(method, p, body, isForm = false) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.account}/stream${p}`, {
    method,
    headers: { Authorization: `Bearer ${CF.token}`, ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(`${method} ${p}: ${json.errors?.map((e) => e.message).join('; ') || `HTTP ${res.status}`}`);
  }
  return json.result;
}

async function existingByFolder() {
  const all = [];
  let after;
  for (;;) {
    const page = await api('GET', `?limit=1000${after ? `&end=${encodeURIComponent(after)}` : ''}`);
    all.push(...page);
    if (page.length < 1000) break;
    after = page[page.length - 1].created;
  }
  const map = new Map();
  for (const v of all) if (v.meta?.ksl_folder) map.set(v.meta.ksl_folder, v);
  return map;
}

function tusUpload(file, name) {
  const size = fs.statSync(file).size;
  return new Promise((resolve, reject) => {
    let last = -1;
    const upload = new tus.Upload(fs.createReadStream(file), {
      endpoint: `https://api.cloudflare.com/client/v4/accounts/${CF.account}/stream`,
      headers: { Authorization: `Bearer ${CF.token}` },
      chunkSize: 50 * 1024 * 1024,
      uploadSize: size,
      retryDelays: [0, 3000, 10000, 30000, 60000, 120000],
      metadata: { name, requiresignedurls: 'true' },
      onProgress(sent, total) {
        const pct = Math.floor((sent / total) * 100);
        if (pct !== last) { last = pct; process.stdout.write(`\r   uploading… ${pct}% of ${(total / 1e6).toFixed(0)} MB   `); }
      },
      onError: (e) => { process.stdout.write('\n'); reject(e); },
      onSuccess() {
        process.stdout.write('\n');
        resolve(new URL(upload.url).pathname.split('/').filter(Boolean).pop());
      },
    });
    upload.start();
  });
}

const srtToVtt = (srt) => 'WEBVTT\n\n' + srt.replace(/\r/g, '').replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2').trim() + '\n';

async function uploadCaptions(uid, srtFile) {
  const form = new FormData();
  form.append('file', new Blob([srtToVtt(fs.readFileSync(srtFile, 'utf8'))], { type: 'text/vtt' }), 'captions.vtt');
  await api('PUT', `/${uid}/captions/en`, form, true);
}

async function makePoster(png, slug) {
  if (!png || !slug) return null;
  fs.mkdirSync(POSTER_DIR, { recursive: true });
  const out = path.join(POSTER_DIR, `${slug}.jpg`);
  if (!fs.existsSync(out)) await sharp(png).resize(1280, 720, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  return `/posters/${slug}.jpg`;
}

// ---------- commands ----------
function dryRun() {
  const folders = listFolders();
  let total = 0, matched = 0;
  console.log(`Videos folder: ${VIDEOS_DIR}\n`);
  for (const f of folders) {
    const info = folderInfo(f);
    const files = folderFiles(path.join(VIDEOS_DIR, f));
    const size = files.mp4 ? fs.statSync(files.mp4).size : 0;
    total += size;
    if (info?.slug) matched++;
    const problems = [!files.mp4 && 'NO MP4', !files.srt && 'no captions', !files.png && 'no thumbnail'].filter(Boolean);
    console.log(`${f}\n   → ${info?.slug ? `page /watch/${info.slug}/` : 'not on the website yet (uploaded and kept for later)'}` +
      `   ${(size / 1e6).toFixed(0)} MB${problems.length ? '   ⚠ ' + problems.join(', ') : ''}`);
  }
  const onSite = videos.filter((v) => v.kind !== 'short');
  const missing = onSite.filter((v) => !folders.some((f) => folderInfo(f)?.slug === v.slug));
  console.log(`\n${folders.length} videos, ${(total / 1e9).toFixed(1)} GB. ${matched} match a page on the site.`);
  if (missing.length) console.log(`Pages with no video folder found: ${missing.map((v) => v.slug).join(', ')}`);
}

async function upload(only) {
  CF = await credentials();
  const state = loadState();
  const folders = listFolders().filter((f) => !only || parseInt(f) === parseInt(only));
  if (!folders.length) throw new Error(`No folder starting "${only} - " in ${VIDEOS_DIR}`);
  console.log('Checking what is already on Stream…');
  const existing = await existingByFolder();
  let n = 0;
  for (const f of folders) {
    n++;
    const info = folderInfo(f);
    const files = folderFiles(path.join(VIDEOS_DIR, f));
    console.log(`\n[${n}/${folders.length}] ${f}`);
    if (!files.mp4) { console.log('   ⚠ no .mp4 in this folder, skipped'); continue; }

    let v = existing.get(f);
    if (v && ['pendingupload', 'error'].includes(v.status?.state)) {
      console.log('   an earlier upload didn\'t finish, starting it again');
      await api('DELETE', `/${v.uid}`);
      v = null;
    }
    let uid = v?.uid;
    if (uid) console.log('   already on Stream');
    else {
      uid = await tusUpload(files.mp4, `${info?.num ?? ''} ${info?.title ?? f}`.trim());
      await api('POST', `/${uid}`, { requireSignedURLs: true, meta: { name: info?.title ?? f, ksl_folder: f, ksl_slug: info?.slug ?? '' } });
      console.log('   uploaded');
    }

    const rec = state.videos[f] ?? {};
    rec.uid = uid;
    rec.slug = info?.slug ?? null;
    rec.title = info?.title ?? f;
    rec.poster = await makePoster(files.png, info?.slug);
    if (!rec.captions && files.srt) {
      try { await uploadCaptions(uid, files.srt); rec.captions = true; console.log('   captions added'); }
      catch (e) { rec.captions = false; console.log(`   captions will be added later (${e.message})`); }
    }
    state.videos[f] = rec;
    saveState(state);
  }
  console.log(`\nDone. ${folders.length} video(s) handled. Cloudflare takes a few minutes to process each one;`);
  console.log('run  npm run stream -- --status  later to check they are all ready.');
}

async function status() {
  CF = await credentials();
  const state = loadState();
  let ready = 0, waiting = 0, failed = 0;
  for (const [f, rec] of Object.entries(state.videos)) {
    const v = await api('GET', `/${rec.uid}`).catch(() => null);
    if (!v) { console.log(`✗ ${f}: not found on Stream (run the upload again)`); failed++; continue; }
    rec.duration = Math.round(v.duration ?? 0);
    rec.ready = Boolean(v.readyToStream);
    if (!rec.captions) {
      const srt = folderFiles(path.join(VIDEOS_DIR, f)).srt;
      if (srt) try { await uploadCaptions(rec.uid, srt); rec.captions = true; } catch { /* try again next time */ }
    }
    const state_ = v.status?.state;
    if (rec.ready) ready++; else if (state_ === 'error') failed++; else waiting++;
    console.log(`${rec.ready ? '✓' : state_ === 'error' ? '✗' : '…'} ${f}  ${rec.ready ? `${Math.round(rec.duration / 60)} min` : state_}${rec.captions ? '' : '  (captions pending)'}`);
  }
  saveState(state);
  console.log(`\n${ready} ready, ${waiting} still processing, ${failed} with a problem.`);
}

async function signingKey() {
  CF = await credentials();
  const k = await api('POST', '/keys');
  const secret = JSON.stringify({ id: k.id, jwk: k.jwk });
  const file = path.join(ROOT, '.stream-signing-key');
  fs.writeFileSync(file, secret, { mode: 0o600 });
  const { execFileSync } = await import('node:child_process');
  execFileSync('pbcopy', { input: secret });
  console.log('\n✓ Signing key made and copied to your clipboard (it is not shown here).');
  console.log('  A copy is also saved in .stream-signing-key in this folder (never uploaded to GitHub).\n');
  console.log('Now in Cloudflare: keystagelearning → Settings → Runtime variables and secrets → + Add variable');
  console.log('  Type: Secret   Name: STREAM_SIGNING_KEY   Value: paste (Cmd+V)   → Deploy\n');
}

try {
  if (flag('--signing-key')) await signingKey();
  else if (flag('--dry-run')) dryRun();
  else if (flag('--status')) await status();
  else await upload(value('--only'));
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
}
