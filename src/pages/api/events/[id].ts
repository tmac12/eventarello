import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';
import { updateEventSchema } from '../../../lib/types';

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID mancante' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const parsed = updateEventSchema.safeParse({ ...body, id });

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Dati non validi', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { id: _id, ...updateData } = parsed.data;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID mancante' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = getServiceClient();

  // Get the event to delete its image
  const { data: event } = await supabase
    .from('events')
    .select('image_path')
    .eq('id', id)
    .single();

  if (event?.image_path) {
    await supabase.storage.from('event-images').remove([event.image_path]);
  }

  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
