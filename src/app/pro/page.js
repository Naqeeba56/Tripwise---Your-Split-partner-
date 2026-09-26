'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles, ShieldCheck, Crown, ArrowLeft, Copy, Check,
  BadgeCheck, Wallet, Tag, Clock, Loader2, Info, QrCode, Smartphone,
} from 'lucide-react';
import QRCode from 'qrcode';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  PRO_PRICE, TRIAL_DAYS, getMySubscription, ensureProTrial,
  getCouponInfo, submitProPayment, resolveSubscription,
} from '@/lib/subscription';

// ── App UPI details — REPLACE with your actual UPI id / name ────────────────
const APP_UPI_ID = 'tripwise@upi';
const APP_UPI_NAME = 'Tripwise';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export default function ProPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sub, setSub] = useState(null);
  // Never start as null — resolveSubscription(null) returns a safe
  // { status: 'none', isPro: false, ... } object so the first render (which
  // happens before the async load() resolves) can't crash on `res.status`.
  const [res, setRes] = useState(() => resolveSubscription(null));
  const [paying, setPaying] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [upiTid, setUpiTid] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const payable = coupon?.discountedPrice ?? PRO_PRICE;
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Standard UPI intent + per-app deep links pre-filled with the exact amount.
  const upiPayUri  = `upi://pay?pa=${encodeURIComponent(APP_UPI_ID)}&pn=${encodeURIComponent(APP_UPI_NAME)}&am=${payable}&cu=INR&tn=${encodeURIComponent('Tripwise Pro')}`;
  const gpayUri    = `intent://pay?pa=${encodeURIComponent(APP_UPI_ID)}&pn=${encodeURIComponent(APP_UPI_NAME)}&am=${payable}&cu=INR&tn=Tripwise%20Pro#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
  const phonepeUri = `intent://pay?pa=${encodeURIComponent(APP_UPI_ID)}&pn=${encodeURIComponent(APP_UPI_NAME)}&am=${payable}&cu=INR&tn=Tripwise%20Pro#Intent;scheme=upi;package=com.phonepe.app;end;`;
  const paytmUri   = `intent://pay?pa=${encodeURIComponent(APP_UPI_ID)}&pn=${encodeURIComponent(APP_UPI_NAME)}&am=${payable}&cu=INR&tn=Tripwise%20Pro#Intent;scheme=upi;package=net.one97.paytm;end;`;

  // Generate the scannable QR while the paying panel is open.
  useEffect(() => {
    if (!paying) return;
    let alive = true;
    QRCode.toDataURL(upiPayUri, { width: 200, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then((url) => alive && setQrDataUrl(url))
      .catch(() => { /* keep placeholder */ });
    return () => { alive = false; };
  }, [paying, upiPayUri]);

  const load = async (u) => {
    if (!u?.id) return;
    await ensureProTrial(u.id, u.email);
    const s = await getMySubscription(u.id);
    setSub(s);
    setRes(resolveSubscription(s));
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          await load(session.user);
        }
        setChecking(false);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
        if (session?.user) { setUser(session.user); load(session.user); }
        setChecking(false);
      });
      return () => listener?.subscription?.unsubscribe();
    }
    setChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyCoupon = async () => {
    setCouponMsg('');
    const info = await getCouponInfo(couponCode);
    if (!info) { setCoupon(null); setCouponMsg('Invalid or inactive coupon code.'); return; }
    setCoupon(info);
    setCouponMsg(`Applied — ${info.discountPct}% off on Pro.`);
  };

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(APP_UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setMessage('');
    const result = await submitProPayment(user.id, {
      upiTransactionId: upiTid,
      couponCode: coupon?.code || '',
      amountPaid: payable,
    });
    setBusy(false);
    if (result.error) { setMessage(result.error); return; }
    setMessage('Payment submitted! Our admin will verify and activate Pro shortly.');
    await load(user);
    setPaying(false);
    setUpiTid('');
  };

  if (checking) {
    return (
      <div className="min-h-screen app-canvas flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin text-teal-500" />Checking account…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen app-canvas flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="p-3 bg-teal-500/10 text-teal-500 rounded-2xl mx-auto border border-teal-500/20"><Crown className="w-6 h-6" /></div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Go Pro</h1>
          <p className="text-xs text-slate-400">Please sign in to start your free trial and unlock Pro.</p>
          <a href="/app" className="inline-flex items-center gap-1.5 bg-teal-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-teal-400 transition"><ArrowLeft className="w-3.5 h-3.5" />Back to App</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-canvas p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-100">
          <span className="p-1.5 rounded-lg bg-teal-500/15 text-teal-500"><Crown className="w-4.5 h-4.5" /></span>
          Tripwise <span className="text-teal-500">Pro</span>
        </div>
        <a href="/app" className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold hover:border-teal-500/40 transition"><ArrowLeft className="w-3.5 h-3.5" />Back to App</a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />Your Membership</h2>

          {res.status === 'active' && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-2">
              <div className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">You're Pro 🎉</span></div>
              <p className="text-xs text-slate-500 dark:text-slate-400">All Pro features are unlocked.{" "}
                {res.daysLeft > 0 ? `Expires in ${res.daysLeft} day${res.daysLeft > 1 ? 's' : ''}.` : 'Lifetime access.'}</p>
            </div>
          )}
          {res.status === 'pending' && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-2">
              <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">Awaiting Admin Approval</span></div>
              <p className="text-xs text-slate-500 dark:text-slate-400">We're verifying your UPI payment. You'll be activated shortly.</p>
            </div>
          )}
          {res.status === 'trial' && (
            <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-4 space-y-2">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400">Free Trial — {res.daysLeft} days left</span></div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enjoy full Pro access free for {TRIAL_DAYS} days.</p>
            </div>
          )}
          {res.status === 'expired' && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4">
              <span className="text-sm font-bold text-rose-500">Your trial has ended.</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upgrade below to keep Pro features.</p>
            </div>
          )}
          {res.status === 'rejected' && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4">
              <span className="text-sm font-bold text-rose-500">Payment declined.</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please try again with a correct UPI transaction id.</p>
            </div>
          )}
          {res.status === 'none' && (
            <div className="rounded-2xl bg-slate-500/10 border border-slate-500/30 p-4 space-y-1">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{res.label || 'Not started'}</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Start your free {TRIAL_DAYS}-day Pro trial below — no card needed.</p>
            </div>
          )}

          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500" />Unlimited trips & expenses</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500" />AI budget estimator & insights</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500" />Smart settlement & PDF reports</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500" />Priority support</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Wallet className="w-4 h-4 text-teal-500" />Upgrade to Pro</h2>

          {res.status === 'pending' ? (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Payment under review</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">No action needed. We'll activate your account once verified.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Pro Plan</p>
                  <p className="text-[10px] text-slate-400">30 days · renews only if you choose</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-teal-500">₹{fmt(payable)}</p>
                  {coupon && <p className="text-[10px] text-emerald-500">(-{coupon.discountPct}% via {coupon.code})</p>}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Coupon code</p>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. TRIP10" className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs" />
                  <button onClick={applyCoupon} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold"><Tag className="w-3.5 h-3.5 mr-1" />Apply</button>
                </div>
                {couponMsg && <p className="text-[10px] mt-1 text-slate-400">{couponMsg}</p>}
              </div>

              {!paying && (
                <button onClick={() => setPaying(true)} disabled={res.status === 'active'}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold rounded-2xl py-3 transition active:scale-[.98]">
                  <Crown className="w-4 h-4" />Start Trial · then Pay via UPI
                </button>
              )}

              {paying && (
                <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 space-y-3">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Pay ₹{fmt(payable)} to Tripwise Pro, then enter the transaction id:</p>

                  {/* Scannable QR (amount pre-filled) */}
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="UPI QR" className="w-40 h-40 rounded-xl" />
                    ) : (
                      <div className="w-40 h-40 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><QrCode className="w-8 h-8 text-slate-400" /></div>
                    )}
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Scan with any UPI app · amount ₹{fmt(payable)} pre-filled</p>
                  </div>

                  {/* Launch-in-app deep links */}
                  <div className="space-y-1.5">
                    <a href={gpayUri} className="w-full flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition">
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-teal-500" />Google Pay (GPay)</span><span className="text-teal-500 font-bold">Open app →</span>
                    </a>
                    <a href={phonepeUri} className="w-full flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition">
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-purple-500" />PhonePe</span><span className="text-purple-500 font-bold">Open app →</span>
                    </a>
                    <a href={paytmUri} className="w-full flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition">
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-emerald-500" />Paytm</span><span className="text-emerald-500 font-bold">Open app →</span>
                    </a>
                    <a href={upiPayUri} className="w-full flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition">
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-sky-500" />Default UPI / BHIM</span><span className="text-sky-500 font-bold">Pay via UPI →</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-900 border border-teal-500/30 px-3 py-2.5">
                    <div className="flex items-center gap-1.5"><Wallet className="w-4 h-4 text-teal-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{APP_UPI_ID}</span>
                      <span className="text-[10px] text-slate-400">({APP_UPI_NAME})</span></div>
                    <button onClick={copyUpi} className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <input value={upiTid} onChange={(e) => setUpiTid(e.target.value)}
                    placeholder="UPI transaction id / UTR number"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs" />
                  <button onClick={handlePay} disabled={busy}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-2xl py-2.5 transition active:scale-[.98]">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Submit for Verification
                  </button>
                </div>
              )}

              {message && <p className="text-[11px] mt-3 flex items-center gap-1.5 text-teal-600 dark:text-teal-400"><Info className="w-3.5 h-3.5" />{message}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}