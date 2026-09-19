import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // After OAuth/OTP, land in the app (which now lives at /app).
  let next = requestUrl.searchParams.get('next') || '/app';
  // Guard against open redirects — only allow same-origin relative paths.
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/app';
  }

  if (code && isSupabaseConfigured()) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error('Supabase code exchange error:', err);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
