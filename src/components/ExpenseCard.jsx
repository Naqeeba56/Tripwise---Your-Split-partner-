'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { CATEGORIES } from './GlassCategoryDropdown';
import { attach3DTilt } from '@/lib/animeAnimations';
import { Pencil, Trash2 } from 'lucide-react';

export default function ExpenseCard({
  expense,
  onSettleExpense,
  onEditExpense,
  onDeleteExpense,
  currentUserName = '',
  currentUserId = '',
  tripCreatorName = '',
  tripCreatorId = '',
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
  // Only treat it as "paid by multiple" when 2+ people actually split it.
  const payers =
    Array.isArray(expense.payers) && expense.payers.length > 1
      ? expense.payers
      : null;
  const payerNames = payers ? payers.map((p) => p.name) : [paidBy];

  // Only the expense creator, the trip organizer, or (for legacy rows) the
  // payer(s) / adder shown on the card may edit or delete it.
  const isCreator = !!currentUserId && !!expense.userId && String(expense.userId) === String(currentUserId);
  const isOrganizer = !!currentUserId && !!tripCreatorId && String(tripCreatorId) === String(currentUserId);
  const canManage =
    isCreator ||
    isOrganizer ||
    (!!currentUserName &&
      (currentUserName === tripCreatorName ||
        currentUserName === expense.addedBy ||
        (Array.isArray(expense.payers) && expense.payers.length > 1
          ? expense.payers.some((p) => currentUserName === (p.name || p))
          : currentUserName === (expense.paidBy || expense.payer))));

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
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] sm:text-xs text-slate-400 shrink-0">
                Paid by
              </span>
              {payers ? (
                <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {payers.map((p) => `${p.name} ${p.amount && p.amount !== expense.amount ? '₹' + Number(p.amount).toLocaleString('en-IN') : ''}`).join(' · ')}
                </span>
              ) : (
                <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 truncate flex items-center gap-1">
                  {getAvatarForMember ? (
                    <img src={getAvatarForMember(paidBy)} alt={paidBy} loading="lazy" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                  ) : null}
                  {paidBy}
                </span>
              )}
            </div>
            {expense.excludedMembers && expense.excludedMembers.length > 0 && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate">
                <span>🚫 Excluded: {expense.excludedMembers.join(', ')}</span>
              </div>
            )}
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

      {(!isSettled || canManage) && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end gap-2 flex-wrap">
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => onEditExpense && onEditExpense(expense)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95 inline-flex items-center gap-1.5"
                aria-label="Edit expense"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDeleteExpense && onDeleteExpense(expense.id)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all active:scale-95 inline-flex items-center gap-1.5"
                aria-label="Delete expense"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
