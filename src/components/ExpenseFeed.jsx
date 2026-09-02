'use client';

import React, { useState } from 'react';
import { Receipt, Search, Filter } from 'lucide-react';
import ExpenseCard from './ExpenseCard';
import { CATEGORIES } from './GlassCategoryDropdown';

export default function ExpenseFeed({
  expenses = [],
  onSettleExpense,
  getAvatarForMember,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory =
      selectedCategory === 'ALL' || exp.category === selectedCategory;
    const matchesSearch =
      exp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.paidBy || exp.payer || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-teal-500" />
          <span>Expense Feed</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
            {expenses.length}
          </span>
        </h2>

        {/* Search input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/50">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
            selectedCategory === 'ALL'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All ({expenses.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = expenses.filter((e) => e.category === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{cat.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-slate-400">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'No matching expenses found.'
                : 'No expenses added to this trip yet.'}
            </p>
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              onSettleExpense={onSettleExpense}
              getAvatarForMember={getAvatarForMember}
            />
          ))
        )}
      </div>
    </div>
  );
}
