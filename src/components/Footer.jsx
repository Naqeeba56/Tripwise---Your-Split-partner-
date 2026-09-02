'use client';

import React from 'react';
import { HandCoins } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 sm:mt-20 border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex flex-col items-center space-y-2 w-full">
            <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 sm:p-2.5 rounded-2xl shadow-md shadow-teal-500/20 text-slate-950">
              <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="w-full overflow-hidden">
              <h3 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-teal-500 to-emerald-500 dark:from-teal-400 dark:to-emerald-300 bg-clip-text text-transparent">
                Tripwise
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Smart group expense splitting, instant UPI settlements, and AI travel budgeting.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
              <span>
                © {new Date().getFullYear()}{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  Mohd Naqeeb
                </strong>
                . All rights reserved.
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="flex items-center gap-1">
                Connect on
                <a
                  href="https://linkedin.com/in/mohdnaqeeb"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                  className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors ml-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4.983 2.821a2.188 2.188 0 1 0 0 4.376 2.188 2.188 0 1 0 0-4.376M9.237 8.855v12.139h3.769v-6.003c0-1.584.298-3.118 2.262-3.118 1.937 0 1.961 1.811 1.961 3.218v5.904H21v-6.657c0-3.27-.704-5.783-4.526-5.783-1.835 0-3.065 1.007-3.568 1.96h-.051v-1.66zm-6.142 0H6.87v12.139H3.095z" />
                  </svg>
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
