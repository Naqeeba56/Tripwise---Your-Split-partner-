'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { CATEGORIES } from './GlassCategoryDropdown';
import { attach3DTilt } from '@/lib/animeAnimations';

export default function ExpenseCard({
  expense,
  onSettleExpense,
  getAvatarForMember,
}) {
  const [balance, setBalance] = useState(expense.amount);
  const [isSettled, setIsSettled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    setBalance(expense.amount);
  }, [expense.amount]);

  useEffect(() => {
    if (cardRef.current) {
      const cleanupTilt = attach3DTilt(cardRef.current);
      return cleanupTilt;
    }
  }, []);

  const handleSettlement = (settleAmount) => {
    if (balance <= 0) return;

    const newBalance = Math.max(0, balance - settleAmount);
    setBalance(newBalance);

    if (newBalance === 0) {
      setIsSettled(true);
      setShowSuccessBadge(true);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#14b8a6', '#10b981', '#f59e0b', '#3b82f6'],
      });

      const animTimer = setTimeout(() => {
        setIsAnimating(true);
      }, 1100);

      const removeTimer = setTimeout(() => {
        if (onSettleExpense) {
          onSettleExpense(expense.id);
        }
      }, 1600);

      return () => {
        clearTimeout(animTimer);
        clearTimeout(removeTimer);
      };
    }
  };

  const catObj =
    CATEGORIES.find((c) => c.id === expense.category) || CATEGORIES[0];
  const CatIcon = catObj.icon;
  const paidBy = expense.paidBy || expense.payer || 'Unknown';
  const paidByAvatar = getAvatarForMember ? getAvatarForMember(paidBy) : null;

  return (
    <div
      ref={cardRef}
      className={`expense-card p-4 sm:p-5 rounded-3xl border transition-all duration-300 ${
        isSettled ? 'settled-neumorphic' : 'default-neumorphic'
      } ${isAnimating ? 'slide-left-fade-out' : ''}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`p-2.5 sm:p-3 rounded-2xl flex-shrink-0 ${catObj.bgLight} ${catObj.bgDark}`}
          >
            <CatIcon className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {expense.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 truncate">
              <span className="text-[11px] sm:text-xs text-slate-400">
                Paid by
              </span>
              {paidByAvatar ? (
                <img
                  src={paidByAvatar}
                  alt={paidBy}
                  className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-medium text-[9px] flex items-center justify-center flex-shrink-0">
                  {paidBy[0]}
                </div>
              )}
              <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                {paidBy}
              </span>
            </div>
          </div>
        </div>

        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">
          ₹
          {balance.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      {showSuccessBadge && (
        <div className="success-badge mt-3 text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 inline-flex items-center gap-1 shadow-md">
          ✓ Settled Successfully
        </div>
      )}

      {!isSettled && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end">
          <button
            type="button"
            className="settle-btn text-[11px] sm:text-xs font-semibold px-4 py-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm transition-all active:scale-95"
            onClick={() => handleSettlement(balance)}
          >
            Settle Full Amount
          </button>
        </div>
      )}
    </div>
  );
}
