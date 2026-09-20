'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaneTakeoff, Camera, X, Lock } from 'lucide-react';
import { compressToWebP } from '@/lib/imageUtils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const tripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100, 'Trip name is too long'),
  creatorName: z.string().min(1, 'Organizer name is required'),
  creatorUpi: z.string().min(1, 'UPI ID is required').regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Invalid UPI ID format'),
  dailyLimit: z.coerce.number().min(0, 'Limit must be positive').default(10000),
  expenseLimit: z.coerce.number().min(0, 'Limit must be positive').default(3000),
});

export default function NewTripModal({
  isOpen,
  onClose,
  onCreateTrip,
  userProfile,
  onOpenAuthModal,
}) {
  const [coverPic, setCoverPic] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: '',
      creatorName: userProfile?.name || 'Organizer',
      creatorUpi: userProfile?.upi_id || 'naqeeb@upi',
      dailyLimit: 10000,
      expenseLimit: 3000,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        creatorName: userProfile?.name || 'Organizer',
        creatorUpi: userProfile?.upi_id || 'naqeeb@upi',
        dailyLimit: 10000,
        expenseLimit: 3000,
      });
      setCoverPic(null);
      setError(null);
    }
  }, [isOpen, userProfile, reset]);

  if (!isOpen) return null;

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
      const webpBase64 = await compressToWebP(file, 1600, 0.85);
      setCoverPic(webpBase64);
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const onSubmit = (data) => {
    if (onCreateTrip) {
      onCreateTrip({
        name: data.name,
        image: coverPic,
        image_url: coverPic,
        creatorName: data.creatorName,
        creatorUpi: data.creatorUpi,
        daily_budget_limit: data.dailyLimit,
        expense_budget_limit: data.expenseLimit,
      });
    }
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Trip Name
              </label>
              <input
                type="text"
                placeholder="e.g. Goa Beach Expedition 2026"
                {...register('name')}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
              />
              {errors.name && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Organizer Name
                </label>
                <input
                  type="text"
                  {...register('creatorName')}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${errors.creatorName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.creatorName && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.creatorName.message}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Your UPI ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. naqeeb@upi"
                  {...register('creatorUpi')}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${errors.creatorUpi ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.creatorUpi && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.creatorUpi.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Daily Limit (₹)
                </label>
                <input
                  type="number"
                  placeholder="10000"
                  {...register('dailyLimit')}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${errors.dailyLimit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.dailyLimit && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.dailyLimit.message}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Expense Cap (₹)
                </label>
                <input
                  type="number"
                  placeholder="3000"
                  {...register('expenseLimit')}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${errors.expenseLimit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {errors.expenseLimit && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.expenseLimit.message}</p>}
              </div>
            </div>

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
