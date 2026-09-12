'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Check,
  FileText,
  Clock,
  CreditCard,
  Hash,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import UpiPaymentModal from './UpiPaymentModal';
import PdfReceiptModal from './PdfReceiptModal';

export default function SettlementsTab({
  trip,
  settlements = [],
  settledIds = [],
  settlementDetailsMap = {},
  onCashSettle,
  onFinalizeUpiSettle,
  getAvatarForMember,
  expenses = [],
  netBalances = {},
  totalSpent = 0,
  perPersonShare = 0,
  currentUserName = 'Naqeeb',
}) {
  const [activeUpiSettlement, setActiveUpiSettlement] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const pendingSettlements = settlements.filter((s) => !settledIds.includes(s.id));
  const pendingCount = pendingSettlements.length;

  const handleCash = (settlement) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10b981', '#14b8a6', '#f59e0b'],
    });
    if (onCashSettle) onCashSettle(settlement);
  };

  const handleFinalizeUpi = (settlement) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#14b8a6', '#10b981', '#3b82f6'],
    });
    if (onFinalizeUpiSettle) onFinalizeUpiSettle(settlement);
    setActiveUpiSettlement(null);
  };

  // Find creditor member object to retrieve specific UPI ID, UPI number and custom QR
  const getCreditorMember = (creditorName) => {
    const found = trip.members?.find((m) => {
      const name = typeof m === 'string' ? m : m.name;
      return name === creditorName;
    });
    if (typeof found === 'object' && found) {
      return {
        name: found.name,
        upi_id: found.upi_id || found.upi || trip.creatorUpi || trip.creator_upi || 'naqeeb@upi',
        upi_number: found.upi_number || found.upiNumber || '',
        qr_code_url: found.qr_code_url || found.qr_code || found.qrCode || null,
      };
    }
    return {
      name: creditorName,
      upi_id: trip.creatorUpi || trip.creator_upi || 'naqeeb@upi',
      upi_number: '',
      qr_code_url: null,
    };
  };

  // User's personal net balance
  const userBalance = Math.round(netBalances[currentUserName] || 0);

  return (
    <div className="space-y-4 sm:space-y-7 max-w-4xl mx-auto pb-16 sm:pb-6">
      {/* 1. Quick Personal Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
          <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
            Total Trip Spend
          </p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 sm:mt-2 truncate break-words">
            ₹{totalSpent.toLocaleString('en-IN')}
          </h3>
          <span className="text-[9px] text-slate-400 font-semibold">
            {expenses.length} expenses logged
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
          <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
            Equal Share / Person
          </p>
          <h3 className="text-lg sm:text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1.5 sm:mt-2 truncate break-words">
            ₹{Math.round(perPersonShare).toLocaleString('en-IN')}
          </h3>
          <span className="text-[9px] text-slate-400 font-semibold">
            Across {trip.members?.length || 1} members
          </span>
        </div>

        <div
          className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-sm ${
            userBalance > 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : userBalance < 0
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
            Your Balance Position
          </p>
          <h3 className="text-lg sm:text-2xl font-bold mt-1.5 sm:mt-2 truncate flex items-center gap-1">
            {userBalance > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] flex-shrink-0" />
                <span>+₹{userBalance.toLocaleString('en-IN')}</span>
              </>
            ) : userBalance < 0 ? (
              <>
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] flex-shrink-0" />
                <span>-₹{Math.abs(userBalance).toLocaleString('en-IN')}</span>
              </>
            ) : (
              <span>All Settled (₹0)</span>
            )}
          </h3>
          <span className="text-[9px] font-bold">
            {userBalance > 0
              ? 'You receive from group'
              : userBalance < 0
              ? 'You owe to group'
              : 'Zero balance'}
          </span>
        </div>
      </div>

      {/* 2. Member Balance Summary Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
        <h3 className="text-xs sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span>Member Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
          {(trip.members || []).map((m, idx) => {
            const memberName = typeof m === 'string' ? m : m.name;
            const avatar = typeof m === 'object' ? (m.avatar_url || m.avatar) : null;
            const paidTotal = expenses
              .filter((e) => (e.paidBy || e.payer) === memberName)
              .reduce((sum, e) => sum + Number(e.amount || 0), 0);
            const net = Math.round(netBalances[memberName] || 0);

            return (
              <div
                key={idx}
                className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={memberName}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-teal-500/30 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-[10px] sm:text-xs flex items-center justify-center flex-shrink-0">
                      {memberName[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {memberName}
                    </span>
                    {typeof m === 'object' && (m.parentMemberName || m.parent_member_name) ? (
                      <span className="text-[8px] font-bold text-amber-500 block truncate">
                        👶 {m.parentMemberName || m.parent_member_name}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 block truncate">
                        Paid: ₹{paidTotal.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg inline-block whitespace-nowrap ${
                      net > 0
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : net < 0
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {net > 0 ? `+₹${net}` : net < 0 ? `-₹${Math.abs(net)}` : '₹0'}
                  </span>
                  <span className="text-[8px] text-slate-400 block mt-0.5">
                    {net > 0 ? 'Gets Back' : net < 0 ? 'Owes' : 'Settled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Direct Settlement Matrix (Who pays Who) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div>
            <h2 className="text-sm sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500 stroke-[2] flex-shrink-0" />
              <span>Smart Settlement Plan</span>
            </h2>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              Simplified minimum transactions to balance all debts
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[9px] sm:text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap">
              {pendingCount} Pending
            </span>

            <button
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[10px] sm:text-xs transition shadow-sm active:scale-95"
              title="Download PDF Receipt"
            >
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Settlement Transaction Cards */}
        <div className="space-y-3">
          {settlements.length === 0 ? (
            <div className="text-center py-8 sm:py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-teal-500 mx-auto mb-2 opacity-90" />
              <p className="text-xs sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                All Debts Settled!
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                Everyone is square. No pending payments.
              </p>
            </div>
          ) : (
            settlements.map((s) => {
              const isSettled = settledIds.includes(s.id);
              const details = settlementDetailsMap[s.id];
              const fromAvatar = getAvatarForMember(s.from);
              const toAvatar = getAvatarForMember(s.to);
              const creditor = getCreditorMember(s.to);

              return (
                <div
                  key={s.id}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                    isSettled
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* From -> To Row */}
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Debtor */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        {fromAvatar ? (
                          <img
                            src={fromAvatar}
                            alt={s.from}
                            loading="lazy"
                            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-rose-500/40 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-rose-500/10 text-rose-500 font-bold text-[10px] sm:text-xs flex items-center justify-center flex-shrink-0">
                            {s.from[0]}
                          </div>
                        )}
                        <span className="text-[10px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {s.from}
                        </span>
                      </div>

                      {/* Owes Arrow */}
                      <div className="flex flex-col items-center px-1">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 stroke-[2] flex-shrink-0" />
                        <span className="text-[7px] sm:text-[9px] font-bold uppercase text-slate-400 leading-none">
                          pays
                        </span>
                      </div>

                      {/* Creditor */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        {toAvatar ? (
                          <img
                            src={toAvatar}
                            alt={s.to}
                            loading="lazy"
                            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-emerald-500/40 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px] sm:text-xs flex items-center justify-center flex-shrink-0">
                            {s.to[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate">
                            {s.to}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 truncate">
                            {creditor.upi_id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-sm sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                        ₹{Number(s.amount).toLocaleString('en-IN')}
                      </span>

                      {isSettled ? (
                        <div className="text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-500 text-slate-950 flex items-center gap-1 flex-shrink-0">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2]" />
                          <span>Settled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveUpiSettlement(s)}
                            className="text-[10px] sm:text-xs font-bold px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm transition active:scale-95 flex items-center gap-1 flex-shrink-0"
                          >
                            <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>UPI</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCash(s)}
                            className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 transition active:scale-95 flex-shrink-0"
                          >
                            Cash
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Settled Metadata */}
                  {isSettled && details && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 text-[9px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {details.settledAt} ({details.settledDate})
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <CreditCard className="w-3 h-3 text-emerald-500" />
                        {details.method}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate">
                        <Hash className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        {details.transactionId}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* UPI Payment Modal */}
      {activeUpiSettlement && (
        <UpiPaymentModal
          settlement={activeUpiSettlement}
          creditorMember={getCreditorMember(activeUpiSettlement.to)}
          onClose={() => setActiveUpiSettlement(null)}
          onFinalizeUpiSettle={handleFinalizeUpi}
        />
      )}

      {/* PDF Receipt Modal */}
      <PdfReceiptModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        trip={trip}
        expenses={expenses}
        settlements={settlements}
        settlementDetailsMap={settlementDetailsMap}
        settledIds={settledIds}
        netBalances={netBalances}
        totalSpent={totalSpent}
        perPersonShare={perPersonShare}
      />
    </div>
  );
}
