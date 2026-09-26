// ─── Tripwise Pro Subscription helpers ──────────────────────────────────────
// Supports: 15-day free trial, coupon-code discount, UPI payment flow where the
// user submits a UPI transaction id for admin approval (no payment gateway yet).
// DB: supabase/migrations/add_subscriptions.sql

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Pro plan pricing (INR). When a gateway is added later this is what gets charged.
export const PRO_PRICE = 499;          // ₹ per plan (30 days)
export const TRIAL_DAYS = 15;

export const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// ─── Payment / bank settings (admin-editable, stored in app_settings) ─────────
// Keys mirror the app_settings table seeded by admin_payments_and_coupons.sql.
// Defaults keep /pro working even before the migration runs or when Supabase is
// not configured.
export const DEFAULT_PAYMENT_SETTINGS = {
  upi_id:         'tripwise@upi',
  upi_name:       'Tripwise',
  bank_name:      '',
  account_holder: '',
  account_number: '',
  ifsc:           '',
};
export const PAYMENT_SETTING_KEYS = Object.keys(DEFAULT_PAYMENT_SETTINGS);

/** Read the admin-editable payment/bank settings (falls back to defaults). */
export const fetchPaymentSettings = async () => {
  if (!isSupabaseConfigured()) return { ...DEFAULT_PAYMENT_SETTINGS };
  try {
    const { data, error } = await supabase.from('app_settings').select('key,value');
    if (error || !data) return { ...DEFAULT_PAYMENT_SETTINGS };
    const out = { ...DEFAULT_PAYMENT_SETTINGS };
    (data || []).forEach((r) => { if (r && r.key in out) out[r.key] = r.value || ''; });
    return out;
  } catch {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }
};

/** Admin only (RLS enforces via public.is_admin()): persist payment settings. */
export const updatePaymentSettings = async (patch) => {
  if (!isSupabaseConfigured()) return { error: 'Not configured' };
  const entries = Object.entries(patch || {})
    .filter(([k]) => PAYMENT_SETTING_KEYS.includes(k));
  if (!entries.length) return { error: 'No valid settings to update' };
  try {
    const rows = entries.map(([key, value]) => ({
      key,
      value: String(value ?? ''),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('app_settings').upsert(rows, { onConflict: 'key' });
    return error ? { error: error.message } : { ok: true };
  } catch (e) {
    return { error: e.message || 'Failed to save settings' };
  }
};

/** Fetch the current user's subscription row (or null). */
export const getMySubscription = async (userId) => {
  if (!isSupabaseConfigured() || !isUuid(userId)) return null;
  try {
    const { data, error } = await supabase
      .from('subscriptions').select('*').eq('user_id', userId).maybeSingle();
    return error ? null : data;
  } catch {
    return null;
  }
};

/** Auto-start the 15-day trial on first Pro visit (idempotent). */
export const ensureProTrial = async (userId, email) => {
  if (!isSupabaseConfigured() || !isUuid(userId)) return null;
  try {
    const existing = await getMySubscription(userId);
    if (existing) return existing;

    const payload = {
      user_id: userId,
      email: email || '',
      plan: 'trial',
      status: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
    };
    const { data, error } = await supabase.from('subscriptions')
      .upsert(payload, { onConflict: 'user_id' }).select().single();
    return error ? null : data;
  } catch {
    return null;
  }
};

/** Return coupon info + discounted price, or null when the code is invalid.
 *  When a coupon has a `user_email` (single-user code) it is only valid for that
 *  matching (case-insensitive) signed-in email. */
export const getCouponInfo = async (code, userEmail = '') => {
  if (!isSupabaseConfigured() || !code) return null;
  try {
    const { data, error } = await supabase
      .from('coupons').select('*').eq('code', String(code).trim().toUpperCase())
      .eq('active', true).maybeSingle();
    if (error || !data) return null;
    const owner = (data.user_email || '').trim().toLowerCase();
    if (owner) {
      // Single-user coupon: must match the signed-in email (and we need one).
      if (!userEmail) return null;
      if (owner !== String(userEmail).trim().toLowerCase()) return null;
    }
    const discountPct = Number(data.discount_pct || 0);
    return {
      ...data,
      userEmail: data.user_email || '',
      discountPct,
      discountedPrice: Math.max(0, Math.round(PRO_PRICE * (1 - discountPct / 100))),
    };
  } catch {
    return null;
  }
};

/**
 * Submit a paid plan request. The user pays to the app's UPI id, then enters the
 * UPI transaction id (and optional coupon). Status flips to 'pending' for the
 * admin to verify. Owners can never set status to 'active' (RLS enforces it).
 */
export const submitProPayment = async (userId, { upiTransactionId, couponCode = '', amountPaid = 0, userEmail = '' }) => {
  if (!isSupabaseConfigured() || !isUuid(userId)) return { error: 'Not configured' };
  const tid = (upiTransactionId || '').trim();
  if (!tid) return { error: 'UPI transaction id is required.' };

  let discountPct = 0;
  let storedCoupon = (couponCode || '').trim().toUpperCase();
  if (storedCoupon) {
    const info = await getCouponInfo(storedCoupon, userEmail);
    if (!info) return { error: 'Invalid, inactive, or not eligible coupon code.' };
    discountPct = info.discountPct;
  } else {
    storedCoupon = '';
  }

  try {
    const { data, error } = await supabase.from('subscriptions')
      .update({
        status: 'pending',
        upi_transaction_id: tid,
        coupon_code: storedCoupon || null,
        discount_pct: discountPct,
        amount_paid: Math.round(Number(amountPaid) || 0),
        notes: 'Paid via UPI · waiting admin verification',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) return { error: error.message };
    return { data };
  } catch (e) {
    return { error: e.message || 'Failed to submit payment.' };
  }
};

/** Resolve a stored row into a normalised { status, label, expiresAt, daysLeft, isPro }. */
export const resolveSubscription = (sub) => {
  if (!sub) return { status: 'none', label: 'Not started', isPro: false, daysLeft: 0 };
  const now = Date.now();
  const trialEnds = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : 0;
  const expiresMs = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;

  if (sub.status === 'active') {
    const isLive = !sub.expires_at || expiresMs > now;
    return {
      status: isLive ? 'active' : 'expired',
      label: isLive ? 'Pro Active' : 'Expired',
      isPro: isLive,
      daysLeft: isLive && sub.expires_at ? Math.max(0, Math.ceil((expiresMs - now) / 86400000)) : 0,
      expiresAt: sub.expires_at,
    };
  }
  if (sub.status === 'pending') {
    return { status: 'pending', label: 'Awaiting Admin Approval', isPro: false, daysLeft: 0 };
  }
  if (sub.status === 'rejected') {
    return { status: 'rejected', label: 'Payment Declined', isPro: false, daysLeft: 0 };
  }
  // trial (default)
  if (trialEnds > now) {
    return { status: 'trial', label: `${Math.max(0, Math.ceil((trialEnds - now) / 86400000))}-day Free Trial`, isPro: false, daysLeft: Math.max(0, Math.ceil((trialEnds - now) / 86400000)) };
  }
  return { status: 'expired', label: 'Trial Expired', isPro: false, daysLeft: 0 };
};

/** Admin: list all subscriptions (for the dashboard approval queue). */
export const fetchAdminSubscriptions = async () => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('subscriptions').select('*').order('created_at', { ascending: false });
    return error ? [] : (data || []);
  } catch {
    return [];
  }
};

/** Admin: approve or reject a pending plan via the SECURITY-DEFINER RPC. */
export const adminSetSubscriptionStatus = async (userId, status, notes) => {
  if (!isSupabaseConfigured() || !userId) return { error: 'Missing user' };
  try {
    const { data, error } = await supabase.rpc('admin_set_subscription_status', {
      p_user_id: userId,
      p_status: status,
      p_notes: notes || null,
    });
    if (error) return { error: error.message };
    return { ok: data === true };
  } catch (e) {
    return { error: e.message || 'RPC failed' };
  }
};

/** Admin: list all coupons (for the dashboard management panel). */
export const fetchAdminCoupons = async () => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('coupons').select('*').order('created_at', { ascending: false });
    return error ? [] : (data || []);
  } catch {
    return [];
  }
};

