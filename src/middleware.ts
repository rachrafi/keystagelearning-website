import { defineMiddleware } from 'astro:middleware';

// Pre-built pages don't know who's signed in. Pages that run on demand
// (account, sign-in, and later the paid videos) look up the session here.
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  if (!context.isPrerendered) {
    const { SESSION_COOKIE, userFromSession } = await import('./lib/auth');
    context.locals.user = await userFromSession(context.cookies.get(SESSION_COOKIE)?.value).catch(() => null);
  }
  return next();
});
