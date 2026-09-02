import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code && isSupabaseConfigured()) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error('Supabase code exchange error:', err);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