/** Admin only (RLS): create a new coupon or update an existing one by id.
 *  Passing `userEmail` restricts the code to a single user. */
export const upsertCoupon = async (coupon) => {
  if (!isSupabaseConfigured()) return { error: 'Not configured' };
  const code = String(coupon?.code || '').trim().toUpperCase();
  if (!code) return { error: 'Coupon code is required.' };
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { error: 'Use only letters, numbers, - or _ (uppercase letters/numbers).' };
  }
  const discountPct = Math.max(0, Math.min(100, Number(coupon?.discountPct)));
  if (Number.isNaN(discountPct)) return { error: 'Enter a valid discount percent (0–100).' };
  try {
    const payload = {
      code,
      discount_pct: discountPct,
      label: String(coupon?.label || '').trim(),
      user_email: String(coupon?.userEmail || '').trim().toLowerCase() || null,
      max_uses:
        coupon?.maxUses != null && coupon.maxUses !== ''
          ? Number(coupon.maxUses)
          : null,
      active: coupon?.active !== false,
    };
    const { data, error } = coupon?.id
      ? await supabase.from('coupons').update(payload).eq('id', coupon.id)
          .select().single()
      : await supabase.from('coupons').insert(payload).select().single();
    if (error) return { error: error.message };
    return { ok: true, data };
  } catch (e) {
    return { error: e.message || 'Failed to save coupon' };
  }
};

/** Admin only (RLS): delete a coupon by id. */
export const deleteCoupon = async (id) => {
  if (!isSupabaseConfigured() || !id) return { error: 'Missing coupon id' };
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    return error ? { error: error.message } : { ok: true };
  } catch (e) {
    return { error: e.message || 'Failed to delete coupon' };
  }
};