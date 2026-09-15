'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Camera, Plus, Check, Shield, Smartphone, Baby, PhoneCall, Trash2 } from 'lucide-react';
import { compressToWebP } from '@/lib/imageUtils';
import ConfirmModal from './ConfirmModal';

export default function MembersTab({
  trip,
  onAddMember,
  onDeleteMember,
  currentUserId,
}) {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUpi, setNewMemberUpi] = useState('');
  const [newMemberUpiNumber, setNewMemberUpiNumber] = useState('');
  const [isSubMember, setIsSubMember] = useState(false);
  const [parentMemberName, setParentMemberName] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState(null);
  const [newMemberQrCode, setNewMemberQrCode] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const confirmDeleteMember = () => {
    if (!memberToDelete) return;
    if (onDeleteMember) onDeleteMember(memberToDelete.id, memberToDelete.name);
    setMemberToDelete(null);
  };

  const existingPrimaryMembers = trip.members?.filter((m) => {
    const parent = typeof m === 'object' ? (m.parentMemberName || m.parent_member_name) : null;
    return !parent;
  }) || [];

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

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const webpBase64 = await compressToWebP(file, 600, 0.9);
      setNewMemberQrCode(webpBase64);
    } catch (err) {
      console.error('QR image upload error:', err);
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

    const parent = isSubMember ? (parentMemberName || (typeof existingPrimaryMembers[0] === 'string' ? existingPrimaryMembers[0] : existingPrimaryMembers[0]?.name)) : null;

    if (onAddMember) {
      onAddMember({
        name: newMemberName.trim(),
        avatar: newMemberAvatar,
        qr_code_url: newMemberQrCode,
        upi_id: newMemberUpi.trim() || '',
        upi_number: newMemberUpiNumber.trim() || '',
        parentMemberName: parent,
        role: parent ? 'submember' : 'member',
      });
    }

    setNewMemberName('');
    setNewMemberUpi('');
    setNewMemberUpiNumber('');
    setNewMemberQrCode(null);
    setIsSubMember(false);
    setParentMemberName('');
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
        <div className="space-y-2.5 sm:space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
          {trip.members?.map((m, idx) => {
            const name = typeof m === 'string' ? m : m.name;
            const avatar = typeof m === 'object' ? (m.avatar_url || m.avatar) : null;
            const upiId = typeof m === 'object' ? (m.upi_id || m.upi) : null;
            const upiNumber = typeof m === 'object' ? (m.upi_number || m.upiNumber) : null;
            const parentName = typeof m === 'object' ? (m.parentMemberName || m.parent_member_name) : null;
            const isCreator = name === trip.creatorName || name === trip.creator_name;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                  parentName ? 'border-amber-500/30 ml-4 sm:ml-6' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      loading="lazy"
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-teal-500/30 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold text-xs sm:text-sm flex items-center justify-center flex-shrink-0">
                      {name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {name}
                      </span>
                      {parentName && (
                        <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Baby className="w-3 h-3" />
                          Dependent of {parentName}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {upiId && (
                        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-teal-500" />
                          {upiId}
                        </span>
                      )}
                      {upiNumber && (
                        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                          <PhoneCall className="w-3 h-3 text-emerald-500" />
                          {upiNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${
                      isCreator
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                        : parentName
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCreator ? 'Organizer' : parentName ? 'Sub-Member' : 'Member'}
                  </span>
                  
                  {!isCreator && onDeleteMember && (
                    <button
                      onClick={() => {
                        const memberId = typeof m === 'object' ? m.id : null;
                        if (memberId) setMemberToDelete({ id: memberId, name });
                      }}
                      className="p-1.5 hover:bg-rose-500/15 rounded-lg transition-colors text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
                      title={`Remove ${name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Member Form */}
        <form
          onSubmit={handleFormSubmit}
          className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60"
        >
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Add New Member / Dependent
          </p>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="space-y-3">
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
                  placeholder="Member name (e.g. Rahul or Aarav)..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="UPI ID (e.g. name@upi)"
                    value={newMemberUpi}
                    onChange={(e) => setNewMemberUpi(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="UPI Mobile Number (e.g. 9876543210)"
                    value={newMemberUpiNumber}
                    onChange={(e) => setNewMemberUpiNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Custom QR Code Image Upload Button */}
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-teal-500 transition">
                    <Camera className="w-4 h-4 text-teal-500" />
                    <span>{newMemberQrCode ? '✓ Custom QR Attached' : 'Attach Personal UPI QR Code'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                  </label>
                  {newMemberQrCode && (
                    <button
                      type="button"
                      onClick={() => setNewMemberQrCode(null)}
                      className="text-[10px] text-rose-500 font-bold hover:underline"
                    >
                      Remove QR
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-Member Dependent Toggle */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={isSubMember}
                  onChange={(e) => setIsSubMember(e.target.checked)}
                  className="w-4 h-4 accent-teal-500 rounded"
                />
                <span>Add as Sub-member / Dependent (Child / Friend whose expenses are borne by another member)</span>
              </label>

              {isSubMember && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Responsible Member:</span>
                  <select
                    value={parentMemberName}
                    onChange={(e) => setParentMemberName(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    {existingPrimaryMembers.map((pm, i) => {
                      const name = typeof pm === 'string' ? pm : pm.name;
                      return (
                        <option key={i} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isCompressing}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 px-5 py-3 rounded-2xl text-xs font-semibold transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Add Member</span>
            </button>
          </div>
        </form>
      </div>

      {/* Delete Member Confirmation — in-app modal */}
      <ConfirmModal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={confirmDeleteMember}
        title="Remove member?"
        message={`Remove ${memberToDelete?.name || 'this member'} from this trip? They'll no longer be part of the sharing pool.`}
        confirmLabel="Remove Member"
        cancelLabel="Cancel"
        tone="danger"
      />
    </div>
  );
}

