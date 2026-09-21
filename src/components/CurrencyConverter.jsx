'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Coins,
  Zap,
  Check,
} from 'lucide-react';

import {
  CURRENCIES,
  currencyMeta,
  formatMoney,
  formatPairRate,
  fetchRates,
} from '@/lib/currencyRates';
import { safeGetItem, safeSetItem } from '@/lib/storage';

const STORAGE_KEY = 'tripwise_currency_prefs';

export default function CurrencyConverter() {
  const prefs = useMemo(() => {
    try {
      return safeGetItem(STORAGE_KEY) || {};
    } catch (_) {
      return {};
    }
  }, []);

  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState(prefs.from || 'INR');
  const [to, setTo] = useState(prefs.to || 'USD');
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  /* Showcase pairs for the playful "market pulse" ticker. */
  const showcase = [
    ['INR', 'USD'],
    ['USD', 'INR'],
    ['INR', 'EUR'],
    ['INR', 'AED'],
    ['EUR', 'JPY'],
    ['INR', 'THB'],
    ['USD', 'GBP'],
    ['SGD', 'SEK'],
  ];

  const loadRates = useCallback(
    async (force = false) => {
      try {
        const map = await fetchRates('INR', force);
        setRates(map);
        setLive(true);
      } catch (_) {
        setLive(false);
      } finally {
        setLoading(false);
        setUpdatedAt(new Date());
      }
    },
    []
  );

  useEffect(() => {
    loadRates(true);
    timerRef.current = setInterval(() => loadRates(true), 60 * 1000);
    return () => clearInterval(timerRef.current);
  }, [loadRates]);

  useEffect(() => {
    try {
      safeSetItem(STORAGE_KEY, { from, to });
    } catch (_) {
      /* storage unavailable */
    }
  }, [from, to]);

  const numericAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [amount]);

  const converted = useMemo(() => {
    if (numericAmount == null || !rates) return null;
    const perInrTo = (rates[to] ?? currencyMeta(to).perINR) || 0;
    const perInrFrom = (rates[from] ?? currencyMeta(from).perINR) || 1;
    const factor = perInrTo / perInrFrom;
    return { value: numericAmount * factor, factor };
  }, [numericAmount, rates, from, to]);

  const handleSwap = () => {
    setSpinning(true);
    setTimeout(() => {
      setFrom(to);
      setTo(from);
      setSpinning(false);
    }, 260);
  };

  const handleCopy = async () => {
    if (converted == null) return;
    const label = `${formatMoney(numericAmount, from)} = ${formatMoney(converted.value, to)}`;
    try {
      await navigator.clipboard.writeText(label);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (_) {
      /* clipboard blocked */
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-28 sm:pb-8">
      {/* Headline */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-teal-400 p-3 rounded-2xl shadow-lg shadow-violet-500/20 text-white">
            <Coins className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold flex items-center gap-2">
              Currency Flipper
              <span className="text-base align-middle">💱</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Convert on the go — switch, swap &amp; copy in one tap.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
              live
                ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${live ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${live ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            {live ? 'Live rates' : 'Offline rates'}
          </span>
          <button
            onClick={() => loadRates(true)}
            disabled={loading}
            aria-label="Refresh rates"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-teal-500 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main converter card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 shadow-xl">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-teal-400/30 to-emerald-300/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 w-60 h-60 rounded-full bg-gradient-to-tr from-violet-500/20 to-fuchsia-400/10 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-8 space-y-6">
          {/* Amount + From currency */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400 inline-flex items-center gap-1.5">
              <span className="animate-bounce inline-block">🪙</span> You have
            </label>
            <div className="mt-2 flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg sm:text-xl pointer-events-none">
                  {currencyMeta(from).symbol}
                </span>
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0"
                  aria-label="Amount to convert"
                  className="w-full pl-10 pr-4 py-3 sm:py-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-teal-500 outline-none text-2xl sm:text-3xl font-bold font-display tabular-nums transition"
                />
              </div>
              <CurrencySelect value={from} onChange={setFrom} tone="from" />
            </div>
          </div>

          {/* Swap + equals row */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
            <motion.button
              type="button"
              onClick={handleSwap}
              whileTap={{ scale: 0.8 }}
              aria-label="Swap currencies"
              title="Swap"
              className="p-3 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/25"
            >
              <motion.span animate={{ rotate: spinning ? 180 : 0 }} transition={{ duration: 0.25 }} className="inline-flex">
                <ArrowUpDown className="w-5 h-5 stroke-[2.4]" />
              </motion.span>
            </motion.button>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
          </div>
          {/* Result */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400 inline-flex items-center gap-1.5">
              <span className="animate-pulse">✨</span> You&apos;ll get
            </label>
            <div className="mt-2 flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white p-4 sm:p-5 shadow-lg shadow-fuchsia-500/20">
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/15 blur-2xl" />
                <BigResult value={converted ? converted.value : null} currency={to} />
                {converted && to !== from && (
                  <div className="mt-1 text-[11px] sm:text-xs text-white/85 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>1 {from} = {formatPairRate(converted.factor)} {to}</span>
                    {converted.factor >= 1 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-100"><TrendingUp className="w-3.5 h-3.5" /> more {to} per 1 {from}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-100"><TrendingDown className="w-3.5 h-3.5" /> more {from} per 1 {to}</span>
                    )}
                  </div>
                )}
                {converted && to === from && (
                  <div className="mt-1 text-[11px] sm:text-xs text-white/85">same currency 🎉</div>
                )}
              </div>
              <CurrencySelect value={to} onChange={setTo} tone="to" />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="text-[10px] sm:text-[11px] text-slate-400">
              {updatedAt
                ? `Rates from ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · refreshes every 60s`
                : 'Loading rates…'}
            </span>
            <button
              onClick={handleCopy}
              disabled={converted == null}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-500/40 transition disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Zap className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy result'}
            </button>
          </div>
        </div>
      </div>

      {/* Playful market pulse strip */}
      <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-bold inline-flex items-center gap-1.5">
            <span className="font-display">Market Pulse</span> <span className="animate-bounce">📡</span>
          </h3>
          <span className="text-[10px] text-slate-400">mock live-ticker</span>
        </div>
        <TickerRow items={showcase} rates={rates} />
      </div>

      {/* Fun quick conversions for travel */}
      <TravelQuickies rates={rates} from={from} to={to} />
    </div>
  );
}
/* Big animated result number — bounces in whenever it changes. */
function BigResult({ value, currency }) {
  const key = `${value}-${currency}`;
  return (
    <motion.div
      key={key}
      initial={{ scale: 0.94, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className="font-display font-extrabold text-2xl sm:text-4xl tabular-nums break-words"
    >
      {value == null ? '—' : formatMoney(value, currency)}
    </motion.div>
  );
}

/* Readable inline money text. */
function ReadableResult({ value, currency }) {
  return <span>{value == null ? '—' : formatMoney(value, currency)}</span>;
}

/* Glassy currency dropdown selector. */
function CurrencySelect({ value, onChange, tone }) {
  const meta = currencyMeta(value);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-3 sm:py-4 rounded-2xl border font-semibold text-xs sm:text-sm transition
          ${tone === 'from'
            ? 'bg-teal-500/10 border-teal-500/25 text-teal-700 dark:text-teal-300 hover:border-teal-500/50'
            : 'bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-300 hover:border-violet-500/50'}`}
      >
        <span className="text-base sm:text-lg">{meta.flag}</span>
        <span className="hidden sm:inline">{value}</span>
        <Chevron />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              role="listbox"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-40 w-64 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-1.5"
            >
              {CURRENCIES.map((c) => {
                const active = c.code === value;
                return (
                  <button
                    key={c.code}
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition ${
                      active
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-300'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold">{c.code}</span>
                      <span className="block text-[10px] text-slate-400 truncate">{c.name}</span>
                    </span>
                    {active && <Check className="w-4 h-4 text-teal-500" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chevron() {
  return (
    <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Auto-scrolling "market pulse" ticker with playful live deltas. */
function TickerRow({ items, rates }) {
  const seq = useMemo(
    () =>
      items.map(([a, b], i) => ({
        id: i,
        a,
        b,
        off: Math.random() < 0.5 ? 1 : -1,
        delta: (Math.random() * 0.4 + 0.05).toFixed(2),
      })),
    [items]
  );

  const renderChip = (item, index) => {
    const a = currencyMeta(item.a);
    const b = currencyMeta(item.b);
    const factor =
      rates && rates[item.b] != null && rates[item.a] != null
        ? rates[item.b] / rates[item.a]
        : b.perINR / (a.perINR || 1);
    const up = item.off > 0;
    return (
      <div
        key={`${item.id}-${index}`}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 whitespace-nowrap"
      >
        <span>{a.flag}</span>
        <span className="text-xs font-bold">{item.a}→{item.b}</span>
        <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">{formatPairRate(factor)}</span>
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {item.delta}%
        </span>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-2 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, ease: 'linear', duration: 26 }}
      >
        {[...seq, ...seq].map((item, index) => renderChip(item, index))}
      </motion.div>
    </div>
  );
}

/* Playful "quick trip picks" + a travel-flavoured one-liner. */
function TravelQuickies({ rates, from, to }) {
  const quickies = useMemo(
    () => [
      { label: 'Chai ☕', emoji: '☕', target: 30 },
      { label: 'Street lunch 🍛', emoji: '🍛', target: 150 },
      { label: 'Boutique stay 🏨', emoji: '🏨', target: 3500 },
      { label: 'Return flight ✈️', emoji: '✈️', target: 12000 },
    ],
    []
  );

  const showOne = useMemo(() => quickies[Math.floor(Math.random() * quickies.length)], [quickies]);

  const convertTarget = (val) => {
    if (rates && rates[to] != null && rates[from] != null) return val * (rates[to] / rates[from]);
    return val * (currencyMeta(to).perINR / (currencyMeta(from).perINR || 1));
  };

  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
      <h3 className="text-xs sm:text-sm font-bold inline-flex items-center gap-1.5">
        <span className="font-display">Quick trip picks</span> <span>🎒</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {quickies.map((q) => (
          <div
            key={q.label}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <span>{q.emoji}</span>
            <span className="text-slate-500 dark:text-slate-400">{q.label}</span>
            <span className="tabular-nums">{formatMoney(q.target, from)}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-4 py-3 leading-relaxed">
        <span className="font-semibold text-slate-700 dark:text-slate-200">Fun fact:</span> a typical {showOne.label} (
        {formatMoney(showOne.target, from)}) would set you back about{' '}
        <span className="font-bold text-teal-600 dark:text-teal-400">
          {currencyMeta(to).flag} <ReadableResult value={convertTarget(showOne.target)} currency={to} />
        </span>
        . Time to pack! 🧳
      </div>
    </div>
  );
}