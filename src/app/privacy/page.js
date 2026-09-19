import Link from 'next/link';
import { HandCoins, ShieldCheck, Mail } from 'lucide-react';

const effective = '25 September 2026';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Tripwise collects, uses and protects your personal data, in line with India’s Digital Personal Data Protection Act (DPDP) 2023.',
};

const SECTIONS = [
  { h: '1. Who we are', body: 'Tripwise (“we”, “our”) is a group expense-splitting and UPI settlement platform. Under the Digital Personal Data Protection Act, 2023 (“DPDP Act”), we act as a Data Fiduciary processing limited personal data from Data Principals (you).' },
  { h: '2. What data we collect', body: 'We collect the minimum needed to run the product: your name and email (authentication), your UPI ID / UPI phone number (only as you share it to receive payments), trip names and cover images you upload, expense and settlement records you add, and your selected destination in the AI Budget Estimator. We never collect payment card or bank credentials — money never passes through Tripwise.' },
  { h: '3. Why we collect it (purpose)', body: 'Each element serves a clear purpose: authentication (email), enabling peer-to-peer settlement (UPI ID), showing your split dashboard (trip/expense records), and generating a budget estimate (destination). We never process data for any purpose other than the one you were informed of.' },
  { h: '4. How we collect it (lawful basis / consent)', body: 'We process your data only with your free, specific, informed and unconditional consent, which you may withdraw at any time. Signing in and sharing settlement IDs are voluntary acts of consent.' },
  { h: '5. What we do NOT do', body: 'We do not buy or sell personal data, use it for ad profiling, or share it with third parties for marketing. We do not process sensitive personal data such as biometrics, health, or financial account credentials.' },
  { h: '6. Your rights as a Data Principal', body: 'You may (a) access your data, (b) request correction or erasure, (c) request a summary of processing, (d) nominate a person to exercise rights for you after death or incapacity, and (e) withdraw consent or file a grievance. Write to us and we will act within statutory timelines.' },
  { h: '7. Data retention', body: 'We keep data only as long as needed for the service. You may delete trips (removing their expense and settlement records) or request full erasure anytime. After erasure we do not knowingly retain a copy beyond what is lawfully needed, kept stripped of identifiers.' },
  { h: '8. Security', body: 'We use encryption in transit (HTTPS/TLS), store credentials only with our authentication provider, and restrict access to production data. Safeguards are proportionate to the data we hold.' },
  { h: '9. Children’s data', body: 'Tripwise is not directed at children and we do not knowingly collect a child’s data below age 18 without a lawful guardian’s consent. If notified, we will delete it promptly.' },
  { h: '10. Third parties', body: 'We use sub-processors — notably Supabase (authentication & database) and Google (sign-in via OAuth, plus map/place data in the Budget Estimator). They act on our instructions and under this policy. Typing a destination may send it to the Google Places API to return fares, photos and landmarks.' },
  { h: '11. Cookies & local storage', body: 'We may use essential cookies and browser local storage to keep you signed in and preserve your active trip. We do not use invasive tracking cookies or sell browsing data.' },
  { h: '12. Grievance & contact / updates', body: 'For any request or complaint, email the Grievance Officer below; we respond within the period prescribed by the DPDP Act. Material policy updates are noted here with a new effective date.' },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen app-canvas text-slate-800 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline">
          ← Back to home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="bg-brand-gradient p-2.5 rounded-2xl text-slate-950 shadow-brand-glow"><HandCoins className="w-6 h-6" /></span>
          <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-slate-50">Privacy Policy</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Effective {effective} · Prepared to align with India’s DPDP Act, 2023.</p>

        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-brand-500/20 bg-brand-50 dark:bg-brand-950/50 text-brand-800 dark:text-brand-200 text-xs leading-relaxed">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Short version: we collect the minimum needed to split and settle trips, never touch your money or sell your data, and you can delete anything at any time.</span>
        </div>
{SECTIONS.map((s) => (
          <section key={s.h} className="mt-7">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{s.h}</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.body}</p>
          </section>
        ))}

        <div className="mt-10 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/80">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Mail className="w-4 h-4 text-brand-500" /> Grievance Officer / Data Protection Officer</h2>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            For data access, correction, erasure, consent withdrawal, or grievance write to:{' '}
            <a href="mailto:naqeeb@gmail.com" className="text-brand-600 dark:text-brand-300 font-semibold hover:underline">naqeeb@gmail.com</a>
          </p>
        </div>
      </div>
    </main>
  );
}