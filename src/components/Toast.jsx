'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

/* Floating, auto-dismissing toast snackbar. Sits just above the mobile
   dock (and above modals) so feedback is always in view, never a modal. */
export default function Toast({ message, tone = 'info', onDismiss, duration = 3200 }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const palette =
    {
      error: { ring: 'border-rose-500/30', icon: XCircle, color: 'text-rose-500', bar: 'bg-rose-500' },
      success: { ring: 'border-emerald-500/30', icon: CheckCircle2, color: 'text-emerald-500', bar: 'bg-emerald-500' },
      info: { ring: 'border-teal-500/30', icon: Info, color: 'text-teal-500', bar: 'bg-teal-500' },
    }[tone] || {};
  const Icon = palette.icon || Info;

  return (
    <AnimatePresence>
      <motion.div
        key={message + tone}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        role="status"
        aria-live="polite"
        className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 z-[70] w-[92%] max-w-sm"
      >
        <div
          className={`relative overflow-hidden flex items-start gap-3 rounded-2xl border ${palette.ring} bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl`}
        >
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${palette.color}`} />
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex-1 leading-relaxed">{message}</p>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
          <motion.div
            key={message}
            initial={{ width: '100%' }}
            animate={{ width: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={`absolute bottom-0 left-0 h-0.5 ${palette.bar}`}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}