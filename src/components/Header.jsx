'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  MoreHorizontal,
  X,
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  // Split tabs for mobile view
  const primaryTabs = tabs.slice(0, 4);
  const moreTabs = tabs.slice(4);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-sm">
        <div className="w-full px-2.5 sm:px-6 lg:px-8 py-2 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Trip Selector */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
            <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-teal-500/20 text-slate-950 shrink-0">
              <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
              {/* Wordmark is hidden on very narrow phones so the trip selector
                  and the action icons can never collide. */}
              <h1 className="hidden min-[420px]:block text-lg sm:text-2xl md:text-3xl font-display bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 dark:from-teal-400 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent truncate leading-tight shrink-0">
                Tripwise
              </h1>

              {/* The only flexible item in the row: it truncates instead of
                  pushing the icon cluster off-screen. */}
              <div className="min-w-0 flex-1 max-w-[220px] sm:max-w-sm">
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

          {/* Right Controls — uniform 8x8 tap targets on phones so nothing
              overlaps; labels appear from `md` upwards. */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={onOpenInviteModal}
              className="flex items-center justify-center gap-1 w-8 h-8 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 shrink-0 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 text-slate-700 dark:text-slate-300 rounded-xl sm:rounded-2xl text-xs font-semibold transition shadow-sm"
              title="Invite Friends"
              aria-label="Invite Friends"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-500" />
              <span className="hidden md:inline">Invite</span>
            </button>

            {userProfile ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-xl sm:rounded-2xl">
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
                  className="flex items-center justify-center gap-1 w-8 h-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-500 hover:bg-rose-500/20 rounded-xl text-xs font-medium transition shadow-sm shrink-0"
                  title="Sign Out"
                  aria-label="Sign Out"
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
                  className="flex items-center justify-center gap-1 w-8 h-8 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 rounded-xl sm:rounded-2xl text-xs font-semibold transition shadow-sm shrink-0"
                  title="Admin Dashboard"
                  aria-label="Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="hidden md:inline">Admin</span>
                </a>
              )}

            <button
              onClick={onOpenNewTripModal}
              className="flex items-center justify-center gap-1 w-8 h-8 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 rounded-xl sm:rounded-2xl text-xs font-semibold transition shadow-sm shrink-0"
              title="Create New Trip"
              aria-label="Create New Trip"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span className="hidden md:inline">New Trip</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto p-0 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
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
      <nav
        className="sm:hidden fixed bottom-3 left-3 right-3 z-[60] flex flex-row items-center justify-around gap-1 px-2 pt-1 pb-1 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl mobile-bottom-dock"
        role="tablist"
        aria-label="App sections"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowMoreMenu(false);
              }}
              role="tab"
              aria-selected={isActive}
              className={`flex-1 flex flex-col items-center justify-center gap-1 min-w-[64px] px-1 py-2 rounded-2xl transition-colors relative ${
                isActive
                  ? 'text-teal-700 dark:text-teal-300'
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
                <Icon className="w-5 h-5 stroke-[2]" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500 text-slate-950 leading-none">
                    {tab.badge}
                  </span>
                )}
              </span>
              <span className={`relative text-[10px] leading-tight whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More Button */}
        {moreTabs.length > 0 && (
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-w-[64px] px-1 py-2 rounded-2xl transition-colors relative ${
              showMoreMenu
                ? 'text-teal-700 dark:text-teal-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {showMoreMenu && (
              <motion.span
                layoutId="dock-active-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-2xl bg-teal-500/15 border border-teal-500/25"
              />
            )}
            <span className="relative">
              {showMoreMenu ? <X className="w-5 h-5 stroke-[2]" /> : <MoreHorizontal className="w-5 h-5 stroke-[2]" />}
            </span>
            <span className={`relative text-[10px] leading-tight whitespace-nowrap ${showMoreMenu ? 'font-bold' : 'font-medium'}`}>
              More
            </span>
          </button>
        )}
      </nav>

      {/* More Menu Dropup */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="sm:hidden fixed bottom-[5.5rem] right-4 z-[55] w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex flex-col">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
