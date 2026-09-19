import Link from 'next/link';
import { HandCoins, Heart, Mail, MapPin, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'About',
  description: 'The story and people behind Tripwise — a travel community that splits group expenses and settles them in a tap.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen app-canvas text-slate-800 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline">
          ← Back to home
        </Link>

        <header className="mt-6 flex items-center gap-3">
          <span className="bg-brand-gradient p-2.5 rounded-2xl text-slate-950 shadow-brand-glow"><HandCoins className="w-6 h-6" /></span>
          <div>
            <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-slate-50">About Tripwise</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">The boring admin of travel, out of the way.</p>
          </div>
        </header>

        <div className="mt-8 space-y-6">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            Tripwise started with one very familiar argument: after a trip ends, nobody quite remembers who paid for what — and the “you owe me” texts never stop. So we built the layer that did the dull, precise work instead.
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Today Tripwise is a travel-minded finance tool that splits grouped expenses, minimizes debt transfers, and drops you straight into your own GPay / PhonePe / BHIM to settle — plus an AI budget estimator that turns a destination into live fare ranges, curated stays and a day-by-day plan.
          </p>

          <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/80 flex items-start gap-3">
            <span className="bg-brand-500/10 text-brand-500 p-2 rounded-xl"><Sparkles className="w-4 h-4" /></span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Why we built it</h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                So the group chat goes back to mattering about the good stuff — where to eat, which trek, who’s driving — instead of spreadsheets and payment gossip.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/80 flex items-start gap-3">
            <span className="bg-brand-500/10 text-brand-500 p-2 rounded-xl"><Heart className="w-4 h-4" /></span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Made by hand</h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Built with care (and plenty of chai) by <strong>Mohd Naqeeb</strong> from Mumbai, India. No template, straight from the keyboard — finite numbers, human details.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/80 flex items-start gap-3">
            <span className="bg-brand-500/10 text-brand-500 p-2 rounded-xl"><MapPin className="w-4 h-4" /></span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Where we are</h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Made in India 🇮🇳. Reach out anytime at <a href="mailto:naqeeb@gmail.com" className="text-brand-600 dark:text-brand-300 font-semibold hover:underline">naqeeb@gmail.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}