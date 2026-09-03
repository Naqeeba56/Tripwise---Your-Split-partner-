'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ChevronDown, Check } from 'lucide-react';

export default function GlassMemberDropdown({ members = [], selectedMember, onSelectMember }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeMember = members.find(
    (m) => (typeof m === 'string' ? m : m.name) === selectedMember
  );
  const displayName =
    typeof activeMember === 'string'
      ? activeMember
      : activeMember?.name || selectedMember;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition shadow-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <UserCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span className="truncate">{displayName || 'Select Member'}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-teal-500' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto space-y-1">
              {members.map((m) => {
                const memberName = typeof m === 'string' ? m : m.name;
                const avatar = typeof m === 'object' ? (m.avatar_url || m.avatar) : null;
                const isSelected = memberName === selectedMember;
                return (
                  <button
                    type="button"
                    key={memberName}
                    onClick={() => {
                      onSelectMember(memberName);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={memberName}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {memberName[0]}
                        </div>
                      )}
                      <span className="truncate">{memberName}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-teal-500 stroke-[2] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
