import { createClient } from '@supabase/supabase-js';

/**
 * Supabase browser/server client.
 *
 * The project URL is intentionally NOT read from a `NEXT_PUBLIC_` variable
 * anymore. It is bridged to the browser by `next.config.mjs`
 * (`env: { SUPABASE_URL }`) and, as a last resort, derived from the public
 * anon key — the key is a JWT whose payload carries the project ref, which is
 * exactly how Supabase builds `https://<ref>.supabase.co`.
 *
 * The anon key stays public on purpose: it is meant to be shipped inside the
 * browser client and data access is enforced by Row-Level-Security policies
 * (see SECURITY.md). Only the anon key may ever be public — never the
 * `service_role` key.
 */
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'placeholder-anon-key';

/** Decode a base64url JWT payload in both the browser and on the server. */
const decodeJwtPayload = (token) => {
  try {
    const part = String(token).split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const binary =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('binary');
    // Percent-decode so multi-byte characters survive the binary round-trip.
    return JSON.parse(decodeURIComponent(escape(binary)));
  } catch {
    return null;
  }
};

/** Derive `https://<project-ref>.supabase.co` from the public anon key. */
export const supabaseUrlFromAnonKey = (key) => {
  const payload = decodeJwtPayload(key);
  return payload?.ref ? `https://${payload.ref}.supabase.co` : '';
};

const resolveSupabaseUrl = () =>
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  supabaseUrlFromAnonKey(ANON_KEY) ||
  'https://placeholder-project.supabase.co';

// `process.env.SUPABASE_URL` is defined in next.config.mjs, so it resolves both
// in the browser bundle and in server code.
const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = ANON_KEY;

export { supabaseUrl, supabaseAnonKey };

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Public app URL — used as a fallback for OAuth / magic-link redirect URLs.
 * `window.location.origin` always wins in the browser, so this only matters
 * on the server. Server-only in the env file; bridged via next.config.mjs.
 */
export const appUrl = () =>
  (typeof window !== 'undefined' ? window.location.origin : null) ||
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

/**
 * Initiates Google OAuth login through Supabase
 */
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured with live credentials. Falling back to demo mock login.');
    return { data: null, error: new Error('Supabase is not configured. Add SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.') };
  }

  const origin = appUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/app`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { data, error };
};

/**
 * Signs in with Email OTP / Magic Link
 */
export const signInWithOtp = async (email) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const origin = appUrl();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/app`,
    },
  });

  return { data, error };
};

/**
 * Sign out
 */
export const signOut = async () => {
  if (!isSupabaseConfigured()) return { error: null };
  return await supabase.auth.signOut();
};

