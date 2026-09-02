import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
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
 * Initiates Google OAuth login through Supabase
 */
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured with live credentials. Falling back to demo mock login.');
    return { data: null, error: new Error('Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local') };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
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
    return { data: null, error: new Error('Supabase not configured.') };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
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
