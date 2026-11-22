// Memberships, paid through Stripe.
// Card details never touch this site: people pay on Stripe's own checkout page,
// and manage or cancel on Stripe's billing portal. Stripe tells us what happened
// through signed webhook messages (see /api/stripe-webhook).
import { env } from 'cloudflare:workers';
import { schema, type User } from './auth';

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;      // secret, set in the Cloudflare dashboard
  STRIPE_WEBHOOK_SECRET?: string;  // secret, set in the Cloudflare dashboard
  STRIPE_PRICE_MONTHLY: string;    // in wrangler.jsonc (not secret)
  STRIPE_PRICE_YEARLY: string;
}
const E = env as unknown as Env;
const SITE = 'https://www.keystagelearning.org';
const now = () => Math.floor(Date.now() / 1000);

export type Plan = 'monthly' | 'yearly';
export const PLANS: Record<Plan, { label: string; price: string; per: string }> = {
  monthly: { label: 'Monthly', price: '£4.99', per: 'a month' },
  yearly: { label: 'Yearly', price: '£49.99', per: 'a year' },
};
const priceFor = (plan: Plan) => (plan === 'yearly' ? E.STRIPE_PRICE_YEARLY : E.STRIPE_PRICE_MONTHLY);
const planFor = (priceId: string | null) =>
  priceId === E.STRIPE_PRICE_YEARLY ? 'yearly' : priceId === E.STRIPE_PRICE_MONTHLY ? 'monthly' : null;

export interface Membership {
  status: string;               // Stripe's subscription status, or 'none'
  plan: Plan | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  active: boolean;              // may watch members' videos
}

/** Statuses that give access. 'past_due' keeps access while Stripe retries a failed card. */
const ACCESS = new Set(['active', 'trialing', 'past_due']);

export async function membership(userId: number): Promise<Membership> {
  await schema();
  const r = await E.DB.prepare('SELECT status, price_id, current_period_end, cancel_at_period_end FROM memberships WHERE user_id = ?')
    .bind(userId).first<{ status: string; price_id: string | null; current_period_end: number | null; cancel_at_period_end: number }>();
  const status = r?.status ?? 'none';
  return {
    status,
    plan: planFor(r?.price_id ?? null),
    current_period_end: r?.current_period_end ?? null,
    cancel_at_period_end: Boolean(r?.cancel_at_period_end),
    active: ACCESS.has(status),
  };
}

// ---------- talking to Stripe ----------
function form(data: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) if (v !== undefined) p.append(k, String(v));
  return p.toString();
}
async function stripe<T = any>(method: 'GET' | 'POST', path: string, data?: Record<string, string | number | boolean | undefined>): Promise<T> {
  if (!E.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${E.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data ? form(data) : undefined,
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${json?.error?.message ?? 'unknown error'}`);
  return json as T;
}

async function customerFor(user: User): Promise<string> {
  await schema();
  const row = await E.DB.prepare('SELECT stripe_customer_id FROM memberships WHERE user_id = ?').bind(user.id).first<{ stripe_customer_id: string }>();
  if (row) return row.stripe_customer_id;
  const c = await stripe<{ id: string }>('POST', '/customers', { email: user.email, 'metadata[user_id]': user.id });
  await E.DB.prepare('INSERT INTO memberships (user_id, stripe_customer_id, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING')
    .bind(user.id, c.id, now()).run();
  const again = await E.DB.prepare('SELECT stripe_customer_id FROM memberships WHERE user_id = ?').bind(user.id).first<{ stripe_customer_id: string }>();
  return again!.stripe_customer_id;
}

/** Returns the address of Stripe's checkout page for this plan. */
export async function startCheckout(user: User, plan: Plan): Promise<string> {
  const customer = await customerFor(user);
  const s = await stripe<{ url: string }>('POST', '/checkout/sessions', {
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    'line_items[0][price]': priceFor(plan),
    'line_items[0][quantity]': 1,
    'subscription_data[metadata][user_id]': user.id,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    'custom_text[submit][message]':
      "Your membership starts straight away, so you agree to lose the 14-day right to cancel for digital content. You can stop your membership at any time from your account page; it then runs to the end of the period you've paid for.",
    success_url: `${SITE}/account/?joined=1`,
    cancel_url: `${SITE}/join/?cancelled=1`,
  });
  return s.url;
}

/** Returns the address of Stripe's billing portal (change card, change plan, cancel, invoices). */
export async function billingPortal(user: User): Promise<string> {
  const customer = await customerFor(user);
  const s = await stripe<{ url: string }>('POST', '/billing_portal/sessions', { customer, return_url: `${SITE}/account/` });
  return s.url;
}

// ---------- Stripe's messages (webhooks) ----------
async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Checks Stripe's signature (and that the message is less than 5 minutes old). */
export async function verifyWebhook(payload: string, header: string | null): Promise<any | null> {
  if (!E.STRIPE_WEBHOOK_SECRET || !header) return null;
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=') as [string, string]));
  const t = Number(parts.t);
  const sigs = header.split(',').filter((kv) => kv.startsWith('v1=')).map((kv) => kv.slice(3));
  if (!t || !sigs.length || Math.abs(now() - t) > 300) return null;
  const expected = await hmacHex(E.STRIPE_WEBHOOK_SECRET, `${t}.${payload}`);
  if (!sigs.some((s) => safeEqual(s, expected))) return null;
  return JSON.parse(payload);
}

async function saveSubscription(sub: any): Promise<void> {
  await schema();
  const item = sub.items?.data?.[0];
  const periodEnd = sub.current_period_end ?? item?.current_period_end ?? null;
  const priceId = item?.price?.id ?? null;
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  const userId = Number(sub.metadata?.user_id) || null;
  const r = await E.DB.prepare(`UPDATE memberships SET stripe_subscription_id = ?, status = ?, price_id = ?, current_period_end = ?,
      cancel_at_period_end = ?, updated_at = ? WHERE stripe_customer_id = ?`)
    .bind(sub.id, sub.status, priceId, periodEnd, sub.cancel_at_period_end || sub.cancel_at ? 1 : 0, now(), customer).run();
  if (!r.meta.changes && userId) {
    // Customer made outside this site's checkout: attach it by the user id Stripe carried for us.
    await E.DB.prepare(`INSERT INTO memberships (user_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, cancel_at_period_end, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id = excluded.stripe_customer_id,
        stripe_subscription_id = excluded.stripe_subscription_id, status = excluded.status, price_id = excluded.price_id,
        current_period_end = excluded.current_period_end, cancel_at_period_end = excluded.cancel_at_period_end, updated_at = excluded.updated_at`)
      .bind(userId, customer, sub.id, sub.status, priceId, periodEnd, sub.cancel_at_period_end ? 1 : 0, now()).run();
  }
}

export async function handleWebhook(event: any): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await saveSubscription(event.data.object);
      break;
    case 'checkout.session.completed': {
      // Fetch the subscription so the record is right even if messages arrive out of order.
      const id = event.data.object.subscription;
      if (id) await saveSubscription(await stripe('GET', `/subscriptions/${id}`));
      break;
    }
  }
}
