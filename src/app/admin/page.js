'use client';

import React, { useEffect, useState } from 'react';
import { HandCoins, Lock, ArrowLeft, Sun, Moon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import AdminDashboard from '@/components/AdminDashboard';
import { isAdminEmail, ADMIN_EMAILS } from '@/lib/admin';

const THEME_KEY = 'tripwise-admin-theme';

const readTheme = () => {
  if (typeof window === 'undefined') return true;
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved !== null) return saved === 'dark';
  return true; // default matches the main app's dark-first theme
};

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setDarkMode(readTheme());

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setUser(session.user);
        setChecking(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        setChecking(false);
      });

      return () => authListener?.subscription?.unsubscribe();
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen app-canvas flex items-center justify-center">
          <div className="text-sm text-slate-400">Checking access…</div>
        </div>
      </div>
    );
  }

  const isAdmin = isAdminEmail(user && user.email ? user.email : null);

  if (!isAdmin) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen app-canvas flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl w-max mx-auto border border-rose-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Access Denied</h1>
            <p className="text-xs text-slate-400">
              This area is restricted to the Super Admin accounts
              <span className="block font-semibold text-slate-600 dark:text-slate-300 mt-1">
                {ADMIN_EMAILS.join(' · ')}
              </span>
            </p>
            <a
              href="/app"
              className="inline-flex items-center gap-1.5 bg-teal-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-teal-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to App
            </a>
          </div>
        </div>
      </div>
    );
  }

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      window.localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch (e) {
      /* storage unavailable — ignore */
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen app-canvas text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 rounded-2xl text-slate-950 shadow-lg shadow-teal-500/20">
                <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 dark:from-teal-400 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent leading-tight">
                  Tripwise
                </h1>
                <span className="text-[10px] uppercase tracking-widest text-teal-600 dark:text-teal-400 font-semibold">
                  Admin Console
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Dark / Light mode toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title="Toggle theme"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 text-slate-600 dark:text-slate-300 transition"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-teal-600" />
                )}
              </button>

              <a
                href="/app"
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold hover:border-teal-500/40 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to App</span>
              </a>
            </div>
          </div>
        </header>

        <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <AdminDashboard user={user} />
        </main>
      </div>
    </div>
  );
}