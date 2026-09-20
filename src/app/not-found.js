'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Map, Compass } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-teal-500/10 dark:bg-teal-500/20 blur-3xl rounded-full" />
          <h1 className="text-9xl font-display font-extrabold text-slate-200 dark:text-slate-800 tracking-tighter relative z-10">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-24 h-24 bg-white dark:bg-slate-900 rounded-full shadow-2xl border-4 border-slate-50 dark:border-slate-950">
            <Compass className="w-10 h-10 text-teal-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Lost in the wild?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We couldn't find the trip or page you were looking for. Let's get you back on the right path.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link 
            href="/app" 
            className="flex items-center justify-center gap-2 w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 rounded-2xl text-sm transition shadow-lg shadow-teal-500/20"
          >
            <Map className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 text-slate-700 dark:text-slate-300 font-semibold py-3.5 rounded-2xl text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
