// Central place for Super Admin identity.
// ADD YOUR OWN EMAIL HERE if you want admin access.
export const ADMIN_EMAILS = ['naqeeba56@gmail.com', 'naqeeba@gmail.com'];

export const isAdminEmail = (email) =>
  typeof email === 'string' && ADMIN_EMAILS.includes(email.trim().toLowerCase());

// Back-compat single export (used in the access-denied screen).
export const ADMIN_EMAIL = ADMIN_EMAILS[0];