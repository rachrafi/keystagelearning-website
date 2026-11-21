// Accounts and sign-in by emailed link.
// Accounts are for grown-ups (parents, carers, teachers). We store only an email
// address and sign-in times: nothing about children.
import { env } from 'cloudflare:workers';

export interface User { id: number; email: string; created_at: number }

interface Env {
  DB: D1Database;
  /** Resend API key, stored as a secret in the Cloudflare dashboard. */
  RESEND_API_KEY?: string;
}
const E = env as unknown as Env;

export const SESSION_COOKIE = 'ksl_session';
export const SESSION_DAYS = 30;
const LINK_MINUTES = 15;
const SITE = 'https://www.keystagelearning.org';
const FROM = 'Key Stage Learning <signin@keystagelearning.org>';

const now = () => Math.floor(Date.now() / 1000);

// ---------- database ----------
let ready: Promise<void> | null = null;
export function db(): D1Database {
  return E.DB;
}
async function schema() {
  ready ??= E.DB.batch([
    E.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER)`),
    E.DB.prepare(`CREATE TABLE IF NOT EXISTS login_tokens (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER)`),
    E.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      device TEXT)`),
    E.DB.prepare('CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)'),
    E.DB.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (key TEXT NOT NULL, at INTEGER NOT NULL)`),
    E.DB.prepare('CREATE INDEX IF NOT EXISTS login_attempts_key ON login_attempts(key, at)'),
  ]).then(() => undefined).catch((e) => { ready = null; throw e; });
  return ready;
}

// ---------- small helpers ----------
function randomToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export function cleanEmail(raw: unknown): string | null {
  const e = String(raw ?? '').trim().toLowerCase();
  return e.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/.test(e) ? e : null;
}
function deviceName(ua: string | null): string {
  const u = ua ?? '';
  const os = /iPad/.test(u) ? 'iPad' : /iPhone/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Android' : /Mac OS X/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : /CrOS/.test(u) ? 'Chromebook' : 'Device';
  const br = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : '';
  return br ? `${br} on ${os}` : os;
}

// ---------- step 1: email a sign-in link ----------
/** Returns 'sent', or 'slow-down' when this email or network has asked too often. */
export async function requestLink(email: string, ip: string | null): Promise<'sent' | 'slow-down'> {
  await schema();
  const t = now();
  const emailKey = `e:${await sha256(email)}`;
  const ipKey = `i:${await sha256(ip ?? 'unknown')}`;
  const [byEmail, byIp] = await E.DB.batch([
    E.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND at > ?').bind(emailKey, t - 15 * 60),
    E.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND at > ?').bind(ipKey, t - 60 * 60),
  ]);
  if (((byEmail.results[0] as any)?.n ?? 0) >= 3 || ((byIp.results[0] as any)?.n ?? 0) >= 20) return 'slow-down';

  const token = randomToken();
  await E.DB.batch([
    E.DB.prepare('INSERT INTO login_attempts (key, at) VALUES (?, ?), (?, ?)').bind(emailKey, t, ipKey, t),
    E.DB.prepare('DELETE FROM login_attempts WHERE at < ?').bind(t - 24 * 3600),
    E.DB.prepare('DELETE FROM login_tokens WHERE expires_at < ?').bind(t - 24 * 3600),
    E.DB.prepare('INSERT INTO login_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), email, t + LINK_MINUTES * 60),
  ]);

  const link = `${SITE}/login/verify/?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Your Key Stage Learning sign-in link',
    text: `Hello,\n\nUse this link to sign in to Key Stage Learning:\n${link}\n\nIt works once and stops working after ${LINK_MINUTES} minutes.\n\nIf you didn't ask to sign in, you can ignore this email. Nobody can sign in without the link.\n\nKey Stage Learning\n${SITE}\n`,
    html: `<!doctype html><html><body style="margin:0;background:#fff4e4;font-family:Arial,Helvetica,sans-serif;color:#1d1150">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px">
<tr><td style="padding:32px 28px">
<p style="margin:0 0 6px;font-size:14px;font-weight:bold;color:#7653e0">KEY STAGE LEARNING</p>
<h1 style="margin:0 0 16px;font-size:26px">Sign in</h1>
<p style="margin:0 0 24px;font-size:17px;line-height:1.5">Press the button to sign in. It works once and stops working after ${LINK_MINUTES} minutes.</p>
<p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#291a6d;color:#ffffff;text-decoration:none;font-weight:bold;font-size:18px;padding:14px 28px;border-radius:999px">Sign in to Key Stage Learning</a></p>
<p style="margin:0 0 8px;font-size:14px;color:#514a7a">Or copy this link into your browser:<br><span style="word-break:break-all">${link}</span></p>
<p style="margin:20px 0 0;font-size:14px;color:#514a7a">If you didn't ask to sign in, you can ignore this email. Nobody can sign in without the link.</p>
</td></tr></table></td></tr></table></body></html>`,
  });
  return 'sent';
}

