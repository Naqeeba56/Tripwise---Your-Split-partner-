// Central place for Super Admin identity.
// ADD YOUR OWN EMAIL HERE if you want admin access.
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const ADMIN_EMAILS = ['naqeeba56@gmail.com', 'naqeeba@gmail.com'];

export const isAdminEmail = (email) =>
  typeof email === 'string' && ADMIN_EMAILS.includes(email.trim().toLowerCase());

// Back-compat single export (used in the access-denied screen).
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

/**
 * Fetch true registration counts directly from auth.users via the admin-only
 * RPC defined in supabase/migrations/admin_user_stats.sql.
 *
 * Returns { total, profiles, emails } — or null when the RPC is unavailable
 * (not deployed yet, network error, etc.) so callers can fall back to the
 * profiles-table count.
 */
export const fetchAdminUserStats = async () => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.rpc('admin_user_stats');
    if (error || !data) return null;
    if (typeof data === 'number') return { total: data, profiles: data, emails: [] };
    return {
      total: Number(data?.total) || 0,
      profiles: Number(data?.profiles) || 0,
      emails: Array.isArray(data?.emails) ? data.emails : [],
    };
  } catch {
    return null;
  }
};