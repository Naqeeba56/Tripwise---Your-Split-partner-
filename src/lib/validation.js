// Shared, dependency-light validation helpers used by forms across the app.

// A standard UPI handle: e.g. "name@okaxis", "a.b_12@ybl", "user@upi".
const UPI_HANDLE_RE = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

// Indian 10-digit mobile starting with 6-9, with or without +91 country code.
const INDIA_MOBILE_RE = /^(\+91)?[6-9]\d{9}$/;

// Accepts either a UPI handle or an Indian mobile number (for UPI-lite / payee).
export function isValidUpiOrMobile(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  if (UPI_HANDLE_RE.test(s)) return true;
  if (INDIA_MOBILE_RE.test(s)) return true;
  return false;
}

export function isValidUpiHandle(value) {
  return UPI_HANDLE_RE.test(String(value || '').trim());
}

export function isValidIndianMobile(value) {
  return INDIA_MOBILE_RE.test(String(value || '').trim());
}

// Amount sanity: a finite, non-negative number (allows decimals).
export function parsePositiveAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}