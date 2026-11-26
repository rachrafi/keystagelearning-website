import type { APIRoute } from 'astro';
import { videoBySlug, isFree, type Video } from '../../../data/catalogue';
import { streamFor } from '../../../data/stream';
import { MEMBERSHIPS_LIVE } from '../../../data/links';
import { SESSION_COOKIE, sessionKey } from '../../../lib/auth';
import { membership } from '../../../lib/billing';
import { streamPlayerUrl, startPlay, BEAT_SECONDS } from '../../../lib/playback';
export const prerender = false;

const youtube = (v: Video) =>
  `https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=1&hl=en-GB`;
const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// The video page asks here when someone presses play. The answer is either a
// player address, or why they can't watch yet (sign in / join / too many playing).
export const POST: APIRoute = async ({ params, url, cookies, locals }) => {
  const video = (() => { try { return videoBySlug(params.slug!); } catch { return undefined; } })();
  if (!video) return json({ mode: 'missing' }, 404);

  const stream = streamFor(video.slug);
  const live = MEMBERSHIPS_LIVE || url.searchParams.get('preview') === 'members';
  if (!stream || video.kind === 'short') return json({ mode: 'youtube', src: youtube(video) });
  // Before launch everything plays as before; a video that's only on our site (not YouTube) plays from Stream.
  if (!live && video.youtubeId) return json({ mode: 'youtube', src: youtube(video) });
  if (!live) return json({ mode: 'stream', src: await streamPlayerUrl(stream.uid, stream.poster), free: true });

  try {
    if (isFree(video)) return json({ mode: 'stream', src: await streamPlayerUrl(stream.uid, stream.poster), free: true });

    const user = locals.user;
    if (!user) return json({ mode: 'signin' });
    if (!(await membership(user.id)).active) return json({ mode: 'join' });

    const session = cookies.get(SESSION_COOKIE)?.value!;
    const key = await sessionKey(session);
    if (!(await startPlay(user.id, key, video.slug))) return json({ mode: 'busy' });
    return json({ mode: 'stream', src: await streamPlayerUrl(stream.uid, stream.poster), beat: BEAT_SECONDS });
  } catch (e) {
    console.error('play failed', video.slug, (e as Error).message);
    return json({ mode: 'error' }, 500);
  }
};
