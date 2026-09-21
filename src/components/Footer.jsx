import React from 'react';
import Link from 'next/link';
import { PlaneTakeoff, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="bg-teal-500 text-slate-950 p-2 rounded-xl">
              <PlaneTakeoff className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-xl font-bold font-display text-slate-900 dark:text-slate-100 tracking-tight">
              Tripwise
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-teal-500 transition">Home</Link>
            <Link href="/about" className="hover:text-teal-500 transition">About</Link>
            <Link href="/privacy" className="hover:text-teal-500 transition">Privacy Policy</Link>
            <a href="mailto:support@tripwise.app" className="hover:text-teal-500 transition">Contact</a>
          </div>
          
          {/* Copyright */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by Travelers</span>
          </div>

        </div>
        <div className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Tripwise. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
