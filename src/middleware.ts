import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/auth';

const PROTECTED_PATHS = ['/admin'];
const PROTECTED_API_METHODS = ['POST', 'PUT', 'DELETE'];
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/logout'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const method = context.request.method;

  const isProtectedPage = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  const isProtectedApi =
    pathname.startsWith('/api/') &&
    PROTECTED_API_METHODS.includes(method) &&
    !PUBLIC_API_PATHS.includes(pathname);

  if (!isProtectedPage && !isProtectedApi) {
    return next();
  }

  // Allow login page
  if (pathname === '/admin/login') {
    return next();
  }

  const user = await getSessionUser(context.cookies);

  if (!user) {
    if (isProtectedApi) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin/login');
  }

  context.locals.user = user;
  return next();
});
