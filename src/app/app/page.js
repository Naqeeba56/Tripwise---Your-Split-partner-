'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  fetchTextSearch,
  fetchNearbyPlaces,
  getPlacePhotoUrl
} from '@/lib/googlePlacesService';
import {
  Plus,
  PlaneTakeoff,
  Share2,
  Receipt,
  PieChart,
  ArrowRightLeft,
  Users,
  Compass,
  Megaphone,
  Lock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import Spinner from '@/components/Spinner';
import ExpenseCard from '@/components/ExpenseCard';
import ExpenseFeed from '@/components/ExpenseFeed';
import BudgetTracker from '@/components/BudgetTracker';
import BudgetEstimator from '@/components/BudgetEstimator';
import ProfilePanel from '@/components/ProfilePanel';
import SettlementsTab from '@/components/SettlementsTab';
import MembersTab from '@/components/MembersTab';
import CommunityAnnouncements from '@/components/CommunityAnnouncements';
import CurrencyConverter from '@/components/CurrencyConverter';
import NewTripModal from '@/components/NewTripModal';
import AuthModal from '@/components/AuthModal';
import GlassMemberDropdown from '@/components/GlassMemberDropdown';
import GlassCategoryDropdown, { CATEGORIES } from '@/components/GlassCategoryDropdown';

import { supabase, isSupabaseConfigured, signOut } from '@/lib/supabase';
import {
  fetchUserTrips,
  createTripInDb,
  fetchTripExpenses,
  createExpenseInDb,
  updateExpenseInDb,
  deleteExpenseInDb,
  addMemberInDb,
  createSettlementInDb,
  deleteMemberInDb,
  deleteTripInDb,
  getUserStorageKey,
} from '@/lib/supabaseDb';
import { calculateNetBalances, calculateOptimalSettlements } from '@/lib/settlementMath';
import { animateCounter } from '@/lib/animeAnimations';
import { safeSetItem, safeGetItem } from '@/lib/storage';
import { friendlyError } from '@/lib/errorMessages';

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmTripId, setConfirmTripId] = useState(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const notify = (message, tone = 'success') => setSuccessMsg({ message, tone });

  // User-scoped data state (Initialized strictly empty - ZERO static mock data)
  const [allTrips, setAllTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settledIds, setSettledIds] = useState([]);
  const [settlementDetailsMap, setSettlementDetailsMap] = useState({});

  // Expense Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [paidByMode, setPaidByMode] = useState('single'); // 'single' | 'multiple'
  const [paidByAmounts, setPaidByAmounts] = useState({});   // { memberName: amount }
  const [category, setCategory] = useState('Food');
  const [excludedMembers, setExcludedMembers] = useState([]);
  const [formErrors, setFormErrors] = useState({}); // { field: message } for inline validation
  const [expenseToEdit, setExpenseToEdit] = useState(null); // editing an existing expense
  const [expenseToDeleteId, setExpenseToDeleteId] = useState(null);
  const [appError, setAppError] = useState(null);
  // In-form feedback for the expense form (spinner while submitting + inline error banner)
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseFormError, setExpenseFormError] = useState(null);

  // Refs for animated numbers
  const totalSpentRef = useRef(null);
  const perPersonRef = useRef(null);

  // 1. Supabase Auth State Listener
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profileObj = {
            id: session.user.id,
            email: session.user.email,
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'User',
            avatar:
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              null,
            upi_id: session.user.user_metadata?.upi_id || 'naqeeb@upi',
          };
          setUserProfile(profileObj);
          loadUserData(profileObj.id);
        } else {
          handleUserLoggedOut();
        }
        setLoadingAuth(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            const profileObj = {
              id: session.user.id,
              email: session.user.email,
              name:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split('@')[0] ||
                'User',
              avatar:
                session.user.user_metadata?.avatar_url ||
                session.user.user_metadata?.picture ||
                null,
              upi_id: session.user.user_metadata?.upi_id || 'naqeeb@upi',
            };
            setUserProfile(profileObj);
            // Await the first data fetch so the skeleton stays visible until
            // the user's trips + expenses are actually rendered.
            await loadUserData(profileObj.id);
          } else {
            handleUserLoggedOut();
          }
          setLoadingAuth(false);
        }
      );

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } else {
      setLoadingAuth(false);
    }
  }, []);

  // Helper when user logs out - Wipes all private data immediately
  const handleUserLoggedOut = () => {
    setUserProfile(null);
    setAllTrips([]);
    setActiveTripId(null);
    setExpenses([]);
    setSettledIds([]);
    setSettlementDetailsMap({});
  };

  // Load User Data strictly for the authenticated user ID
  const loadUserData = async (userId) => {
    if (!userId) return;
    try {
      const trips = await fetchUserTrips(userId);
      setAllTrips(trips);
      if (trips.length > 0) {
        // Restore the trip the user was last viewing so a refresh does NOT
        // jump back to the newest/first trip (which made members think their
        // just-added expense belonged to a different trip).
        let targetTripId = trips[0].id;
        if (typeof window !== 'undefined') {
          const saved = safeGetItem(getUserStorageKey(userId, 'active_trip'));
          if (
            saved &&
            trips.some((t) => String(t.id) === String(saved))
          ) {
            targetTripId = saved;
          }
        }
        setActiveTripId(targetTripId);
        const tripExps = await fetchTripExpenses(targetTripId, userId);
        setExpenses(tripExps);
        // Keep the restored choice in sync so the next refresh is stable too.
        safeSetItem(getUserStorageKey(userId, 'active_trip'), targetTripId);
      } else {
        setActiveTripId(null);
        setExpenses([]);
      }

      // Load settled state from user storage
      if (typeof window !== 'undefined') {
        const savedSettled = safeGetItem(getUserStorageKey(userId, 'settled_ids'));
        if (savedSettled) setSettledIds(JSON.parse(savedSettled));

        const savedMap = safeGetItem(getUserStorageKey(userId, 'settlement_map'));
        if (savedMap) setSettlementDetailsMap(JSON.parse(savedMap));
      }
    } catch (err) {
      console.warn('Error loading user data:', err);
    }
  };

  // Switch Active Trip and load its expenses
  const handleSelectTrip = async (tripId) => {
    setActiveTripId(tripId);
    // Remember the active trip so a refresh opens the same trip, not the first.
    if (typeof window !== 'undefined' && userProfile?.id && tripId) {
      safeSetItem(getUserStorageKey(userProfile.id, 'active_trip'), tripId);
    }
    if (userProfile?.id && tripId) {
      const tripExps = await fetchTripExpenses(tripId, userProfile.id);
      setExpenses(tripExps);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    handleUserLoggedOut();
  };

  const currentTrip = useMemo(() => {
    if (!allTrips || allTrips.length === 0) return null;
    return allTrips.find((t) => String(t.id) === String(activeTripId)) || allTrips[0];
  }, [allTrips, activeTripId]);

  useEffect(() => {
    if (currentTrip && currentTrip.members?.length > 0) {
      // Find first non-submember to be the default payer
      const payer = currentTrip.members.find((m) => !m.parentMemberName);
      const firstMemberName =
        typeof payer === 'string'
          ? payer
          : payer?.name || (typeof currentTrip.members[0] === 'string'
              ? currentTrip.members[0]
              : currentTrip.members[0].name);
      setPaidBy(firstMemberName);
    }
  }, [currentTrip]);

  const currentExpenses = useMemo(() => {
    if (!currentTrip) return [];
    return expenses.filter((e) => String(e.tripId) === String(currentTrip.id));
  }, [expenses, currentTrip]);

  // Compute Settlement Math
  const { totalSpent, perPersonShare, netBalances } = useMemo(() => {
    if (!currentTrip) return { totalSpent: 0, perPersonShare: 0, netBalances: {} };
    return calculateNetBalances(currentTrip.members || [], currentExpenses);
  }, [currentTrip, currentExpenses]);

  const settlements = useMemo(() => {
    return calculateOptimalSettlements(netBalances);
  }, [netBalances]);

  // Animate metrics counter with Anime.js on change
  useEffect(() => {
    if (totalSpentRef.current) {
      animateCounter(totalSpentRef.current, 0, totalSpent, '₹', 800);
    }
    if (perPersonRef.current) {
      animateCounter(perPersonRef.current, 0, Math.round(perPersonShare), '₹', 800);
    }
  }, [totalSpent, perPersonShare]);

  const getAvatarForMember = (memberName) => {
    const memberObj = currentTrip?.members?.find(
      (m) => (typeof m === 'string' ? m : m.name) === memberName
    );
    return typeof memberObj === 'object'
      ? memberObj?.avatar_url || memberObj?.avatar
      : null;
  };

  // Handlers
  const resetExpenseForm = () => {
    setTitle('');
    setAmount('');
    setPaidBy('');
    setPaidByMode('single');
    setPaidByAmounts({});
    setExcludedMembers([]);
    setExpenseToEdit(null);
    setAppError(null);
    setFormErrors({});
  };

  // Build the normalized payers array for single or multi-payer mode.
  const buildPayers = (numAmount) => {
    if (paidByMode === 'multiple') {
      const list = Object.entries(paidByAmounts)
        .filter(([, v]) => Number(v) > 0)
        .map(([name, v]) => ({ name, amount: Math.round(Number(v) * 100) / 100 }));
      return list.length ? list : null;
    }
    return paidBy ? [{ name: paidBy, amount: numAmount }] : null;
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseFormError(null);
    const errors = {};
    if (!title || title.trim() === '') {
      errors.title = 'Expense title cannot be empty.';
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      errors.amount = 'Please enter a valid expense amount.';
    }

    if (paidByMode === 'single' && !paidBy) {
      errors.paidBy = 'Please select who paid for this expense.';
    }

    if (paidByMode === 'multiple') {
      const splitAmounts = Object.values(paidByAmounts).filter((v) => Number(v) > 0);
      if (!splitAmounts.length) {
        errors.paidBy = 'Select at least one member and enter how much each paid.';
      } else {
        const splitSum = splitAmounts.reduce((a, b) => a + Number(b), 0);
        if (Math.abs(splitSum - numAmount) > 0.5) {
          errors.paidBy = `Split amounts must add up to the total (₹${numAmount.toLocaleString('en-IN')}).`;
        }
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length) {
      // Show the first error as an inline banner INSIDE the form, right where
      // the user is typing — never as a floating global toast.
      setExpenseFormError(Object.values(errors)[0]);
      return;
    }

    if (!currentTrip) {
      setExpenseFormError('No active trip selected. Please choose or create a trip first.');
      return;
    }

    const payers = buildPayers(numAmount);
    const primaryPayer = payers && payers.length ? payers[0].name : paidBy;
    const payload = {
      title: title.trim(),
      amount: numAmount,
      paidBy: primaryPayer,
      payers,
      category: category || 'Food',
      excludedMembers,
      addedBy: userProfile?.name || 'Unknown',
    };

    setExpenseSubmitting(true);

    // Editing an existing expense → update in place.
    if (expenseToEdit) {
      try {
        await updateExpenseInDb(expenseToEdit.id, currentTrip.id, payload, userProfile?.id);
        setExpenses((prev) =>
          prev.map((x) =>
            String(x.id) === String(expenseToEdit.id) ? { ...x, ...payload } : x
          )
        );
        setExpenseFormError(null);
        notify('Expense updated ✏️');
        resetExpenseForm();
      } catch (err) {
        console.error('Error updating expense:', err);
        setExpenseFormError(
          friendlyError(err, 'Something went wrong while saving your changes. Please try again.')
        );
      } finally {
        setExpenseSubmitting(false);
      }
      return;
    }

    try {
      const newExp = await createExpenseInDb(
        { tripId: currentTrip.id, ...payload },
        userProfile?.id
      );

      if (expenseSubmitting) setExpenseSubmitting(false);

      if (!newExp || !newExp.id) {
        setExpenseFormError('Could not save this expense to the trip. Please try again.');
        return;
      }

      setExpenses([newExp, ...expenses]);
      setExpenseFormError(null);
      resetExpenseForm();
      notify('Expense added to the split 💸');
    } catch (err) {
      console.error('Error adding expense:', err);
      setExpenseFormError(
        friendlyError(err, 'Error adding expense. Your changes were not saved — please try again.')
      );
    } finally {
      setExpenseSubmitting(false);
    }
  };

  // Prefill the form with an existing expense so it can be edited.
  const startEditExpense = (exp) => {
    setTitle(exp.title || '');
    setAmount(String(exp.amount || ''));
    setPaidBy(exp.paidBy || '');
    setExcludedMembers(exp.excludedMembers || []);
    setCategory(exp.category || 'Food');
    const hasPayers = Array.isArray(exp.payers) && exp.payers.length > 1;
    setPaidByMode(hasPayers ? 'multiple' : 'single');
    setPaidByAmounts(
      hasPayers ? Object.fromEntries(exp.payers.map((p) => [p.name, p.amount])) : {}
    );
    setExpenseToEdit(exp);
    setFormErrors({});
    const panel = document.getElementById('quick-expense-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Exit edit mode without wiping a fresh-add form.
  const cancelEditExpense = () => resetExpenseForm();

  // Ask for confirmation before actually deleting an expense.
  const requestDeleteExpense = (expenseId) => setExpenseToDeleteId(expenseId);

  const confirmDeleteExpense = async () => {
    const expenseId = expenseToDeleteId;
    if (!expenseId || !currentTrip) return;
    await deleteExpenseInDb(expenseId, currentTrip.id, userProfile?.id);
    setExpenses((prev) => prev.filter((exp) => String(exp.id) !== String(expenseId)));
    if (expenseToEdit && String(expenseToEdit.id) === String(expenseId)) resetExpenseForm();
    setExpenseToDeleteId(null);
    notify('Expense deleted 🗑️');
  };

  const handleSettleExpenseCard = async (expenseId) => {
    if (currentTrip) {
      await deleteExpenseInDb(expenseId, currentTrip.id, userProfile?.id);
      setExpenses((prev) => prev.filter((exp) => String(exp.id) !== String(expenseId)));
      notify('Expense settled — nicely done ✅');
    }
  };

  const handleCreateTrip = async (tripData) => {
    if (!userProfile) {
      setShowAuthModal(true);
      return;
    }

    try {
      const createdTrip = await createTripInDb(tripData, userProfile.id);
      
      if (!createdTrip || !createdTrip.id) {
        setAppError('Failed to create trip. Please try again.');
        return;
      }

      const updatedTrips = [createdTrip, ...allTrips];
      setAllTrips(updatedTrips);
      setActiveTripId(createdTrip.id);
      setExpenses([]);
      setShowNewTripModal(false);
      setAppError(null);
      notify('Trip created — time to split! 🎉');
    } catch (err) {
      console.error('Error creating trip:', err);
      setAppError('Error creating trip. Please try again.');
    }
  };

  const handleAddMember = async (memberObj) => {
    if (!currentTrip) return;
    await addMemberInDb(currentTrip.id, memberObj, userProfile?.id);

    const updatedMembers = [...(currentTrip.members || []), memberObj];
    const updatedTrips = allTrips.map((t) => {
      if (String(t.id) === String(currentTrip.id)) {
        return { ...t, members: updatedMembers };
      }
      return t;
    });
    setAllTrips(updatedTrips);

    // Save to user storage
    if (userProfile?.id && typeof window !== 'undefined') {
      safeSetItem(getUserStorageKey(userProfile.id, 'trips'), updatedTrips);
    }
    notify('Member added to the trip 🧑‍🤝‍🧑');
  };

  const handleUpdateBudgetLimits = ({ daily_budget_limit, expense_budget_limit }) => {
    if (!currentTrip) return;
    const updatedTrips = allTrips.map((t) => {
      if (String(t.id) === String(currentTrip.id)) {
        return { ...t, daily_budget_limit, expense_budget_limit };
      }
      return t;
    });
    setAllTrips(updatedTrips);
    if (userProfile?.id && typeof window !== 'undefined') {
      safeSetItem(getUserStorageKey(userProfile.id, 'trips'), updatedTrips);
    }
  };

  const handleCashSettle = async (settlement) => {
    const dynamicData = {
      settledAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      settledDate: new Date().toLocaleDateString(),
      method: 'Cash Settlement',
      transactionId: `CASH-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    if (currentTrip) {
      await createSettlementInDb(currentTrip.id, { ...settlement, method: 'Cash', transactionId: dynamicData.transactionId }, userProfile?.id);
    }

    const updatedSettled = [...settledIds, settlement.id];
    const updatedMap = { ...settlementDetailsMap, [settlement.id]: dynamicData };
    setSettledIds(updatedSettled);
    setSettlementDetailsMap(updatedMap);

    if (userProfile?.id && typeof window !== 'undefined') {
      safeSetItem(getUserStorageKey(userProfile.id, 'settled_ids'), updatedSettled);
      safeSetItem(getUserStorageKey(userProfile.id, 'settlement_map'), updatedMap);
    }
  };

  const handleFinalizeUpiSettle = async (settlement) => {
    const dynamicData = {
      settledAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      settledDate: new Date().toLocaleDateString(),
      method: 'Instant UPI Transfer',
      transactionId: `UPI-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    if (currentTrip) {
      await createSettlementInDb(currentTrip.id, { ...settlement, method: 'UPI', transactionId: dynamicData.transactionId }, userProfile?.id);
    }

    const updatedSettled = [...settledIds, settlement.id];
    const updatedMap = { ...settlementDetailsMap, [settlement.id]: dynamicData };
    setSettledIds(updatedSettled);
    setSettlementDetailsMap(updatedMap);

    if (userProfile?.id && typeof window !== 'undefined') {
      safeSetItem(getUserStorageKey(userProfile.id, 'settled_ids'), updatedSettled);
      safeSetItem(getUserStorageKey(userProfile.id, 'settlement_map'), updatedMap);
    }
  };

  // Delete Member Handler
  const handleDeleteMember = async (memberId, memberName) => {
    if (!currentTrip || !userProfile?.id) return;

    try {
      const success = await deleteMemberInDb(currentTrip.id, memberId, userProfile.id);
      
      if (!success) {
        setAppError('Failed to delete member. You may only remove members from your own trips.');
        return;
      }

      // Update local state
      const updatedMembers = currentTrip.members.filter((m) => {
        const mId = typeof m === 'object' ? m.id : null;
        return String(mId) !== String(memberId);
      });

      const updatedTrips = allTrips.map((t) => {
        if (String(t.id) === String(currentTrip.id)) {
          return { ...t, members: updatedMembers };
        }
        return t;
      });

      setAllTrips(updatedTrips);
      setAppError(null);
      notify('Member removed from the trip');
    } catch (err) {
      console.error('Error deleting member:', err);
      setAppError('Error deleting member. Please try again.');
    }
  };

  // Delete Trip Handler — asks for confirmation via the app modal, then deletes.
  const requestDeleteTrip = (tripIdToDelete) => {
    if (!userProfile?.id) return;
    setConfirmTripId(tripIdToDelete);
  };

  const executeDeleteTrip = async () => {
    const tripIdToDelete = confirmTripId;
    if (!tripIdToDelete || !userProfile?.id) return;

    try {
      const success = await deleteTripInDb(tripIdToDelete, userProfile.id);

      if (!success) {
        setAppError('Failed to delete trip. You may only delete trips you created.');
        return;
      }

      // Update local state
      const updatedTrips = allTrips.filter((t) => String(t.id) !== String(tripIdToDelete));
      setAllTrips(updatedTrips);

      // Reset active trip if it was deleted
      if (String(activeTripId) === String(tripIdToDelete)) {
        if (updatedTrips.length > 0) {
          setActiveTripId(updatedTrips[0].id);
          const tripExps = await fetchTripExpenses(updatedTrips[0].id, userProfile.id);
          setExpenses(tripExps);
        } else {
          setActiveTripId(null);
          setExpenses([]);
        }
      }

      setAppError(null);
      notify('Trip deleted 🗑️');
    } catch (err) {
      console.error('Error deleting trip:', err);
      setAppError('Error deleting trip. Please try again.');
    } finally {
      setConfirmTripId(null);
    }
  };

  const tripCover = currentTrip?.image_url || currentTrip?.image;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen app-canvas text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">
        <div>
          {/* Main Header */}
          <Header
            trips={allTrips}
            activeTripId={activeTripId}
            onSelectTrip={handleSelectTrip}
            onOpenNewTripModal={() => {
              if (!userProfile) setShowAuthModal(true);
              else setShowNewTripModal(true);
            }}
            onOpenInviteModal={() => setShowInviteModal(true)}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onSignOut={handleSignOut}
            userProfile={userProfile}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            settlementsCount={settlements.length}
            membersCount={currentTrip?.members?.length || 0}
          />

          <main className="w-full px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5 sm:space-y-6">
            {/* SKELETON LOADER — shown while auth + first data fetch is in flight */}
            {loadingAuth && (
              <div aria-busy="true" aria-label="Loading your trips" className="space-y-5">
                <div className="h-4 w-40 rounded-full bg-slate-200 dark:bg-slate-700 skeleton-shimmer" />
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="flex gap-3 items-start rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4">
                    <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-700 skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 skeleton-shimmer w-3/5" />
                      <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 skeleton-shimmer w-2/5" />
                      <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 skeleton-shimmer w-full" />
                    </div>
                    <div className="w-14 h-4.5 rounded-lg bg-slate-200 dark:bg-slate-700 skeleton-shimmer" />
                  </div>
                ))}
              </div>
            )}

            {/* GUEST VIEW: If user is logged out and has no trips */}
            {!userProfile && activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-transparent border border-teal-500/30 rounded-3xl p-6 sm:p-10 text-center space-y-4 backdrop-blur-xl shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/25">
                  <Sparkles className="w-7 h-7 stroke-[2]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Welcome to Tripwise
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto font-medium">
                  Smart group expense splitting with direct UPI settlements, AI travel budget estimation, and budget limit alerts. Sign in to create your first trip.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20"
                  >
                    Sign In with Google / Email
                  </button>
                  <button
                    onClick={() => setActiveTab('estimator')}
                    className="w-full sm:w-auto bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition hover:border-teal-500"
                  >
                    Try AI Budget Estimator →
                  </button>
                </div>
              </motion.div>
            )}

            {/* LOGGED IN WITH 0 TRIPS: Clean Empty State Prompting Trip Creation */}
            {userProfile && allTrips.length === 0 && activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm"
              >
                <div className="w-16 h-16 rounded-3xl bg-teal-500/15 text-teal-500 flex items-center justify-center mx-auto border border-teal-500/30">
                  <PlaneTakeoff className="w-8 h-8 stroke-[2]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  No Trips Created Yet
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Ready for your next adventure? Create your first trip to start adding members, tracking expenses, and splitting bills.
                </p>
                <button
                  onClick={() => setShowNewTripModal(true)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[2]" />
                  <span>Create Your First Trip</span>
                </button>
              </motion.div>
            )}

            {/* ACTIVE TRIP COVER BANNER (When trip exists) */}
            {userProfile && currentTrip && activeTab === 'dashboard' && tripCover && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-48 sm:h-72 md:h-80 rounded-3xl sm:rounded-[2.5rem] overflow-hidden relative shadow-xl shadow-teal-500/5 group border border-slate-200/50 dark:border-slate-800/50"
              >
                <img
                  src={tripCover}
                  alt={currentTrip.name}
                  className="w-full h-full object-cover object-center transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-4 sm:p-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-teal-500/25 backdrop-blur-md text-teal-300 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-teal-500/40">
                      Active Trip
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-300">
                      Organized by {currentTrip.creatorName || currentTrip.creator_name || 'Organizer'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight truncate">
                    {currentTrip.name}
                  </h2>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT PANELS */}
            <AnimatePresence mode="wait">
              {/* 1. DASHBOARD TAB (With Active Trip) */}
              {activeTab === 'dashboard' && userProfile && currentTrip && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 pb-28 sm:pb-6"
                >
                  {/* Left Column: Totals, Add Expense, Budget Monitor */}
                  <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                    {/* Metric Cards with Anime.js animated counters */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
                        <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
                          Total Spent
                        </p>
                        <h3
                          ref={totalSpentRef}
                          className="text-base sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 sm:mt-2 break-words"
                        >
                          ₹{totalSpent.toLocaleString('en-IN')}
                        </h3>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
                        <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
                          Per Person
                        </p>
                        <h3
                          ref={perPersonRef}
                          className="text-base sm:text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1.5 sm:mt-2 break-words"
                        >
                          ₹{Math.round(perPersonShare).toLocaleString('en-IN')}
                        </h3>
                      </div>
                    </div>

                    {/* Add / Edit Expense Form */}
                    <div id="quick-expense-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 sm:mb-5">
                        <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Plus className="w-5 h-5 text-teal-500 stroke-[2]" />
                          <span>{expenseToEdit ? 'Edit Expense' : 'Add Expense'}</span>
                        </h2>
                        {expenseToEdit && (
                          <button
                            type="button"
                            onClick={cancelEditExpense}
                            className="ml-auto text-[10px] font-bold text-slate-400 hover:text-rose-500 transition p-1.5 rounded-lg hover:bg-rose-500/10"
                          >
                            Cancel edit
                          </button>
                        )}
                      </div>

                        <form onSubmit={handleAddExpense} noValidate className="space-y-3 sm:space-y-4">
  {expenseFormError && (
    <div
      role="alert"
      className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium"
    >
      <span className="shrink-0">⚠️</span>
      <span className="flex-1">{expenseFormError}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setExpenseFormError(null)}
        className="shrink-0 ml-auto text-rose-600 dark:text-rose-400 hover:opacity-70"
      >
        ✕
      </button>
    </div>
  )}
                        <div>
                          <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                            Expense Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Dinner, Fuel, Villa"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl px-3 py-3 sm:py-3 text-sm sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                          />

                          {formErrors.title && (
                            <p className="mt-1.5 text-[11px] font-medium text-rose-500">{formErrors.title}</p>
                          )}

                          {/* appError now surfaces as a floating toast (see bottom of page) */}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                              Amount (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl px-3 py-3 sm:py-3 text-sm sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                            />
                            {formErrors.amount && (
                              <p className="mt-1.5 text-[11px] font-medium text-rose-500">{formErrors.amount}</p>
                            )}
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                              Paid By
                            </label>
                            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setPaidByMode('single')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                                  paidByMode === 'single'
                                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                One person paid
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaidByMode('multiple')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                                  paidByMode === 'multiple'
                                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                Multiple people paid
                              </button>
                            </div>

                            {paidByMode === 'single' ? (
                              <div className="mt-2.5">
                                <GlassMemberDropdown
                                  members={(currentTrip?.members || []).filter(
                                    (m) => {
                                      const inner = typeof m === 'string' ? m : m.name;
                                      return !m.parentMemberName && !excludedMembers.includes(inner);
                                    }
                                  )}
                                  selectedMember={paidBy}
                                  onSelectMember={setPaidBy}
                                />
                              </div>
                            ) : (
                              <div className="mt-2.5 space-y-1.5">
                                <p className="text-[10px] sm:text-[11px] text-slate-400">
                                  Tick who paid, then enter how much each person contributed. Amounts must add up to the bill.
                                </p>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                                  {(currentTrip?.members || [])
                                    .filter((m) => {
                                      const inner = typeof m === 'string' ? m : m.name;
                                      return !m.parentMemberName && !excludedMembers.includes(inner);
                                    })
                                    .map((m, idx) => {
                                      const mName = typeof m === 'string' ? m : m.name;
                                      const isSelected = Object.prototype.hasOwnProperty.call(paidByAmounts, mName);
                                      return (
                                        <div key={idx} className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              const next = { ...paidByAmounts };
                                              if (e.target.checked) {
                                                next[mName] = next[mName] ?? '';
                                              } else {
                                                delete next[mName];
                                              }
                                              setPaidByAmounts(next);
                                            }}
                                            className="w-3.5 h-3.5 accent-teal-500"
                                          />
                                          <span className={`text-xs font-semibold flex-1 ${isSelected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                                            {mName}
                                          </span>
                                          <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                                            <input
                                              type="number"
                                              min="0"
                                              placeholder="0"
                                              value={paidByAmounts[mName] ?? ''}
                                              disabled={!isSelected}
                                              onChange={(e) =>
                                                setPaidByAmounts({ ...paidByAmounts, [mName]: e.target.value })
                                              }
                                              className="w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-5 pr-2 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-40"
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-slate-400">Split total</span>
                                  <span className={(() => {
                                    const sum = Object.values(paidByAmounts).reduce((a, b) => a + Number(b || 0), 0);
                                    const ok = sum === Number(amount || 0) && Number(amount) > 0;
                                    return ok ? 'text-emerald-500' : 'text-amber-500';
                                  })()}>
                                    ₹{Object.values(paidByAmounts).reduce((a, b) => a + Number(b || 0), 0).toLocaleString('en-IN')} / ₹{Number(amount || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            )}
                            {formErrors.paidBy && (
                              <p className="mt-1.5 text-[11px] font-medium text-rose-500">{formErrors.paidBy}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                            Category
                          </label>
                          <GlassCategoryDropdown
                            selectedCategory={category}
                            onSelectCategory={setCategory}
                          />
                        </div>

                        {/* Exclude Members Option */}
                        {currentTrip?.members?.length > 1 && (
                          <div>
                            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                              Exclude Members (Optional)
                            </label>
                            <div className="flex flex-wrap gap-2 sm:gap-2.5 p-3 sm:p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl max-h-40 sm:max-h-32 overflow-y-auto">
                              {currentTrip.members.map((m, idx) => {
                                const mName = typeof m === 'string' ? m : m.name;
                                const isExcluded = excludedMembers.includes(mName);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      if (isExcluded) {
                                        setExcludedMembers(excludedMembers.filter((name) => name !== mName));
                                      } else {
                                        setExcludedMembers([...excludedMembers, mName]);
                                      }
                                    }}
                                    className={`px-3 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 whitespace-nowrap ${isExcluded
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 line-through'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500/40'
                                      }`}
                                  >
                                    <span>{mName}</span>
                                    {isExcluded && <span className="text-[10px]">✕</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={expenseSubmitting}
                          className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 mt-3 active:scale-95"
                        >
                          {expenseSubmitting ? (
                            <Spinner size={16} label="Saving..." />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                              <span>{expenseToEdit ? 'Save Changes' : 'Add Expense'}</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Creative Smart Budget Tracker Component */}
                    <BudgetTracker
                      trip={currentTrip}
                      expenses={currentExpenses}
                      onUpdateBudgetLimits={handleUpdateBudgetLimits}
                    />
                  </div>

                  {/* Right Column: Expense Feed */}
                  <div className="lg:col-span-7">
                    <ExpenseFeed
                      expenses={currentExpenses}
                      onSettleExpense={handleSettleExpenseCard}
                      onEditExpense={startEditExpense}
                      onDeleteExpense={requestDeleteExpense}
                      currentUserName={userProfile?.name || ''}
                      currentUserId={userProfile?.id || ''}
                      tripCreatorName={currentTrip?.creatorName || currentTrip?.creator_name || ''}
                      tripCreatorId={currentTrip?.createdBy || ''}
                      getAvatarForMember={getAvatarForMember}
                    />
                  </div>
                </motion.div>
              )}

              {/* PROFILE TAB: My trips & account overview */}
              {activeTab === 'profile' && userProfile && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="pb-28 sm:pb-6"
                >
                  <ProfilePanel
                    userProfile={userProfile}
                    allTrips={allTrips}
                    expenses={expenses}
                    settlements={settlements}
                    spentTotal={totalSpent}
                    onOpenTrip={(tripId) => {
                      handleSelectTrip(tripId);
                      setActiveTab('dashboard');
                    }}
                    onDeleteTrip={requestDeleteTrip}
                    onCreateTrip={() => setShowNewTripModal(true)}
                  />
                </motion.div>
              )}

              {/* 2. SETTLEMENTS TAB */}
              {activeTab === 'settlements' && (
                <motion.div
                  key="settlements"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentTrip ? (
                    <SettlementsTab
                      trip={currentTrip}
                      settlements={settlements}
                      settledIds={settledIds}
                      settlementDetailsMap={settlementDetailsMap}
                      onCashSettle={handleCashSettle}
                      onFinalizeUpiSettle={handleFinalizeUpiSettle}
                      getAvatarForMember={getAvatarForMember}
                      expenses={currentExpenses}
                      netBalances={netBalances}
                      totalSpent={totalSpent}
                      perPersonShare={perPersonShare}
                      currentUserName={userProfile?.name || 'Naqeeb'}
                    />
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 max-w-lg mx-auto">
                      <Lock className="w-8 h-8 text-teal-500 mx-auto" />
                      <h3 className="text-lg font-bold">No Active Trip</h3>
                      <p className="text-xs text-slate-400">
                        Please sign in and create or select a trip to view settlements.
                      </p>
                      <button
                        onClick={() => {
                          if (!userProfile) setShowAuthModal(true);
                          else setShowNewTripModal(true);
                        }}
                        className="bg-teal-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                      >
                        {!userProfile ? 'Sign In' : 'Create Trip'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 3. MEMBERS TAB */}
              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="pb-28 sm:pb-6"
                >
                  {currentTrip ? (
                    <MembersTab
                      trip={currentTrip}
                      onAddMember={handleAddMember}
                      onDeleteMember={handleDeleteMember}
                      currentUserId={userProfile?.id}
                    />
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 max-w-lg mx-auto">
                      <Users className="w-8 h-8 text-teal-500 mx-auto" />
                      <h3 className="text-lg font-bold">No Members</h3>
                      <p className="text-xs text-slate-400">
                        Create or select a trip to manage members.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 4. AI BUDGET ESTIMATOR TAB */}
              {activeTab === 'estimator' && (
                <motion.div
                  key="estimator"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <BudgetEstimator />
                </motion.div>
              )}

              {/* 4.5 CURRENCY CONVERTER TAB */}
              {activeTab === 'currency' && (
                <motion.div
                  key="currency"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <CurrencyConverter />
                </motion.div>
              )}

              {/* 5. TRAVEL COMMUNITY BOARD TAB */}
              {activeTab === 'community' && (
                <motion.div
                  key="community"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="pb-28 sm:pb-6"
                >
                  <CommunityAnnouncements
                    userProfile={userProfile}
                    onOpenAuthModal={() => setShowAuthModal(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Global Footer */}
        <Footer />

        {/* MODALS */}
        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onMockLogin={(mockUser) => {
            setUserProfile(mockUser);
            loadUserData(mockUser.id);
          }}
        />

        {/* New Trip Modal with Mandatory Login Check */}
        <NewTripModal
          isOpen={showNewTripModal}
          onClose={() => setShowNewTripModal(false)}
          onCreateTrip={handleCreateTrip}
          userProfile={userProfile}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />

        {/* Invite Friends Modal */}
        <AnimatePresence>
          {showInviteModal && currentTrip && (
            <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl text-center relative"
              >
                <div className="p-3 bg-teal-500/10 text-teal-500 rounded-2xl w-max mx-auto mb-4 border border-teal-500/20">
                  <Share2 className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Invite Friends to Trip
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  Anyone with this link can join <strong>{currentTrip.name}</strong>, enter their UPI ID, and split expenses.
                </p>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between mb-5">
                  <span className="text-xs font-mono text-teal-600 dark:text-teal-400 truncate mr-2">
                    {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/trip/join/{currentTrip.invite_token || currentTrip.inviteToken || 'tripwise_invite'}
                  </span>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/trip/join/${currentTrip.invite_token || currentTrip.inviteToken || 'tripwise_invite'}`;
                      navigator.clipboard.writeText(link);
                      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
                      setInviteCopied(true);
                      setTimeout(() => setInviteCopied(false), 1800);
                    }}
                    className="bg-teal-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 hover:bg-teal-400 transition"
                  >
                    {inviteCopied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-2xl text-xs transition"
                >
                  Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Confirm Trip Delete Modal */}
        <ConfirmModal
          isOpen={!!confirmTripId}
          onClose={() => setConfirmTripId(null)}
          onConfirm={executeDeleteTrip}
          title="Delete this trip?"
          message={`This permanently deletes "${(currentTrip && String(currentTrip.id) === String(confirmTripId)) ? currentTrip.name : 'this trip'}", its expenses and member logs. This action cannot be undone.`}
          confirmLabel="Delete Trip"
          cancelLabel="Keep Trip"
          tone="danger"
          icon={Trash2}
        />

        <ConfirmModal
          isOpen={!!expenseToDeleteId}
          onClose={() => setExpenseToDeleteId(null)}
          onConfirm={confirmDeleteExpense}
          title="Delete this expense?"
          message="This removes the expense from the trip and flips it out of everyone's share automatically. This can't be undone."
          confirmLabel="Delete Expense"
          cancelLabel="Keep It"
          tone="danger"
          icon={Trash2}
        />

        {/* Floating toasts — errors (appError) + successes (successMsg) */}
        <Toast message={appError} tone="error" onDismiss={() => setAppError(null)} />
        <Toast message={successMsg?.message} tone={successMsg?.tone || 'success'} onDismiss={() => setSuccessMsg(null)} />
      </div>
    </div>
  );
}
