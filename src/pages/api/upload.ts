import type { APIRoute } from 'astro';
import { getServiceClient, getRuntimeEnv } from '../../lib/supabase';
import { extractEventData } from '../../lib/gemini';

export const POST: APIRoute = async ({ request, locals }) => {
  const formData = await request.formData();
  const file = formData.get('image') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'Nessuna immagine caricata' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return new Response(
      JSON.stringify({ error: 'Formato non supportato. Usa JPEG, PNG o WebP.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "L'immagine non può superare i 5MB" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const env = getRuntimeEnv(locals);
  const supabase = getServiceClient(env);
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(filePath, uint8, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: 'Errore nel caricamento: ' + uploadError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: publicUrlData } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath);

  // Extract data with Gemini
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  let extraction = null;
  try {
    extraction = await extractEventData(base64, file.type, env);
  } catch (err) {
    console.error('Gemini extraction error:', err);
  }

  return new Response(
    JSON.stringify({
      image_url: publicUrlData.publicUrl,
      image_path: filePath,
      extraction,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
