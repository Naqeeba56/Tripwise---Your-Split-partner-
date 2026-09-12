// Quota-safe localStorage helpers with automatic trimming of heavy
// inline base64 payloads (QR-code images, base64 avatars) that overflow
// the browser storage quota (~5MB). Supabase is the source of truth, so
// a skipped or trimmed cache write never loses real data.

const MAX_INLINE = 2000;

// Recursively truncate oversized inline base64 data-URLs.
function trimValue(value) {
  if (typeof value === 'string') {
    if (value.length > MAX_INLINE && value.indexOf('data:') === 0) return '';
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(trimValue);
  }
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach((k) => {
      out[k] = trimValue(value[k]);
    });
    return out;
  }
  return value;
}

export function safeSetItem(key, value) {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = trimValue(value);
    window.localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (err) {
    // Quota exceeded or storage blocked → drop the oversized cache key and carry on.
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
    if (typeof console !== 'undefined') {
      console.warn('localStorage write skipped (quota/unavailable):', key, err);
    }
  }
}

export function safeGetItem(key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}