import { createClient } from '@supabase/supabase-js';

export function getServiceClient(env: Record<string, string>) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

/** Helper to get runtime env from Astro API context */
export function getRuntimeEnv(locals: App.Locals): Record<string, string> {
  return (locals as any).runtime?.env ?? {};
}
