'use client';

import React, { useEffect, useState } from 'react';
import { HandCoins, Lock, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import AdminDashboard from '@/components/AdminDashboard';
import { isAdminEmail, ADMIN_EMAILS } from '@/lib/admin';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-400">Checking access…</div>
      </div>
    );
  }

  const isAdmin = isAdminEmail(user && user.email ? user.email : null);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
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
            href="/"
            className="inline-flex items-center gap-1.5 bg-teal-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-teal-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to App
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
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
          <a
            href="/"
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold hover:border-teal-500/40 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to App</span>
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AdminDashboard user={user} />
      </main>
    </div>
  );
}