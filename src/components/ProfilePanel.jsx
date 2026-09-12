'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Trash2,
  Plus,
  PlaneTakeoff,
  Users,
  Receipt,
  Wallet,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const initials = (name) => (name ? name.trim()[0] || 'U' : 'U');

export default function ProfilePanel({
  userProfile,
  allTrips = [],
  expenses = [],
  settlements = [],
  spentTotal = 0,
  onOpenTrip,
  onDeleteTrip,
  onCreateTrip,
}) {
  const memberCount = allTrips.reduce((s, t) => s + (t.members?.length || 0), 0);
  const currentTripExpenses = expenses.length;

  const stats = [
    { label: 'Trips', value: allTrips.length, icon: PlaneTakeoff, color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/20' },
    { label: 'Members', value: memberCount, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Active Expenses', value: currentTripExpenses, icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Amount Spent', value: inr(spentTotal), icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-transparent border border-teal-500/30 rounded-3xl p-5 sm:p-7 backdrop-blur-xl shadow-xl"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            {userProfile?.avatar || userProfile?.photoURL ? (
              <img
                src={userProfile.avatar || userProfile.photoURL}
                alt={userProfile?.name}
                loading="lazy"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-500/40 shadow-lg shadow-teal-500/10"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center text-3xl font-bold shadow-lg shadow-teal-500/20">
                {initials(userProfile?.name)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {userProfile?.name || 'Traveler'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 truncate">
                <Mail className="w-3.5 h-3.5" />
                {userProfile?.email || 'Not signed in'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {userProfile?.upi_id || userProfile?.upi ? (
                  <span className="text-[11px] sm:text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-lg font-medium">
                    UPI: {userProfile.upi_id || userProfile.upi}
                  </span>
                ) : null}
                <span className="text-[11px] sm:text-xs bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  {userProfile ? 'Signed in' : 'Guest'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onCreateTrip}
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg shadow-teal-500/20 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            New Trip
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-2xl border p-3.5 sm:p-4 bg-white dark:bg-slate-900 ${s.bg}`}>
                <div className={`flex items-center gap-1.5 ${s.color} mb-1`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{s.label}</span>
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight break-words">
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
<div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <PlaneTakeoff className="w-4 h-4 text-teal-500" />
          My Trips
          <span className="text-[11px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {allTrips.length}
          </span>
        </h3>
      </div>

      {allTrips.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <p className="text-sm text-slate-400">No trips yet. Create your first trip to get started.</p>
          <button
            onClick={onCreateTrip}
            className="mt-4 inline-flex items-center gap-1.5 bg-teal-500 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-teal-400 transition"
          >
            <Plus className="w-4 h-4" />
            Create Trip
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {allTrips.map((trip) => {
            const tMembers = trip.members?.length || 0;
            const isOwner = String(trip.createdBy) === String(userProfile?.id);
            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 hover:border-teal-500/40 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => onOpenTrip && onOpenTrip(trip.id)} className="flex items-center gap-3 min-w-0 text-left">
                    <img
                      src={trip.image_url || trip.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=200&auto=format&fit=crop'}
                      alt={trip.name}
                      loading="lazy"
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                        {trip.name}
                        {isOwner && (
                          <span className="text-[9px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded-md font-semibold hidden sm:inline">
                            Owner
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] sm:text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {tMembers} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {fmtDate(trip.created_at)}
                        </span>
                        {Number(trip.expense_budget_limit) > 0 && (
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3 h-3" /> Budget {inr(trip.expense_budget_limit)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onOpenTrip && onOpenTrip(trip.id)}
                      className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition"
                      title="Open trip"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTrip && onDeleteTrip(trip.id)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition"
                      title="Delete trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}