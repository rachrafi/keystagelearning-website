#!/usr/bin/env node
// Reads the "National Curriculum.txt" file in each video folder and saves them as
// src/data/curriculum.json, keyed by the video's page name (slug).
//
//   npm run curriculum            (re-run whenever a curriculum file is added or changed)
//
// Expected file shape:
//   National Curriculum (England), Computing – KS2
//   <one-paragraph summary>
//   Curriculum points covered:
//   • KS2: pupils should be taught to "…"
//   Source: …

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { videos } from '../src/data/catalogue.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS_DIR = path.join(os.homedir(), 'Desktop/KeyStageLearning/Videos');
const OUT = path.join(ROOT, 'src/data/curriculum.json');

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\b20 questions\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function parse(text) {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim());
  const head = lines[0] ?? '';
  const stages = [...head.matchAll(/KS\d/g)].map((m) => m[0]);
  const pointsAt = lines.findIndex((l) => /^curriculum points covered/i.test(l));
  const summary = lines.slice(1, pointsAt < 0 ? undefined : pointsAt).filter(Boolean).join(' ');
  const points = [];
  for (const l of lines.slice(pointsAt + 1)) {
    const m = l.match(/^[•\-*]\s*(KS\d)\s*:\s*pupils should be taught to\s*[“"](.+?)[”"]\s*$/i);
    if (m) points.push({ ks: m[1], text: m[2] });
  }
  return { stages, summary, points };
}

const out = {};
const problems = [];
for (const folder of fs.readdirSync(VIDEOS_DIR).filter((f) => /^\d+\s*-/.test(f)).sort((a, b) => parseInt(a) - parseInt(b))) {
  const dir = path.join(VIDEOS_DIR, folder);
  const file = fs.readdirSync(dir).find((f) => /national curriculum\.txt$/i.test(f));
  const m = folder.match(/^\d+\s*-\s*(.+?)\s*\((KS[^)]*)\)\s*$/);
  const video = m && videos.find((v) => v.kind !== 'short' && norm(v.fullTitle) === norm(m[1]));
  if (!video) continue;                                  // not on the site yet
  if (!file) { problems.push(`${folder}: no curriculum file`); continue; }
  const c = parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  if (!c.points.length) problems.push(`${folder}: no curriculum points found`);
  out[video.slug] = c;
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
const statements = new Set(Object.values(out).flatMap((c) => c.points.map((p) => `${p.ks}|${p.text}`)));
console.log(`Saved curriculum notes for ${Object.keys(out).length} videos (${statements.size} different curriculum statements).`);
for (const p of problems) console.log('⚠', p);
