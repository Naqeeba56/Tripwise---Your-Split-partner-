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
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Testimonials', href: '#loved' },
];

const HERO_ART = {
  a: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=70&w=700&auto=format&fit=crop',
  b: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=70&w=700&auto=format&fit=crop',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased selection:bg-teal-500/30 selection:text-teal-900 dark:selection:text-teal-100">
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 group">
            <span className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 rounded-xl text-slate-950 shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition">
              <HandCoins className="w-5 h-5 stroke-[2]" />
            </span>
            <span className="font-bold text-xl tracking-tight">Tripwise</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>
          <a href="/app" className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold px-5 py-2.5 text-sm transition-all active:scale-95 shadow-md">
            Launch App <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </header>

      <div id="top" className="max-w-6xl mx-auto px-6 pt-32 pb-16">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[60vh]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-3 py-1.5 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> 
              <span>Group travel, minus the money drama</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Split the trip,<br />
              <span className="bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">settle in a tap.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              Tripwise handles the complex math of group expenses — minimizing debts and generating instant UPI settlements — so you can focus on the journey.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a href="/app" className="inline-flex justify-center items-center gap-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-7 py-3.5 text-sm transition-all active:scale-95 shadow-lg shadow-teal-500/25">
                Start splitting <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#how" className="inline-flex justify-center items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-7 py-3.5 text-sm transition active:scale-95">
                See how it works
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative lg:ml-auto w-full max-w-md"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 blur-3xl rounded-[3rem]" />
            <div className="relative rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl">
              <img src={HERO_ART.a} alt="Trip Dashboard" className="w-full h-80 object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/90 to-transparent p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">Goa Getaway</p>
                    <p className="text-teal-400 text-sm font-medium">₹12,450 settled</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Element */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-8 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4"
            >
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sarah paid you</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">₹2,400 via UPI</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { k: '₹1.2 Cr+', v: 'Settled via UPI' },
            { k: '50k+', v: 'Trips Split' },
            { k: '98%', v: 'Settle < 2 min' },
            { k: '4.9/5', v: 'User Rating' },
          ].map((s, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              key={s.v} 
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm text-center"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{s.k}</div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{s.v}</div>
            </motion.div>
          ))}
        </section>

        {/* Features */}
        <section id="features" className="mt-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Powerful tools, beautifully simple.
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Everything you need to plan, track, and settle group expenses without the spreadsheet headache.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ArrowRightLeft, title: 'Smart Splitting', blurb: 'Advanced algorithms minimize total transactions between friends automatically.' },
              { icon: Wallet, title: '1-Tap UPI Settlement', blurb: 'Generates direct payment links for GPay/PhonePe with pre-filled exact amounts.' },
              { icon: Compass, title: 'AI Budget Planner', blurb: 'Get accurate travel cost estimates for flights, trains, and stays before you go.' },
              { icon: Receipt, title: 'Exportable Reports', blurb: 'Download clean PDF summaries of all trip expenses and settlements.' },
              { icon: ShieldCheck, title: 'Budget Guardrails', blurb: 'Set daily spending limits and get gentle warnings before you overspend.' },
              { icon: Megaphone, title: 'Community Board', blurb: 'Find like-minded travelers for your next big adventure or road trip.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={f.title} 
                  className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.blurb}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-32">
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                How Tripwise works
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Three simple steps from trip creation to everyone being fully settled up.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { n: '1', title: 'Create & Invite', desc: 'Set up a trip instantly and share the invite link with your crew.' },
                { n: '2', title: 'Log Expenses', desc: 'Add costs as you go. Split equally or adjust for specific people.' },
                { n: '3', title: 'Settle Instantly', desc: 'Review optimized balances and pay exactly what you owe via UPI.' },
              ].map((s, i) => (
                <div key={s.n} className="text-center">
                  <div className="w-16 h-16 mx-auto bg-slate-800 border border-slate-700 text-teal-400 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                    {s.n}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-32 mb-16">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border border-teal-100 dark:border-teal-900/50 rounded-[3rem] p-10 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
              Ready to travel smarter?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10">
              Join thousands of travelers who use Tripwise to keep their friendships intact and their budgets on track.
            </p>
            <a href="/app" className="inline-flex justify-center items-center gap-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-8 py-4 text-base transition-all active:scale-95 shadow-lg shadow-teal-500/25">
              Launch Tripwise Free <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-1.5 rounded-lg text-slate-950">
              <HandCoins className="w-4 h-4 stroke-[2]" />
            </span>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">Tripwise</span>
            <span className="text-xs text-slate-400 ml-2">© 2026</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            <a href="/privacy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy Policy</a>
            <a href="/about" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">About</a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Twitter</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}