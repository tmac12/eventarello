import type { APIRoute } from 'astro';
import { getServiceClient, getRuntimeEnv } from '../../../lib/supabase';
import { createEventSchema } from '../../../lib/types';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const env = getRuntimeEnv(locals);
    const supabase = getServiceClient(env);
    const showAll = url.searchParams.get('all') === 'true';

    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (!showAll) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': showAll ? 'no-cache' : 'public, max-age=300',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Dati non validi', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const env = getRuntimeEnv(locals);
  const supabase = getServiceClient(env);
  const { data, error } = await supabase
    .from('events')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
