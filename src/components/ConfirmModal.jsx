'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriangleAlert, X, Check } from 'lucide-react';

/* Reusable confirmation dialog. Replaces the browser confirm()/alert()
   popups so the experience stays inside the app's visual language. */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger', // 'danger' | 'info'
  icon: Icon = TriangleAlert,
}) {
  if (!isOpen) return null;

  const isDanger = tone === 'danger';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.18 }}
          role="alertdialog"
          aria-modal="true"
          className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center ${
            isDanger ? 'border border-rose-500/25 bg-white dark:bg-slate-900' : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
              isDanger
                ? 'bg-rose-500/15 text-rose-500 border-rose-500/30 shadow-md'
                : 'bg-teal-500/15 text-teal-500 border-teal-500/30 shadow-md'
            }`}
          >
            <Icon className="w-7 h-7 stroke-[2]" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition active:scale-95"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 font-bold py-2.5 rounded-xl text-xs transition active:scale-95 shadow-lg ${
                isDanger
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}