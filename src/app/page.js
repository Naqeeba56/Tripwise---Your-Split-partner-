'use client';

import React from 'react';
import {
  ArrowRight,
  HandCoins,
  Sparkles,
  Receipt,
  Wallet,
  Megaphone,
  Compass,
  ShieldCheck,
  ArrowRightLeft,
  Check,
  Star,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Loved by', href: '#loved' },
  { label: 'FAQ', href: '#faq' },
];

const HERO_ART = {
  a: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=70&w=700&auto=format&fit=crop',
  b: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=70&w=700&auto=format&fit=crop',
};

export default function Home() {
  return (
    <main className="min-h-screen app-canvas text-slate-800 dark:text-slate-100 antialiased">
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/70 dark:border-slate-800/60 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="bg-brand-gradient p-2 rounded-xl text-slate-950 shadow-brand-glow"><HandCoins className="w-5 h-5" /></span>
            <span className="font-display text-xl bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">Tripwise</span>
          </a>
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-200">
            {NAV_LINKS.map((l) => <a key={l.href} href={l.href} className="transition-colors">{l.label}</a>)}
          </nav>
          <a href="/app" className="group inline-flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold px-4 py-2.5 text-xs transition-all active:scale-95 shadow-brand-glow">
            Open App <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </header>

      <div id="top" className="w-full px-4 sm:px-6 lg:px-10">
        <section className="pt-10 sm:pt-16 pb-12 sm:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200 px-3 py-1 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Group money, but make it fun
            </span>
            <h1 className="mt-4 text-3xl sm:text-5xl font-display tracking-tight text-slate-900 dark:text-slate-50">
              Split the trip, <span className="bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">settle in a tap.</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Tripwise handles the dull math of group travel — splitting, debt-minimizing and instant UPI settlement — so you're free to argue about chai spots, not who paid for the villa.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href="/app" className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold px-6 py-3.5 text-sm transition-all active:scale-95 shadow-brand-glow">
                Start splitting — it's free <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#how" className="inline-flex items-center gap-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-6 py-3.5 text-sm transition active:scale-95">
                See how it works
              </a>
            </div>
          </div>

          <div className="relative group">
            <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] bg-brand-soft opacity-80" />
            <img src={HERO_ART.a} alt="Trip screen" className="w-full h-72 sm:h-96 object-cover rounded-3xl shadow-soft-lift" />
            <img src={HERO_ART.b} alt="Budget screen" className="absolute -bottom-8 -left-6 w-2/5 rounded-2xl object-cover border border-white/40 shadow-xl" />
            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 text-white px-3 py-1 text-[11px] font-bold shadow-md">
              <Check className="w-3.5 h-3.5" /> Fully settled
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur p-5 sm:p-6 mb-14 sm:mb-20">
          {[
            { k: '₹1.2 Cr+', v: 'settled via UPI' },
            { k: '50k+', v: 'trips split' },
            { k: '98%', v: 'settle < 2 min' },
            { k: '4.9★', v: 'avg. rating' },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50">{s.k}</div>
              <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{s.v}</div>
            </div>
          ))}
        </section>

        {/* Features */}
        <section id="features" className="mb-14 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl font-display tracking-tight text-slate-900 dark:text-slate-50 text-center">
            Everything, <span className="bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">behind one trip.</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 max-w-xl mx-auto">
            Built for how groups actually travel — split fast, settle faster, argue never.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: ArrowRightLeft, title: 'Smart Splitting', tone: 'text-teal-500', blurb: 'Debt-minimized math settles everyone in the fewest transactions. No “who owes whom?” spirals.' },
              { icon: Wallet, title: 'Instant UPI Settlement', tone: 'text-emerald-500', blurb: 'Tap payment and get a ready GPay / PhonePe / BHIM deep-link with the exact amount & UPI ID.' },
              { icon: Compass, title: 'AI Budget Estimator', tone: 'text-violet-500', blurb: 'Distance-aware fare ranges for train, bus, flight, cab & bike — plus curated stays and day plans.' },
              { icon: Receipt, title: 'Auto Receipts & PDF', tone: 'text-amber-500', blurb: 'One-tap branded settlement statement, exportable the moment everyone is settled.' },
              { icon: ShieldCheck, title: 'Budget Guardrails', tone: 'text-rose-500', blurb: 'Daily & per-expense caps with glow alerts so a great trip never becomes a money surprise.' },
              { icon: Megaphone, title: 'Travel Community', tone: 'text-sky-500', blurb: 'Find co-travelers for treks, villas and road trips, or post your own next adventure.' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/80 backdrop-blur shadow-soft-lift">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${f.tone}`} />
                  </div>
                  <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-slate-100">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.blurb}</p>
                </div>
              );
            })}
          </div>
        </section>
{/* How it works */}
        <section id="how" className="mb-14 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl font-display tracking-tight text-slate-900 dark:text-slate-50 text-center">
            Three steps to <span className="bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">serene splits.</span>
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: '01', title: 'Create a trip', desc: 'Name it, drop a cover, invite friends with a shareable link.' },
              { n: '02', title: 'Log expenses together', desc: 'Snap an amount, pick who paid, exclude who wasn’t there.' },
              { n: '03', title: 'Settle in one tap', desc: 'Watch debts minimize, then pay the exact amount via UPI.' },
            ].map((s) => (
              <div key={s.n} className="relative p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/80 backdrop-blur shadow-soft-lift">
                <span className="font-display text-xl text-brand-600 dark:text-brand-400 absolute top-4 right-4">{s.n}</span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Showcase */}
        <section id="showcase" className="mb-14 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl font-display tracking-tight text-slate-900 dark:text-slate-50 text-center">
            One app, <span className="bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">every screen.</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 max-w-lg mx-auto">
            A taste of the real product — right here on your screen before you even sign in.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { img: HERO_ART.a, cap: 'Expense feed — log & split in seconds', tag: 'Split' },
              { img: HERO_ART.b, cap: 'AI budget — distance-aware fare ranges', tag: 'Estimate' },
              { img: HERO_ART.a, cap: 'Settlements — minimal transfers, one tap UPI', tag: 'Settle' },
            ].map((c) => (
              <figure key={c.cap} className="group rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/60 shadow-soft-lift">
                <img src={c.img} alt={c.cap} className="w-full h-48 object-cover group-hover:scale-105 transition duration-700" />
                <figcaption className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{c.cap}</span>
                  <span className="shrink-0 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 px-2 py-0.5 text-[9px] font-bold">{c.tag}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Loved by */}
        <section id="loved" className="mb-14 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl font-display tracking-tight text-slate-900 dark:text-slate-50 text-center">
            Loved by <span className="bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">actual groups.</span>
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { q: 'We split a 12-day Spiti roadtrip between six people and the settlement took under two minutes. Actual magic.', who: 'Riya & squad', meta: 'Goa – Spiti roadtrip' },
              { q: 'The AI estimator nailed our Goa budget within ₹500. The fare ranges per mode are so clever.', who: 'Aman', meta: 'Budget planner' },
              { q: 'No more “you owe me” texts. The UPI deep-links alone are worth it.', who: 'Priya', meta: 'Frequent trekker' },
            ].map((t) => (
              <div key={t.who} className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/80 backdrop-blur shadow-soft-lift">
                <div className="flex gap-0.5 text-amber-400">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">“{t.q}”</p>
                <div className="mt-3 text-[11px] font-bold text-slate-800 dark:text-slate-200">{t.who}</div>
                <div className="text-[10px] text-slate-400">{t.meta}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-14 sm:mb-20 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-display tracking-tight text-slate-900 dark:text-slate-50 text-center">
            Fair <span className="bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">questions.</span>
          </h2>
          <div className="mt-8 space-y-3">
            {[
              { q: 'Is Tripwise free?', a: 'Yes. Creating trips, splitting expenses and estimating budgets are free. We plan optional premium insights later.' },
              { q: 'How does my money move?', a: 'We never touch your money. Tripwise only builds deep-links into your own GPay/PhonePe/BHIM — you approve every payment.' },
              { q: 'Do I need an account?', a: 'You can explore without one. To create trips and track settlements you sign in with Google or a magic email link.' },
              { q: 'Does the PDF work when not everyone has paid?', a: 'Yes — it shows an active statement with a live progress bar, and flips to a “TRIP COMPLETE” ribbon once everything is settled.' },
            ].map((f) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200/80 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/80 backdrop-blur">
                <summary className="cursor-pointer flex items-center justify-between py-3.5 px-4 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {f.q}<span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-[2rem] border border-brand-500/20 bg-gradient-to-br from-brand-50 via-white to-emerald-50/50 dark:from-brand-950/80 dark:via-slate-900/80 dark:to-slate-950 p-8 sm:p-12 text-center shadow-soft-lift mb-12">
          <div aria-hidden="true" className="absolute inset-0 bg-brand-soft opacity-70" />
          <h2 className="relative text-2xl sm:text-4xl font-display tracking-tight text-slate-900 dark:text-slate-50">
            Next trip can’t plan itself — <span className="bg-gradient-to-r from-brand-600 to-emerald-500 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent">but Tripwise can.</span>
          </h2>
          <a href="/app" className="relative mt-2 inline-flex items-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold px-7 py-3.5 text-sm transition-all active:scale-95 shadow-brand-glow">
            Open Tripwise — it’s free <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      </div>

      <footer className="border-t border-slate-200/70 dark:border-slate-800/60 mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-brand-gradient p-1.5 rounded-lg text-slate-950"><HandCoins className="w-4 h-4" /></span>
            <span className="font-display text-sm text-slate-800 dark:text-slate-200">Tripwise</span>
            <span className="text-[10px] text-slate-400 ml-1">© 2026 Mohd Naqeeb</span>
          </div>
          <nav className="flex items-center gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <a href="/about" className="hover:text-brand-600 dark:hover:text-brand-300 transition-colors">About</a>
            <a href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-300 transition-colors">Privacy Policy</a>
            <a href="/app" className="hover:text-brand-600 dark:hover:text-brand-300 transition-colors">Open App</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}