// Sign-in emails go out through Resend (resend.com), EU region.
// In `npm run dev` without a key, the email is printed to the console instead.
async function sendEmail(msg: { to: string; subject: string; text: string; html: string }): Promise<void> {
  if (!E.RESEND_API_KEY) {
    if (!import.meta.env.DEV) throw new Error('RESEND_API_KEY is not set');
    console.log(`[email not sent: no RESEND_API_KEY]\nTo: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${E.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// ---------- step 2: the link is pressed ----------
/** Checks a link without using it up (so email scanners that open links can't spend it). */
export async function linkIsValid(token: string): Promise<boolean> {
  if (!token) return false;
  await schema();
  const row = await E.DB.prepare('SELECT 1 FROM login_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
    .bind(await sha256(token), now()).first();
  return Boolean(row);
}

/** Uses the link and starts a session. Returns the session cookie value, or null if the link is no good. */
export async function useLink(token: string, userAgent: string | null): Promise<string | null> {
  if (!token) return null;
  await schema();
  const t = now();
  const hash = await sha256(token);
  const row = await E.DB.prepare('UPDATE login_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING email')
    .bind(t, hash, t).first<{ email: string }>();
  if (!row) return null;
  const user = await E.DB.prepare(`INSERT INTO users (email, created_at, last_login_at) VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET last_login_at = excluded.last_login_at RETURNING id`)
    .bind(row.email, t, t).first<{ id: number }>();
  const session = randomToken();
  await E.DB.prepare('INSERT INTO sessions (id_hash, user_id, created_at, expires_at, device) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256(session), user!.id, t, t + SESSION_DAYS * 86400, deviceName(userAgent)).run();
  return session;
}

// ---------- sessions ----------
export async function userFromSession(session: string | undefined): Promise<User | null> {
  if (!session) return null;
  await schema();
  return E.DB.prepare(`SELECT users.id, users.email, users.created_at FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.id_hash = ? AND sessions.expires_at > ?`).bind(await sha256(session), now()).first<User>();
}

export async function signOut(session: string | undefined, everywhere = false): Promise<void> {
  if (!session) return;
  await schema();
  const hash = await sha256(session);
  if (everywhere) {
    await E.DB.prepare('DELETE FROM sessions WHERE user_id = (SELECT user_id FROM sessions WHERE id_hash = ?)').bind(hash).run();
  } else {
    await E.DB.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(hash).run();
  }
}

export async function devices(userId: number): Promise<{ device: string; created_at: number }[]> {
  await schema();
  const r = await E.DB.prepare('SELECT device, created_at FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC')
    .bind(userId, now()).all<{ device: string; created_at: number }>();
  return r.results;
}

export async function deleteAccount(userId: number): Promise<void> {
  await schema();
  const u = await E.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>();
  await E.DB.batch([
    E.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
    ...(u ? [E.DB.prepare('DELETE FROM login_tokens WHERE email = ?').bind(u.email)] : []),
    E.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
  ]);
}

export const cookieOptions = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  maxAge: SESSION_DAYS * 86400,
};
