'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Sliders,
  BellRing,
  PieChart,
  Utensils,
  Home,
  Car,
  Coffee,
} from 'lucide-react';
import { pulseAlert, animateCircleProgress } from '@/lib/animeAnimations';

export default function BudgetTracker({
  trip,
  expenses = [],
  onUpdateBudgetLimits,
}) {
  const dailyLimit = Number(trip.daily_budget_limit || 10000);
  const expenseLimit = Number(trip.expense_budget_limit || 3000);

  const [isEditing, setIsEditing] = useState(false);
  const [newDailyLimit, setNewDailyLimit] = useState(dailyLimit);
  const [newExpenseLimit, setNewExpenseLimit] = useState(expenseLimit);

  const circleRef = useRef(null);
  const alertContainerRef = useRef(null);

  // Today's spending
  const todayDateStr = new Date().toDateString();
  const todayExpenses = expenses.filter((e) => {
    const expDate = e.date ? new Date(e.date).toDateString() : todayDateStr;
    return expDate === todayDateStr;
  });

  const todaySpent = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const percentUsed = dailyLimit > 0 ? Math.round((todaySpent / dailyLimit) * 100) : 0;
  const isBreached = dailyLimit > 0 && todaySpent > dailyLimit;
  const isWarning = dailyLimit > 0 && todaySpent >= dailyLimit * 0.75 && !isBreached;

  // Category distribution
  const categoryTotals = {
    Food: expenses.filter((e) => e.category === 'Food').reduce((s, e) => s + Number(e.amount || 0), 0),
    Stay: expenses.filter((e) => e.category === 'Stay').reduce((s, e) => s + Number(e.amount || 0), 0),
    Travel: expenses.filter((e) => e.category === 'Travel').reduce((s, e) => s + Number(e.amount || 0), 0),
    Leisure: expenses.filter((e) => e.category === 'Leisure').reduce((s, e) => s + Number(e.amount || 0), 0),
  };

  const totalExpenseSum = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  // Breached single expenses (> expenseLimit)
  const breachedItems = expenses.filter(
    (e) => expenseLimit > 0 && Number(e.amount || 0) > expenseLimit
  );

  useEffect(() => {
    if (circleRef.current) {
      animateCircleProgress(circleRef.current, percentUsed, 264);
    }
    if (isBreached && alertContainerRef.current) {
      pulseAlert(alertContainerRef.current);
    }
  }, [percentUsed, isBreached]);

  const handleSave = (e) => {
    e.preventDefault();
    if (onUpdateBudgetLimits) {
      onUpdateBudgetLimits({
        daily_budget_limit: Number(newDailyLimit),
        expense_budget_limit: Number(newExpenseLimit),
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 rounded-xl shadow-sm">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
              Budget & Spending Tracker
            </h3>
            <p className="text-[10px] text-slate-400">
              Group daily limit & expense alerts
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-teal-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl transition"
        >
          <Sliders className="w-3.5 h-3.5 text-teal-500" />
          <span>{isEditing ? 'Done' : 'Set Limits'}</span>
        </button>
      </div>

      {/* Edit Drawer */}
      <AnimatePresence>
        {isEditing && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSave}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">
                  Daily Group Cap (₹)
                </label>
                <input
                  type="number"
                  value={newDailyLimit}
                  onChange={(e) => setNewDailyLimit(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">
                  Single Expense Cap (₹)
                </label>
                <input
                  type="number"
                  value={newExpenseLimit}
                  onChange={(e) => setNewExpenseLimit(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-2 rounded-xl text-xs transition shadow-sm"
            >
              Update Budget Caps
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Creative Circular Gauge Card */}
      <div
        ref={alertContainerRef}
        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
          isBreached
            ? 'bg-rose-500/10 border-rose-500/30'
            : isWarning
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80'
        }`}
      >
        {/* Left Circular Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-200 dark:text-slate-800"
            />
            {/* Animated Gauge Arc */}
            <circle
              ref={circleRef}
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray="264"
              strokeDashoffset="264"
              strokeLinecap="round"
              className={`${
                isBreached
                  ? 'text-rose-500'
                  : isWarning
                  ? 'text-amber-500'
                  : 'text-teal-500'
              }`}
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
              {percentUsed}%
            </span>
            <span className="text-[9px] font-bold text-slate-400">Used</span>
          </div>
        </div>

        {/* Right Info Details */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            {isBreached ? (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            ) : isWarning ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-teal-500" />
            )}
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
              {isBreached
                ? 'Daily Budget Breached!'
                : isWarning
                ? 'Approaching Limit'
                : 'Safe Spending Zone'}
            </span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300">
            Today: <strong className="text-slate-900 dark:text-slate-100">₹{todaySpent.toLocaleString('en-IN')}</strong> / ₹{dailyLimit.toLocaleString('en-IN')}
          </div>

          <p className="text-[10px] text-slate-400 font-medium">
            {isBreached
              ? `Exceeded by ₹${(todaySpent - dailyLimit).toLocaleString('en-IN')}`
              : `₹${Math.max(0, dailyLimit - todaySpent).toLocaleString('en-IN')} left for today`}
          </p>
        </div>
      </div>

      {/* Category Spending Progress Distribution */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Category Distribution
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
              <Utensils className="w-3 h-3" /> Food
            </span>
            <strong className="text-slate-800 dark:text-slate-200">
              ₹{categoryTotals.Food.toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
              <Home className="w-3 h-3" /> Stay
            </span>
            <strong className="text-slate-800 dark:text-slate-200">
              ₹{categoryTotals.Stay.toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
              <Car className="w-3 h-3" /> Travel
            </span>
            <strong className="text-slate-800 dark:text-slate-200">
              ₹{categoryTotals.Travel.toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              <Coffee className="w-3 h-3" /> Fun
            </span>
            <strong className="text-slate-800 dark:text-slate-200">
              ₹{categoryTotals.Leisure.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>

      {/* Breached Single Items */}
      {expenseLimit > 0 && breachedItems.length > 0 && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold">
            <BellRing className="w-3.5 h-3.5" />
            <span>Single Expense Cap Breaches (&gt; ₹{expenseLimit.toLocaleString('en-IN')})</span>
          </div>
          {breachedItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center text-[11px] bg-white/70 dark:bg-slate-900/70 px-2.5 py-1 rounded-lg"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {item.title} ({item.paidBy})
              </span>
              <strong className="text-rose-500">₹{Number(item.amount).toLocaleString('en-IN')}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
