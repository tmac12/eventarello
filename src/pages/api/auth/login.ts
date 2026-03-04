import type { APIRoute } from 'astro';
import { getServiceClient, getRuntimeEnv } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email e password sono obbligatori' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const env = getRuntimeEnv(locals);
  const supabase = getServiceClient(env);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return new Response(JSON.stringify({ error: 'Credenziali non valide' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  };

  cookies.set('sb-access-token', data.session.access_token, cookieOptions);
  cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
