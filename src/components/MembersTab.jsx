'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Camera, Plus, Check, Shield, Smartphone } from 'lucide-react';
import { compressToWebP } from '@/lib/imageUtils';

export default function MembersTab({
  trip,
  onAddMember,
  currentUserId,
}) {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUpi, setNewMemberUpi] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const webpBase64 = await compressToWebP(file, 400, 0.85);
      setNewMemberAvatar(webpBase64);
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setError('Member name cannot be empty.');
      return;
    }

    const memberExists = trip.members?.some((m) => {
      const name = typeof m === 'string' ? m : m.name;
      return name.toLowerCase() === newMemberName.trim().toLowerCase();
    });

    if (memberExists) {
      setError('A member with this name already exists in the trip.');
      return;
    }

    if (onAddMember) {
      onAddMember({
        name: newMemberName.trim(),
        avatar: newMemberAvatar,
        upi_id: newMemberUpi.trim() || 'naqeeb@upi',
      });
    }

    setNewMemberName('');
    setNewMemberUpi('');
    setNewMemberAvatar(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-7 shadow-sm">
        <h2 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 sm:mb-5 flex items-center gap-2.5">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
          <span>Trip Members ({trip.members?.length || 0})</span>
        </h2>

        {/* Member Roster List */}
        <div className="space-y-2.5 sm:space-y-3 mb-6">
          {trip.members?.map((m, idx) => {
            const name = typeof m === 'string' ? m : m.name;
            const avatar = typeof m === 'object' ? (m.avatar_url || m.avatar) : null;
            const upiId = typeof m === 'object' ? (m.upi_id || m.upi) : null;
            const isCreator = name === trip.creatorName || name === trip.creator_name;

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-teal-500/30 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold text-xs sm:text-sm flex items-center justify-center flex-shrink-0">
                      {name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {name}
                    </span>
                    {upiId && (
                      <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-teal-500" />
                        {upiId}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    isCreator
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCreator ? 'Organizer' : 'Member'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Add Member Form with WebP avatar conversion */}
        <form
          onSubmit={handleFormSubmit}
          className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60"
        >
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Add New Member
          </p>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Avatar Upload Button */}
            <label className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-teal-500 transition overflow-hidden flex-shrink-0 self-center sm:self-auto">
              {newMemberAvatar ? (
                <img
                  src={newMemberAvatar}
                  alt="Avatar preview"
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

            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Member name..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                required
              />
              <input
                type="text"
                placeholder="UPI ID (e.g. member@okaxis, optional)"
                value={newMemberUpi}
                onChange={(e) => setNewMemberUpi(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={isCompressing}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-5 py-3 rounded-2xl text-xs font-semibold transition shadow-sm self-stretch sm:self-center flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
