import type { APIRoute } from 'astro';
import { SESSION_COOKIE, sessionKey } from '../../lib/auth';
import { beat, stopPlay } from '../../lib/playback';
export const prerender = false;

// While a members' video is open, the page says "still watching" every minute,
// and "stopped" when it's closed, so the 2-at-once limit frees up straight away.
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const session = cookies.get(SESSION_COOKIE)?.value;
  if (!locals.user || !session) return new Response(null, { status: 204 });
  const action = (await request.text()).trim();
  const key = await sessionKey(session);
  if (action === 'stop') await stopPlay(key);
  else await beat(key);
  return new Response(null, { status: 204 });
};
