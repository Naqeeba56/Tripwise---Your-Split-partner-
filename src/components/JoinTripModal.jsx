'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Camera, X, Check, Smartphone, ArrowRight } from 'lucide-react';
import { compressToWebP } from '@/lib/imageUtils';

export default function JoinTripModal({
  isOpen,
  tripName,
  inviteToken,
  onJoin,
  onClose,
}) {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const webpBase64 = await compressToWebP(file, 400, 0.85);
      setAvatar(webpBase64);
    } catch (err) {
      console.error('Avatar WebP compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!upiId.trim()) {
      setError('Please provide your UPI ID, GPay ID, or phone number for settlements.');
      return;
    }

    if (onJoin) {
      onJoin({
        name: name.trim(),
        avatar: avatar,
        upi_id: upiId.trim(),
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-500 flex items-center justify-center mx-auto mb-3 border border-teal-500/30">
              <Users className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Join {tripName || 'Shared Trip'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your details so friends can split and settle expenses with you.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Avatar WebP Upload */}
            <div className="flex flex-col items-center justify-center gap-2">
              <label className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-teal-500 transition overflow-hidden relative shadow-sm">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[9px] font-bold uppercase">Add Photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Photo converted to WebP
              </span>
            </div>

            {/* Member Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            {/* UPI ID / GPay / Number */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                UPI ID / GPay / UPI Number
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. alex@okaxis or 9876543210@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Used when members pay back what they owe you directly.
              </p>
            </div>

            <button
              type="submit"
              disabled={isCompressing}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <span>{isCompressing ? 'Compressing Photo...' : 'Join Trip & Open Dashboard'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
