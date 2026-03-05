import type { APIRoute } from 'astro';
import { getServiceClient, getRuntimeEnv } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getRuntimeEnv(locals);
  const supabase = getServiceClient(env);

  let page: string;
  try {
    const body = await request.json();
    page = body.page;
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!page || typeof page !== 'string') {
    return new Response(null, { status: 400 });
  }

  const userAgent = request.headers.get('user-agent') || null;
  const referrer = request.headers.get('referer') || null;

  await supabase.from('page_views').insert({
    page,
    user_agent: userAgent,
    referrer,
  });

  return new Response(null, { status: 204 });
};
