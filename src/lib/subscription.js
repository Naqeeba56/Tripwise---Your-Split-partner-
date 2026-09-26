// ─── Tripwise Pro Subscription helpers ──────────────────────────────────────
// Supports: 15-day free trial, coupon-code discount, UPI payment flow where the
// user submits a UPI transaction id for admin approval (no payment gateway yet).
// DB: supabase/migrations/add_subscriptions.sql

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Pro plan pricing (INR). When a gateway is added later this is what gets charged.
export const PRO_PRICE = 499;          // ₹ per plan (30 days)
export const TRIAL_DAYS = 15;

export const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

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

/** Return coupon info + discounted price, or null when the code is invalid. */
export const getCouponInfo = async (code) => {
  if (!isSupabaseConfigured() || !code) return null;
  try {
    const { data, error } = await supabase
      .from('coupons').select('*').eq('code', String(code).trim().toUpperCase())
      .eq('active', true).maybeSingle();
    if (error || !data) return null;
    const discountPct = Number(data.discount_pct || 0);
    return {
      ...data,
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
export const submitProPayment = async (userId, { upiTransactionId, couponCode = '', amountPaid = 0 }) => {
  if (!isSupabaseConfigured() || !isUuid(userId)) return { error: 'Not configured' };
  const tid = (upiTransactionId || '').trim();
  if (!tid) return { error: 'UPI transaction id is required.' };

  let discountPct = 0;
  let storedCoupon = (couponCode || '').trim().toUpperCase();
  if (storedCoupon) {
    const info = await getCouponInfo(storedCoupon);
    if (!info) return { error: 'Invalid or inactive coupon code.' };
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