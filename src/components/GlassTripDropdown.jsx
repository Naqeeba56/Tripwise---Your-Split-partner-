'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaneTakeoff, ChevronDown, Check, Plus } from 'lucide-react';

export default function GlassTripDropdown({
  trips,
  activeTripId,
  onSelectTrip,
  onOpenNewTripModal,
  isLoggedIn,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeTrip = trips.find((t) => String(t.id) === String(activeTripId)) || trips[0];

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
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-teal-500/40 dark:hover:border-teal-400/40 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none max-w-[130px] sm:max-w-xs"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {activeTrip?.image_url || activeTrip?.image ? (
            <img
              src={activeTrip.image_url || activeTrip.image}
              alt={activeTrip.name}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-md object-cover border border-teal-500/30 flex-shrink-0"
            />
          ) : (
            <PlaneTakeoff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
          )}
          <span className="text-[11px] sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
            {activeTrip?.name || 'Select Trip'}
          </span>
        </div>
        <ChevronDown
          className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-teal-500' : ''
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 mt-2 w-64 sm:w-72 origin-top-left rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 overflow-hidden"
          >
            <div className="px-3.5 py-2 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Switch Trip ({trips.length})
              </span>
            </div>

            <div className="py-1.5 space-y-1 max-h-60 overflow-y-auto">
              {trips.map((trip) => {
                const isSelected = String(trip.id) === String(activeTripId);
                const cover = trip.image_url || trip.image;
                return (
                  <motion.button
                    type="button"
                    key={trip.id}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      onSelectTrip(trip.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 sm:py-3 rounded-2xl text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-extrabold shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {cover ? (
                        <img
                          src={cover}
                          alt={trip.name}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {trip.name[0]}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm truncate font-extrabold">
                          {trip.name}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {trip.members?.length || 0} members
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenNewTripModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-xs transition border border-teal-500/30"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Create New Trip</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
