// Which Cloudflare Stream video belongs to which page (written by `npm run stream`).
import data from './stream.json';

export const STREAM_HOST = 'customer-ubxl2cqliq3c25u9.cloudflarestream.com';

interface Rec { uid: string; slug: string | null; poster: string | null }
const bySlug = new Map<string, Rec>();
for (const r of Object.values(data.videos as Record<string, Rec>)) if (r.slug) bySlug.set(r.slug, r);

export const streamFor = (slug: string) => bySlug.get(slug) ?? null;
