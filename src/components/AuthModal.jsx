'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Sparkles, X, Shield, ArrowRight, Lock } from 'lucide-react';
import { signInWithGoogle, signInWithOtp, isSupabaseConfigured } from '@/lib/supabase';
import { friendlyError } from '@/lib/errorMessages';

export default function AuthModal({ isOpen, onClose, onMockLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  // Field-level message rendered right under the input (never the browser's
  // native "Please fill out this field." bubble).
  const [emailError, setEmailError] = useState(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        // Mock sign-in fallback if no active Supabase keys yet
        if (onMockLogin) {
          onMockLogin({
            id: 'user_demo_123',
            name: 'Naqeeb',
            email: 'naqeeb@tripwise.app',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
          });
          onClose();
        }
        return;
      }

      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(friendlyError(err, 'Failed to sign in with Google. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpLogin = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setEmailError('Enter your email address to get a magic link.');
      setError(null);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setEmailError('That does not look like a valid email address.');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setEmailError(null);
    setMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        if (onMockLogin) {
          onMockLogin({
            id: 'user_' + Date.now(),
            name: value.split('@')[0],
            email: value,
            avatar: null,
          });
          onClose();
        }
        return;
      }

      const { error } = await signInWithOtp(value);
      if (error) throw error;
      setMessage('Magic login link sent to your email! Please check your inbox.');
    } catch (err) {
      setError(friendlyError(err, 'We could not send the login link. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 mx-auto mb-3 shadow-lg shadow-teal-500/20">
              <Sparkles className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Welcome to Tripwise
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in to manage your trips, track budgets, and settle splits.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              {message}
            </div>
          )}

          <div className="space-y-3.5">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-sm transition shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 absolute">
                Or with Email
              </span>
            </div>

            <form onSubmit={handleEmailOtpLogin} noValidate className="space-y-3">
              <div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'auth-email-error' : undefined}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition ${
                      emailError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {emailError && (
                  <p id="auth-email-error" className="mt-1.5 text-[11px] font-medium text-rose-500">
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Sending link...' : 'Send Magic Link'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Shield className="w-3.5 h-3.5 text-teal-500" />
            <span>Secure Supabase Authentication</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
