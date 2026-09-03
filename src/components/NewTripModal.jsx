'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaneTakeoff, Camera, X, Lock, Sliders, Shield } from 'lucide-react';
import { compressToWebP } from '@/lib/imageUtils';

export default function NewTripModal({
  isOpen,
  onClose,
  onCreateTrip,
  userProfile,
  onOpenAuthModal,
}) {
  const [name, setName] = useState('');
  const [creatorName, setCreatorName] = useState(userProfile?.name || 'Organizer');
  const [creatorUpi, setCreatorUpi] = useState(userProfile?.upi_id || 'naqeeb@upi');
  const [coverPic, setCoverPic] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(10000);
  const [expenseLimit, setExpenseLimit] = useState(3000);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Requirement 9: Mandatory login check for creating trips
  if (!userProfile) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center relative space-y-4"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30 shadow-md">
              <Lock className="w-7 h-7 stroke-[2]" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Sign In Required
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              You must be logged in with your account to create and manage shared trips on Tripwise.
            </p>

            <div className="pt-2 space-y-2.5">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAuthModal) onOpenAuthModal();
                }}
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20"
              >
                Sign In with Google / Email
              </button>
              <button
                onClick={onClose}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-2xl text-xs transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      // Requirement 11: Convert image to WebP format
      const webpBase64 = await compressToWebP(file, 1600, 0.85);
      setCoverPic(webpBase64);
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Trip name is required.');
      return;
    }

    if (onCreateTrip) {
      onCreateTrip({
        name: name.trim(),
        image: coverPic,
        image_url: coverPic,
        creatorName: creatorName.trim() || userProfile.name || 'Organizer',
        creatorUpi: creatorUpi.trim() || 'naqeeb@upi',
        daily_budget_limit: Number(dailyLimit) || 10000,
        expense_budget_limit: Number(expenseLimit) || 3000,
      });
    }

    setName('');
    setCoverPic(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-teal-500/10 text-teal-500 rounded-2xl border border-teal-500/20">
                <PlaneTakeoff className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Create New Trip
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Trip Name
              </label>
              <input
                type="text"
                placeholder="e.g. Goa Beach Expedition 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Organizer Name
                </label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Your UPI ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. naqeeb@upi"
                  value={creatorUpi}
                  onChange={(e) => setCreatorUpi(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Budget Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Daily Limit (₹)
                </label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Expense Cap (₹)
                </label>
                <input
                  type="number"
                  value={expenseLimit}
                  onChange={(e) => setExpenseLimit(e.target.value)}
                  placeholder="3000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Cover Banner Upload with WebP conversion */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Trip Cover Banner (Auto WebP format)
              </label>
              <div className="flex items-center gap-3">
                <label className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer hover:border-teal-500 transition overflow-hidden flex-shrink-0">
                  {coverPic ? (
                    <img
                      src={coverPic}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400">
                  {coverPic
                    ? 'Cover image converted to WebP'
                    : 'Upload banner photo'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-2xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCompressing}
                className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3 rounded-2xl text-xs transition shadow-lg shadow-teal-500/20"
              >
                {isCompressing ? 'Processing Image...' : 'Save & Start Trip'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
