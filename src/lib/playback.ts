// Video passes: short-lived signed links to Cloudflare Stream, and the
// "2 videos playing at once" limit for each membership.
import { env } from 'cloudflare:workers';
import { schema } from './auth';
import { STREAM_HOST } from '../data/stream';

interface Env {
  DB: D1Database;
  /** Secret: {"id": "...", "jwk": "<base64 JWK>"} from `npm run stream -- --signing-key`. */
  STREAM_SIGNING_KEY?: string;
}
const E = env as unknown as Env;
const now = () => Math.floor(Date.now() / 1000);

export const MAX_PLAYING = 2;
const PASS_HOURS = 4;
const BEAT_SECONDS = 60;          // the player says "still watching" this often
const STALE_SECONDS = 150;        // a play with no word for this long has stopped

// ---------- signing ----------
const b64url = (data: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

let keyPromise: Promise<{ id: string; key: CryptoKey }> | null = null;
function signingKey() {
  keyPromise ??= (async () => {
    if (!E.STREAM_SIGNING_KEY) throw new Error('STREAM_SIGNING_KEY is not set');
    const { id, jwk } = JSON.parse(E.STREAM_SIGNING_KEY);
    const key = await crypto.subtle.importKey('jwk', JSON.parse(atob(jwk)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    return { id, key };
  })().catch((e) => { keyPromise = null; throw e; });
  return keyPromise;
}

/** The address of Stream's player for this video, valid for a few hours. */
export async function streamPlayerUrl(uid: string, poster: string | null): Promise<string> {
  const { id, key } = await signingKey();
  const header = b64url(JSON.stringify({ alg: 'RS256', kid: id }));
  const payload = b64url(JSON.stringify({ sub: uid, kid: id, exp: now() + PASS_HOURS * 3600, nbf: now() - 60 }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${payload}`));
  const token = `${header}.${payload}.${b64url(sig)}`;
  const q = new URLSearchParams({ autoplay: 'true', defaultTextTrack: 'en', letterboxColor: 'transparent' });
  if (poster) q.set('poster', `https://www.keystagelearning.org${poster}`);
  return `https://${STREAM_HOST}/${token}/iframe?${q}`;
}

// ---------- how many videos are playing ----------
async function plays() {
  await schema();
  await E.DB.prepare(`CREATE TABLE IF NOT EXISTS plays (
    session_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    last_beat INTEGER NOT NULL)`).run();
}

/** Starts a play for this device, unless MAX_PLAYING other devices are already playing. */
export async function startPlay(userId: number, sessionHash: string, slug: string): Promise<boolean> {
  await plays();
  const t = now();
  const busy = await E.DB.prepare('SELECT COUNT(*) AS n FROM plays WHERE user_id = ? AND session_hash != ? AND last_beat > ?')
    .bind(userId, sessionHash, t - STALE_SECONDS).first<{ n: number }>();
  if ((busy?.n ?? 0) >= MAX_PLAYING) return false;
  await E.DB.batch([
    E.DB.prepare(`INSERT INTO plays (session_hash, user_id, slug, last_beat) VALUES (?, ?, ?, ?)
      ON CONFLICT(session_hash) DO UPDATE SET user_id = excluded.user_id, slug = excluded.slug, last_beat = excluded.last_beat`)
      .bind(sessionHash, userId, slug, t),
    E.DB.prepare('DELETE FROM plays WHERE last_beat < ?').bind(t - 86400),
  ]);
  return true;
}

export async function beat(sessionHash: string): Promise<void> {
  await plays();
  await E.DB.prepare('UPDATE plays SET last_beat = ? WHERE session_hash = ?').bind(now(), sessionHash).run();
}

export async function stopPlay(sessionHash: string): Promise<void> {
  await plays();
  await E.DB.prepare('DELETE FROM plays WHERE session_hash = ?').bind(sessionHash).run();
}

export { BEAT_SECONDS };
