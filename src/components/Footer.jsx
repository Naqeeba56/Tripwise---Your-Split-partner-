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
  Mail,
  Twitter,
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
  { label: 'About', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/mohdnaqeeb' },
  { label: 'GitHub', href: 'https://github.com/naqeeba56' },
  { label: 'Contact', href: 'mailto:naqeeb@gmail.com' },
];

const SOCIALS = [
  { label: 'LinkedIn', Icon: Linkedin, href: 'https://linkedin.com/in/mohdnaqeeb' },
  { label: 'GitHub', Icon: Github, href: 'https://github.com/naqeeba56' },
  { label: 'Twitter', Icon: Twitter, href: 'https://twitter.com/mohdnaqeeb' },
  { label: 'Instagram', Icon: Instagram, href: 'https://instagram.com/mohdnaqeeb' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 380);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative mt-10 sm:mt-14 overflow-hidden border-t border-slate-200/70 dark:border-slate-800/60">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-accent-glow" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-warm-glow" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 footer-grain" />

      <div className="relative mx-auto max-w-app px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-lg sm:text-2xl font-display tracking-tight text-slate-900 dark:text-slate-50">
            Split trips, <span className="bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">settle faster.</span>
          </h2>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            One tap, straight to UPI. No awkward “you owe me” texts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 sm:gap-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-brand-gradient p-2 rounded-xl text-slate-950 shadow-brand-glow">
                <HandCoins className="w-5 h-5" />
              </div>
              <span className="font-display text-lg bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">
                Tripwise
              </span>
              <span className="ml-auto rounded-full border border-slate-200/80 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                v1.0
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              The boring admin of travel, out of the way — so the group chat argues about where to eat, not who paid for chai.
            </p>
          </div>

          <FooterCol title="Features" tone="💸" links={FEATURE_LINKS} />
          <FooterCol title="From the maker" tone="👋" links={COMPANY_LINKS} />

          {/* Say hi / socials */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Say hi 👋
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Questions, ideas, or just want to say hello?
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIALS.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 transition-all hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 active:scale-90"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <a
              href="mailto:naqeeb@gmail.com"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              naqeeb@gmail.com
            </a>
          </div>
        </div>

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
