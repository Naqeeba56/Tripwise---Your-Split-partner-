'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Home, Car, Coffee, ChevronDown, Check } from 'lucide-react';

export const CATEGORIES = [
  {
    id: 'Food',
    label: 'Food & Drinks',
    icon: Utensils,
    bgLight: 'bg-amber-100 text-amber-700',
    bgDark: 'dark:bg-amber-500/10 dark:text-amber-400',
  },
  {
    id: 'Stay',
    label: 'Stay & Hotels',
    icon: Home,
    bgLight: 'bg-purple-100 text-purple-700',
    bgDark: 'dark:bg-purple-500/10 dark:text-purple-400',
  },
  {
    id: 'Travel',
    label: 'Travel & Commute',
    icon: Car,
    bgLight: 'bg-blue-100 text-blue-700',
    bgDark: 'dark:bg-blue-500/10 dark:text-blue-400',
  },
  {
    id: 'Leisure',
    label: 'Activities & Fun',
    icon: Coffee,
    bgLight: 'bg-emerald-100 text-emerald-700',
    bgDark: 'dark:bg-emerald-500/10 dark:text-emerald-400',
  },
];

export default function GlassCategoryDropdown({
  selectedCategory = 'Food',
  onSelectCategory,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeCat = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const ActiveIcon = activeCat.icon;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <ActiveIcon className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span>{activeCat.label}</span>
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
            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = cat.id === selectedCategory;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                      isSelected
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 stroke-[2] flex-shrink-0" />
                      <span>{cat.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-teal-500 stroke-[3] flex-shrink-0" />
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
