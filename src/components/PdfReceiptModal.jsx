'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, FileText, X, Check, ExternalLink } from 'lucide-react';
import { generateTripPdfReceipt } from '@/lib/pdfGenerator';

export default function PdfReceiptModal({
  isOpen,
  onClose,
  trip,
  expenses = [],
  settlements = [],
  settlementDetailsMap = {},
  settledIds = [],
  netBalances = {},
  totalSpent = 0,
  perPersonShare = 0,
}) {
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      const doc = generateTripPdfReceipt(
        trip,
        expenses,
        settlements,
        settlementDetailsMap,
        settledIds,
        netBalances,
        totalSpent,
        perPersonShare
      );
      const filename = `Tripwise_${(trip.name || 'Statement').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tripwise.app';
    const shareText = `*Tripwise Settlement Summary: ${trip.name}*\nTotal Group Spend: ₹${totalSpent.toLocaleString('en-IN')}\nEqual Share: ₹${Math.round(perPersonShare).toLocaleString('en-IN')}\nView & Join Trip: ${origin}/trip/join/${trip.invite_token || trip.inviteToken || 'tripwise'}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl relative space-y-4"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 rounded-2xl shadow-md">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Official Settlement Statement
              </h3>
              <p className="text-xs text-slate-400">
                Generate & export branded PDF split summary for {trip.name}
              </p>
            </div>
          </div>

          {/* Statement Quick Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Trip Name</span>
              <strong className="text-slate-900 dark:text-slate-100">{trip.name}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Total Group Spend</span>
              <strong className="text-slate-900 dark:text-slate-100">₹{totalSpent.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Per-Person Fair Share</span>
              <strong className="text-teal-600 dark:text-teal-400">₹{Math.round(perPersonShare).toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Settlement Status</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                {settledIds.length} / {settlements.length} Settled
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 stroke-[2]" />
              <span>{downloading ? 'Compiling PDF...' : 'Download Official PDF Receipt'}</span>
            </button>

            <button
              onClick={handleCopyShareLink}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-3.5 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500 stroke-[2]" />
                  <span className="text-emerald-500">Summary Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-teal-500" />
                  <span>Copy Shareable Trip Summary Link</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
