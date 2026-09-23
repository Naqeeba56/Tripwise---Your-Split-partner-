/**
 * Turns raw database / network errors into something a traveller can act on.
 *
 * Every Supabase + fetch failure the app can realistically hit is mapped to a
 * short, human sentence. The original error is NEVER shown to the user (raw
 * Postgres text like `42703: column announcements.user_id does not exist` is
 * not a useful message) — callers should log it to the console instead.
 *
 *   try { ... } catch (err) { setError(friendlyError(err)); }
 *   const { error } = await supabase...; if (error) setError(friendlyError(error));
 */

const contains = (haystack, needle) => haystack.includes(needle);

export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;

  const code = String(error.code ?? '');
  const message = String(
    error.message || error.error_description || error.details || (typeof error === 'string' ? error : '')
  );
  const m = message.toLowerCase();

  // ── Postgres / PostgREST ────────────────────────────────────────────
  // 42501 — RLS refused the write (not signed in, or not the owner).
  if (code === '42501' || contains(m, 'row-level security') || contains(m, 'row level security')) {
    return 'You do not have permission to do that. Please sign in with the account that owns it and try again.';
  }
  if (contains(m, 'permission denied')) {
    return 'You do not have permission to do that. Please sign in again and retry.';
  }
  // 42703 / PGRST204 — the live schema is missing a column this feature needs.
  if (code === '42703' || code === 'PGRST204' || /column\s+.*does not exist/.test(m) || contains(m, 'could not find the')) {
    return 'The database is missing a field this form needs. Please apply the pending Supabase migration and try again.';
  }
  // 23503 — a referenced row (usually the signed-in profile) does not exist.
  if (code === '23503' || contains(m, 'foreign key')) {
    return 'Your profile is not fully set up yet. Reload the page and try again.';
  }
  // 23505 — duplicate.
  if (code === '23505' || contains(m, 'duplicate key')) {
    return 'That name is already used in this trip. Please pick a different one.';
  }
  // 23502 — a required column arrived empty.
  if (code === '23502' || contains(m, 'null value in column')) {
    return 'A required field was left empty. Please fill in the highlighted fields.';
  }
  // 22P02 / 22003 — bad number / out of range.
  if (code === '22P02' || code === '22003' || contains(m, 'invalid input syntax')) {
    return 'One of the values looks invalid. Please check the numbers and try again.';
  }
  if (code === 'PGRST116') {
    return 'That record no longer exists — it may have been deleted by someone else.';
  }
  if (contains(m, 'value too long')) {
    return 'That text is too long. Please shorten it and try again.';
  }

  // ── Network ─────────────────────────────────────────────────────────
  if (contains(m, 'failed to fetch') || contains(m, 'networkerror') || contains(m, 'network request failed') || contains(m, 'load failed')) {
    return 'We could not reach the server. Check your internet connection and try again.';
  }
  if (contains(m, 'timeout') || contains(m, 'timed out') || contains(m, 'aborted')) {
    return 'The request took too long. Please try again.';
  }
  if (contains(m, 'payload too large') || contains(m, '413')) {
    return 'That image is too large to upload. Please choose a smaller one.';
  }

  // ── Supabase auth ───────────────────────────────────────────────────
  if (contains(m, 'rate limit') || contains(m, 'too many requests') || contains(m, '429')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (contains(m, 'jwt') || contains(m, 'token has expired') || contains(m, 'refresh token') || contains(m, 'session')) {
    return 'Your session expired. Please sign in again.';
  }
  if (contains(m, 'invalid email') || contains(m, 'unable to validate email')) {
    return 'That email address does not look right. Please check it and try again.';
  }
  if (contains(m, 'email not confirmed') || contains(m, 'not confirmed')) {
    return 'Please confirm your email address first — check your inbox for the link.';
  }
  if (contains(m, 'invalid login') || contains(m, 'invalid grant') || contains(m, 'invalid credentials')) {
    return 'Those sign-in details are not valid. Please try again.';
  }
  if (contains(m, 'provider is not enabled') || contains(m, 'unsupported provider')) {
    return 'That sign-in method is not enabled for this project.';
  }

  // ── Configuration ───────────────────────────────────────────────────
  if (contains(m, 'not configured') || contains(m, 'placeholder')) {
    return 'This feature is not configured yet. Please contact the organiser.';
  }

  // Anything unmapped: a short, human-safe version of the message if it looks
  // like plain text, otherwise the caller's fallback.
  const clean = message.replace(/^error:\s*/i, '').trim();
  if (clean && clean.length <= 120 && !/^[[{]/.test(clean) && !/^\d{5}$/.test(clean)) return clean;
  return fallback;
}

/** True when the failure is "not allowed" (RLS / ownership), useful for CTAs. */
export function isPermissionError(error) {
  const code = String(error?.code ?? '');
  const m = String(error?.message || '').toLowerCase();
  return code === '42501' || contains(m, 'row-level security') || contains(m, 'permission denied');
}

/** True when the live schema is missing a column (migration not applied). */
export function isMissingColumnError(error) {
  const code = String(error?.code ?? '');
  const m = String(error?.message || '').toLowerCase();
  return code === '42703' || code === 'PGRST204' || /column\s+.*does not exist/.test(m);
}

export default friendlyError;
