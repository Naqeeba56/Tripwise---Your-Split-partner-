'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Github,
  HandCoins,
  Heart,
  Instagram,
  Linkedin,
  MapPin,
  Mail,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  Twitter,
  Wallet,
} from 'lucide-react';

const FEATURE_LINKS = [
  { label: 'Smart Splitting', emoji: '💸', href: '#dashboard' },
  { label: 'Instant UPI Settlement', emoji: '⚡', href: '#settlements' },
  { label: 'AI Budget Estimator', emoji: '🧠', href: '#estimator' },
  { label: 'Budget Guardrails', emoji: '🛡️', href: '#dashboard' },
  { label: 'Trip Community Board', emoji: '🧭', href: '#community' },
  { label: 'PDF Receipts', emoji: '🧾', href: '#dashboard' },
];

const COMPANY_LINKS = [
  { label: 'About the maker', href: 'https://linkedin.com/in/mohdnaqeeb' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/mohdnaqeeb' },
  { label: 'GitHub', href: 'https://github.com/naqeeba56' },
  { label: 'Contact', href: 'mailto:naqeeb@gmail.com' },
  { label: 'Roadmap', href: '#dashboard' },
];

const SOCIALS = [
  { label: 'LinkedIn', Icon: Linkedin, href: 'https://linkedin.com/in/mohdnaqeeb' },
  { label: 'GitHub', Icon: Github, href: 'https://github.com/naqeeba56' },
  { label: 'Twitter', Icon: Twitter, href: 'https://twitter.com/mohdnaqeeb' },
  { label: 'Instagram', Icon: Instagram, href: 'https://instagram.com/mohdnaqeeb' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 380);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative mt-10 sm:mt-14 overflow-hidden border-t border-slate-200/70 dark:border-slate-800/60">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-accent-glow" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-warm-glow" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 footer-grain" />

      <div className="relative mx-auto max-w-app px-4 sm:px-6">
        <div className="mb-8 sm:mb-10">
          <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[1.9rem] border border-brand-500/20 bg-gradient-to-br from-brand-50 via-white to-accent-50/60 dark:from-brand-950/80 dark:via-slate-900/80 dark:to-accent-950/60 p-5 sm:p-7 shadow-soft-lift">
            <div aria-hidden="true" className="absolute inset-0 bg-brand-soft opacity-70" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-6">
              <div className="min-w-0 flex items-center gap-3 sm:gap-3.5">
                <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-2xl sm:rounded-2xl bg-brand-gradient text-slate-950 shadow-brand-glow flex items-center justify-center">
                  <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 animate-float-slow" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    Split happens.{' '}
                    <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">We settle it.</span>
                  </h2>
                  <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    No awkward “you owe me” texts. One tap, straight to UPI.
                  </p>
                </div>
              </div>
              <button type="button" onClick={scrollTop} className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold px-4 py-2.5 text-xs transition-all active:scale-95 shadow-brand-glow">
                Plan a trip
                <ArrowRight className="w-3.5 h-3.5 stroke-[2] transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 sm:gap-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-brand-gradient p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-slate-950 shadow-brand-glow">
                <HandCoins className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">
                Tripwise
              </span>
              <span className="ml-auto rounded-full border border-slate-200/80 bg-white/70 dark:bg-slate-900/70 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                v1.0 · beta
              </span>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The boring admin of travel, out of the way — so the group chat argues about where to eat, not who paid for chai.
            </p>

            <FooterChips />
          </div>

          <FooterCol title="Features" tone="💸" links={FEATURE_LINKS} />
          <FooterCol title="From the maker" tone="👋" links={COMPANY_LINKS} />

          {/* Newsletter */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Travel notes<span className="text-brand-500 dark:text-brand-300">*</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              A tiny letter when trip ideas & app updates ship. No spam, pinky promise.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2" aria-label="Newsletter signup">
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@adventure.com"
                  aria-label="Email address"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 py-2 pl-8 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-slate-950 font-bold py-2 text-[11px] transition-all active:scale-95 shadow-brand-glow"
              >
                <Send className="w-3.5 h-3.5" />
                {subscribed ? 'You’re on the list!' : 'Keep me posted'}
              </button>
            </form>

            {subscribed && (
              <p className="text-[10px] sm:text-[11px] text-brand-700 dark:text-brand-300 animate-pulse-glow">
                ✈️ See you on the next scroll. Welcome aboard!
              </p>
            )}
          </div>
        </div>

        {/* Divider + location marker */}
        <div className="mt-6 sm:mt-9 flex items-center gap-4 sm:gap-6">
          <span className="h-px border-t border-slate-200/80 dark:border-slate-800/60 flex-1" aria-hidden="true" />
          <a
            href="https://linkedin.com/in/mohdnaqeeb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Made in India · Mumbai
          </a>
          <span className="h-px border-t border-slate-200/80 dark:border-slate-800/60 flex-1" aria-hidden="true" />
        </div>

        {/* Social icons */}
        <nav className="flex items-center justify-center gap-2.5 sm:gap-3" aria-label="Social media">
          {SOCIALS.map(({ label, Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="group inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/75 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 transition-all hover:border-brand-500/40 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 active:scale-90"
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5] transition-transform group-hover:-translate-y-0.5" />
            </a>
          ))}
        </nav>

        {/* Bottom bar — the farewell line */}
        <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/70 dark:border-slate-800/60 pt-4 pb-12 sm:pb-6">
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
            © {year}
            <strong className="text-slate-800 dark:text-slate-200">Mohd Naqeeb</strong>
            · all rights reserved
          </p>

          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            built with <Heart className="w-3.5 h-3.5 fill-brand-500 text-brand-500" /> + too much chai
            <span className="hidden sm:inline">· no template, straight from the keyboard</span>
          </p>

          <button
            type="button"
            onClick={scrollTop}
            aria-label="Back to top"
            className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/85 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-soft-lift transition-all hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-300 active:scale-95 ${
              showTop ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            top
          </button>
        </div>
      </div>
    </footer>
  );
}

/* Titled link column used twice above. A plain function so the footer
   stays one file that's easy to skim. */
function FooterCol({ title, tone, links }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {tone} {title}
      </h3>
      <ul className="space-y-2">
        {links.map(({ label, href, emoji }) => (
          <li key={label}>
            <a
              href={href}
              className="group inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-200 transition-colors"
            >
              {emoji && <span aria-hidden="true" className="text-[11px]">{emoji}</span>}
              <span>{label}</span>
              <ArrowRight className="w-3 h-3 text-slate-300 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Little sticker pills under the brand blurb. */
function FooterChips() {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {[
        { icon: Wallet, label: 'Split fast', tone: 'bg-brand-500 text-slate-950 border-brand-600/30' },
        { icon: Receipt, label: 'Auto receipts', tone: 'bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950/60 dark:text-brand-200 dark:border-brand-800' },
        { icon: ShieldCheck, label: 'UPI-safe', tone: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30' },
      ].map(({ icon: C, label, tone }) => (
        <span key={label} className={`inline-flex items-center gap-1 rounded-full border font-semibold px-2 py-1 text-[9px] sm:text-[11px] ${tone}`}>
          <C className="w-3 h-3" />
          {label}
        </span>
      ))}
    </div>
  );
}
