'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HandCoins,
  Share2,
  LogOut,
  Mail,
  Plus,
  Sun,
  Moon,
  PieChart,
  ArrowRightLeft,
  Users,
  Compass,
  Megaphone,
  ShieldCheck,
  UserCircle,
  Coins,
} from 'lucide-react';
import GlassTripDropdown from './GlassTripDropdown';
import { isAdminEmail } from '@/lib/admin';

export default function Header({
  trips = [],
  activeTripId,
  onSelectTrip,
  onOpenNewTripModal,
  onOpenInviteModal,
  onOpenAuthModal,
  onSignOut,
  onDeleteTrip,
  userProfile,
  darkMode,
  setDarkMode,
  activeTab,
  setActiveTab,
  settlementsCount = 0,
  membersCount = 0,
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    ...(userProfile
      ? [{ id: 'profile', label: 'My Trips', icon: UserCircle }]
      : []),
    {
      id: 'settlements',
      label: 'Settlements',
      icon: ArrowRightLeft,
      badge: settlementsCount,
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      badge: membersCount,
    },
    {
      id: 'estimator',
      label: 'AI Estimator',
      icon: Compass,
    },
    {
      id: 'community',
      label: 'Community',
      icon: Megaphone,
    },
    {
      id: 'currency',
      label: 'Currency',
      icon: Coins,
    },
  ];

  /* Mobile bottom dock — keep the active tab scrolled into view so every
     tab (incl. Currency, the last one) is reachable by a sideways swipe. */
  const tabRefs = useRef({});
  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-sm">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          {/* Brand Logo & Trip Selector */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
            <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-teal-500/20 text-slate-950 flex-shrink-0">
              <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-display bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 dark:from-teal-400 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent truncate leading-tight flex-shrink-0">
                Tripwise
              </h1>

              <div className="min-w-0">
                <GlassTripDropdown
                  trips={trips}
                  activeTripId={activeTripId}
                  onSelectTrip={onSelectTrip}
                  onOpenNewTripModal={onOpenNewTripModal}
                  onDeleteTrip={onDeleteTrip}
                  isLoggedIn={!!userProfile}
                />
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
            <button
              onClick={onOpenInviteModal}
              className="flex items-center justify-center gap-1 w-9 h-9 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 shrink-0 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 text-slate-700 dark:text-slate-300 rounded-xl sm:rounded-2xl text-xs font-semibold transition shadow-sm"
              title="Invite Friends"
              aria-label="Invite Friends"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-500" />
              <span className="hidden md:inline">Invite</span>
            </button>

            {userProfile ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-xl sm:rounded-2xl">
                  {userProfile.avatar || userProfile.photoURL ? (
                    <img
                      src={userProfile.avatar || userProfile.photoURL}
                      alt={userProfile.name}
                      loading="lazy"
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-teal-500/30"
                    />
                  ) : (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-semibold text-[9px] flex items-center justify-center">
                      {userProfile.name?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline truncate max-w-[80px]">
                    {userProfile.name}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-500 hover:bg-rose-500/20 rounded-xl text-xs font-medium transition shadow-sm"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 px-3 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-semibold transition shadow-md shadow-teal-500/15"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {userProfile && isAdminEmail(userProfile.email) && (
                <a
                  href="/admin"
                  className="flex items-center gap-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-semibold transition shadow-sm"
                  title="Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="hidden md:inline">Admin</span>
                </a>
              )}

            <button
              onClick={onOpenNewTripModal}
              className="flex items-center gap-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-semibold transition shadow-sm"
              title="Create New Trip"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span className="hidden md:inline">New Trip</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Tabs Bar (Hidden on Mobile) */}
        <div className="hidden sm:flex w-full px-3 sm:px-6 lg:px-8 border-t border-slate-200/60 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-[3px] transition-all flex-shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2]" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Floating Bottom Navigation Dock for Mobile (< 640px) */}
      <motion.nav
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.05 }}
        className="sm:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl scroll-snap-x overflow-x-auto no-scrollbar mobile-bottom-dock"
        role="tablist"
        aria-label="App sections"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              whileTap={{ scale: 0.86 }}
              className={`snap-center flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-16 px-3 py-2 rounded-2xl transition-colors relative ${
                isActive
                  ? 'text-teal-700 dark:text-teal-200'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="dock-active-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-2xl bg-teal-500/15 border border-teal-500/25"
                />
              )}
              <span className="relative">
                <Icon className="w-4 h-4 stroke-[2]" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-teal-500 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </span>
              <span className={`relative text-[9px] leading-tight whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
        <div className="snap-center flex-shrink-0 w-3" aria-hidden="true" />
      </motion.nav>
    </>
  );
}
