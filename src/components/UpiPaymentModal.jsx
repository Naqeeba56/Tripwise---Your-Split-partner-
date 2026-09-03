'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, X, Check, Smartphone, ArrowRight, ShieldCheck, Copy } from 'lucide-react';
import QRCode from 'qrcode';

export default function UpiPaymentModal({
  settlement,
  creditorMember,
  onClose,
  onFinalizeUpiSettle,
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const payeeName = creditorMember?.name || settlement?.to || 'Friend';
  const payeeUpi = creditorMember?.upi_id || creditorMember?.upi || 'naqeeb@upi';
  const amount = settlement?.amount || 0;

  // UPI standard URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(payeeUpi)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Tripwise Settlement')}`;

  // Intent URLs for specific Android Apps
  const gpayIntent = `intent://pay?pa=${encodeURIComponent(payeeUpi)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Tripwise%20Settlement#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
  const phonePeIntent = `intent://pay?pa=${encodeURIComponent(payeeUpi)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Tripwise%20Settlement#Intent;scheme=upi;package=com.phonepe.app;end;`;
  const paytmIntent = `intent://pay?pa=${encodeURIComponent(payeeUpi)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Tripwise%20Settlement#Intent;scheme=upi;package=net.one97.paytm;end;`;

  useEffect(() => {
    QRCode.toDataURL(upiUri, {
      width: 200,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [upiUri]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(payeeUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!settlement) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-md shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 rounded-2xl shadow-md">
              <CreditCard className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                Direct UPI Settlement
              </h3>
              <p className="text-xs text-slate-400">
                Pay directly to recipient's UPI account
              </p>
            </div>
          </div>

          {/* Amount and Recipient Highlight Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Amount to Pay
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400 my-1">
              ₹{Number(amount).toLocaleString('en-IN')}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              To: <strong className="text-slate-900 dark:text-slate-100">{payeeName}</strong>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1 font-mono text-[11px] text-teal-600 dark:text-teal-400">
              <span>{payeeUpi}</span>
              <button
                onClick={handleCopyUpi}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Copy UPI ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copied && <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>}
            </div>
          </div>

          {/* QR Code for Desktop / Scanner */}
          {qrDataUrl && (
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
              <img src={qrDataUrl} alt="UPI QR Code" className="w-36 h-36 rounded-lg" />
              <span className="text-[10px] text-slate-400 font-bold mt-1">
                Scan with any UPI App (GPay / PhonePe / Paytm / BHIM)
              </span>
            </div>
          )}

          {/* Direct App Launch Links for Mobile */}
          <div className="space-y-2 mb-4">
            <a
              href={gpayIntent}
              onClick={() => onFinalizeUpiSettle(settlement)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-teal-500 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-500" />
                <span>Google Pay (GPay)</span>
              </div>
              <span className="text-teal-500 font-bold">Launch App →</span>
            </a>

            <a
              href={phonePeIntent}
              onClick={() => onFinalizeUpiSettle(settlement)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-purple-500 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-500" />
                <span>PhonePe</span>
              </div>
              <span className="text-purple-500 font-bold">Launch App →</span>
            </a>

            <a
              href={upiUri}
              onClick={() => onFinalizeUpiSettle(settlement)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>Default UPI / Paytm / BHIM</span>
              </div>
              <span className="text-emerald-500 font-bold">Pay via UPI →</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => onFinalizeUpiSettle(settlement)}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3 rounded-2xl text-xs sm:text-sm transition shadow-md shadow-teal-500/20"
          >
            Mark Settled Manually After Payment
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
