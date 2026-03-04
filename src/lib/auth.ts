import type { AstroCookies } from 'astro';
import { getServiceClient } from './supabase';

export async function getSessionUser(cookies: AstroCookies, env: Record<string, string>) {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) return null;

  const supabase = getServiceClient(env);

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    // Try refreshing
    const { data: refreshData, error: refreshError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (refreshError || !refreshData.session) return null;

    // Update cookies with new tokens
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
    };
    cookies.set('sb-access-token', refreshData.session.access_token, cookieOptions);
    cookies.set('sb-refresh-token', refreshData.session.refresh_token, cookieOptions);

    return refreshData.session.user;
  }

  return data.user;
}
