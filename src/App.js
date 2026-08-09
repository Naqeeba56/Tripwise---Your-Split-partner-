import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Users,
  Coffee,
  Car,
  Home,
  Utensils,
  ShieldCheck,
  Sun,
  HandCoins,
  Moon,
  ArrowRightLeft,
  PieChart,
  ChevronDown,
  Check,
  PlaneTakeoff,
  UserCheck,
  Image as ImageIcon,
  Camera,
  LogOut,
  Share2,
  Copy,
  Sparkles,
  Clock,
  CreditCard,
  Hash,
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAX5dRXGa-egNC_p5j2Gb14eFfGKngNFWQ",
  authDomain: "tripwise-1e1e3.firebaseapp.com",
  projectId: "tripwise-1e1e3",
  storageBucket: "tripwise-1e1e3.firebasestorage.app",
  messagingSenderId: "767104520711",
  appId: "1:767104520711:web:4e9a7dcf9761efca35d0a2",
  measurementId: "G-8XBVDGWM34",
};

// Initialize Firebase safely
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- CATEGORY CONFIGURATION ---
const CATEGORIES = [
  {
    id: "Food",
    label: "Food & Drinks",
    icon: Utensils,
    bgLight: "bg-amber-100 text-amber-700",
    bgDark: "dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    id: "Stay",
    label: "Stay",
    icon: Home,
    bgLight: "bg-purple-100 text-purple-700",
    bgDark: "dark:bg-purple-500/10 dark:text-purple-400",
  },
  {
    id: "Travel",
    label: "Travel",
    icon: Car,
    bgLight: "bg-blue-100 text-blue-700",
    bgDark: "dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    id: "Leisure",
    label: "Activities",
    icon: Coffee,
    bgLight: "bg-emerald-100 text-emerald-700",
    bgDark: "dark:bg-emerald-500/10 dark:text-emerald-400",
  },
];

// --- INITIAL MOCK DATA ---
const INITIAL_TRIPS = [
  {
    id: 1,
    name: "Goa Trip 2026",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000&auto=format&fit=crop",
    createdBy: "public",
    members: [
      {
        name: "Alex",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      },
      {
        name: "Sam",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      },
      { name: "Rohan", avatar: null },
      { name: "Priya", avatar: null },
    ],
  },
];

const INITIAL_EXPENSES = [
  {
    id: 1,
    tripId: 1,
    title: "Beach Villa Stay",
    amount: 16000,
    paidBy: "Alex",
    category: "Stay",
  },
  {
    id: 2,
    tripId: 1,
    title: "Scooter Rental & Fuel",
    amount: 3200,
    paidBy: "Sam",
    category: "Travel",
  },
  {
    id: 3,
    tripId: 1,
    title: "Seafood Dinner",
    amount: 4800,
    paidBy: "Rohan",
    category: "Food",
  },
];

// --- UTILITY: COMPRESS IMAGES VIA CANVAS ---
const compressImage = (file, maxWidth, quality, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      callback(compressedDataUrl);
    };
  };
};

// --- EXPENSE CARD COMPONENT ---
const ExpenseCard = ({ expense, onSettleExpense, getAvatarForMember }) => {
  const [balance, setBalance] = useState(expense.amount);
  const [isSettled, setIsSettled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  useEffect(() => {
    setBalance(expense.amount);
  }, [expense.amount]);

  const handleSettlement = (settleAmount) => {
    if (balance <= 0) return;

    const newBalance = Math.max(0, balance - settleAmount);
    setBalance(newBalance);

    if (newBalance === 0) {
      setIsSettled(true);
      setShowSuccessBadge(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });

      const animTimer = setTimeout(() => {
        setIsAnimating(true);
      }, 1200);

      const removeTimer = setTimeout(() => {
        if (onSettleExpense) {
          onSettleExpense(expense.id);
        }
      }, 1700);

      return () => {
        clearTimeout(animTimer);
        clearTimeout(removeTimer);
      };
    }
  };

  const catObj =
    CATEGORIES.find((c) => c.id === expense.category) || CATEGORIES[0];
  const CatIcon = catObj.icon;
  const paidBy = expense.paidBy || expense.payer || "Unknown";
  const paidByAvatar = getAvatarForMember ? getAvatarForMember(paidBy) : null;

  return (
    <div
      className={`expense-card p-4 sm:p-5 rounded-3xl border transition-all duration-300 ${
        isSettled ? "settled-neumorphic" : "default-neumorphic"
      } ${isAnimating ? "slide-left-fade-out" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`p-2.5 sm:p-3 rounded-2xl flex-shrink-0 ${catObj.bgLight} ${catObj.bgDark}`}
          >
            <CatIcon className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {expense.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 truncate">
              <span className="text-[11px] sm:text-xs text-slate-400">
                Paid by
              </span>
              {paidByAvatar && (
                <img
                  src={paidByAvatar}
                  alt={paidBy}
                  className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                />
              )}
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                {paidBy}
              </span>
            </div>
          </div>
        </div>

        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex-shrink-0">
          ₹
          {balance.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      {showSuccessBadge && (
        <div className="success-badge mt-3 text-[11px] sm:text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 inline-flex items-center gap-1 shadow-md">
          ✓ Settled Successfully
        </div>
      )}

      {!isSettled && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end">
          <button
            type="button"
            className="settle-btn text-[11px] sm:text-xs font-extrabold px-4 py-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm transition-all active:scale-95"
            onClick={() => handleSettlement(balance)}
          >
            Settle Full Amount
          </button>
        </div>
      )}
    </div>
  );
};

// --- CUSTOM TRIP DROPDOWN ---
function GlassTripDropdown({
  trips,
  activeTripId,
  onSelectTrip,
  onOpenNewTripModal,
  isAdmin,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeTrip =
    trips.find((t) => String(t.id) === String(activeTripId)) || trips[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-teal-500/40 dark:hover:border-teal-400/40 hover:bg-white dark:hover:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none max-w-[170px] sm:max-w-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          {activeTrip?.image ? (
            <img
              src={activeTrip.image}
              alt={activeTrip.name}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-md object-cover border border-teal-500/30 flex-shrink-0"
            />
          ) : (
            <PlaneTakeoff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
            {activeTrip?.name || "Select Trip"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? "rotate-180 text-teal-500" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 mt-2 w-64 sm:w-72 origin-top-left rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-slate-800 shadow-2xl p-2 z-50 overflow-hidden"
          >
            <div className="px-3.5 py-2 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Switch Trip ({trips.length})
              </span>
            </div>

            <div className="py-1.5 space-y-1 max-h-60 overflow-y-auto">
              {trips.map((trip) => {
                const isSelected = String(trip.id) === String(activeTripId);
                return (
                  <motion.button
                    type="button"
                    key={trip.id}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      onSelectTrip(trip.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 sm:py-3 rounded-2xl text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-extrabold shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {trip.image ? (
                        <img
                          src={trip.image}
                          alt={trip.name}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {trip.name[0]}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm truncate">
                          {trip.name}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {trip.members?.length || 0} members
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-sm flex-shrink-0 ml-2">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {isAdmin && (
              <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenNewTripModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-xs transition border border-teal-500/30"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Create New Trip</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- CUSTOM MEMBER DROPDOWN ---
function GlassMemberDropdown({ members, selectedMember, onSelectMember }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeMember = members.find(
    (m) => (typeof m === "string" ? m : m.name) === selectedMember,
  );
  const displayName =
    typeof activeMember === "string"
      ? activeMember
      : activeMember?.name || selectedMember;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition shadow-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <UserCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span className="truncate">{displayName || "Select Member"}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180 text-teal-500" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-slate-800 shadow-2xl p-1.5 z-50 overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto space-y-1">
              {members.map((m) => {
                const memberName = typeof m === "string" ? m : m.name;
                const avatar = typeof m === "object" ? m.avatar : null;
                const isSelected = memberName === selectedMember;
                return (
                  <button
                    type="button"
                    key={memberName}
                    onClick={() => {
                      onSelectMember(memberName);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                      isSelected
                        ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={memberName}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {memberName[0]}
                        </div>
                      )}
                      <span className="truncate">{memberName}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-teal-500 stroke-[3] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- CUSTOM CATEGORY DROPDOWN ---
function GlassCategoryDropdown({
  categories,
  selectedCategory,
  onSelectCategory,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeCat =
    categories.find((c) => c.id === selectedCategory) || categories[0];
  const ActiveIcon = activeCat.icon;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <ActiveIcon className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span>{activeCat.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180 text-teal-500" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-slate-800 shadow-2xl p-1.5 z-50 overflow-hidden"
          >
            <div className="space-y-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = cat.id === selectedCategory;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                      isSelected
                        ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 stroke-[2] flex-shrink-0" />
                      <span>{cat.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-teal-500 stroke-[3] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [appError, setAppError] = useState(null);

  useEffect(() => {
    if (appError) {
      const timer = setTimeout(() => {
        setAppError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [appError]);

  const [userGoogleProfile, setUserGoogleProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [allTrips, setAllTrips] = useState(INITIAL_TRIPS);
  const [activeTripId, setActiveTripId] = useState(() => {
    const saved = localStorage.getItem("splittrip_active_id");
    return saved ? JSON.parse(saved) : 1;
  });
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [settledIds, setSettledIds] = useState([]);
  const [settlementDetailsMap, setSettlementDetailsMap] = useState({});

  useEffect(() => {
    localStorage.setItem("splittrip_active_id", JSON.stringify(activeTripId));
  }, [activeTripId]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserGoogleProfile({
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email,
          avatar: user.photoURL || null,
        });
        setIsAdmin(true);
      } else {
        setUserGoogleProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribeTrips = onSnapshot(
      collection(db, "trips"),
      (snapshot) => {
        const firebaseTrips = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (firebaseTrips.length > 0) {
          const combined = [...INITIAL_TRIPS];
          firebaseTrips.forEach((ft) => {
            if (!combined.some((ct) => String(ct.id) === String(ft.id))) {
              combined.push(ft);
            } else {
              const index = combined.findIndex(
                (ct) => String(ct.id) === String(ft.id),
              );
              combined[index] = ft;
            }
          });
          setAllTrips(combined);
        }
      },
      (error) => {
        console.warn("Firestore trips offline/fallback active:", error);
      },
    );

    const unsubscribeExpenses = onSnapshot(
      collection(db, "expenses"),
      (snapshot) => {
        const firebaseExpenses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (firebaseExpenses.length > 0) {
          setExpenses(firebaseExpenses);
        }
      },
      (error) => {
        console.warn("Firestore expenses offline/fallback active:", error);
      },
    );

    const unsubscribeSettled = onSnapshot(
      doc(db, "meta", "settledState"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.settledIds) setSettledIds(data.settledIds);
          if (data.settlementDetailsMap)
            setSettlementDetailsMap(data.settlementDetailsMap);
        }
      },
      (error) => {
        console.warn("Firestore settledIds offline/fallback active:", error);
      },
    );

    return () => {
      unsubscribeTrips();
      unsubscribeExpenses();
      unsubscribeSettled();
    };
  }, []);

  const trips = useMemo(() => {
    return allTrips.length > 0 ? allTrips : INITIAL_TRIPS;
  }, [allTrips]);

  useEffect(() => {
    if (
      !trips.find((t) => String(t.id) === String(activeTripId)) &&
      trips.length > 0
    ) {
      setActiveTripId(trips[0].id);
    }
  }, [trips, activeTripId]);

  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [newTripPic, setNewTripPic] = useState(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("Food");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState(null);

  const currentTrip = useMemo(() => {
    return (
      trips.find((t) => String(t.id) === String(activeTripId)) ||
      trips[0] || { members: [] }
    );
  }, [trips, activeTripId]);

  useEffect(() => {
    if (currentTrip && currentTrip.members?.length > 0) {
      const firstMemberName =
        typeof currentTrip.members[0] === "string"
          ? currentTrip.members[0]
          : currentTrip.members[0].name;
      setPaidBy(firstMemberName);
    }
  }, [currentTrip]);

  const currentExpenses = useMemo(() => {
    return expenses.filter((e) => String(e.tripId) === String(activeTripId));
  }, [expenses, activeTripId]);

  const totalSpent = useMemo(() => {
    return currentExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentExpenses]);

  const perPersonShare = useMemo(() => {
    return currentTrip.members?.length
      ? totalSpent / currentTrip.members.length
      : 0;
  }, [totalSpent, currentTrip]);

  const netBalances = useMemo(() => {
    const balances = {};
    if (!currentTrip.members) return balances;
    currentTrip.members.forEach((m) => {
      const name = typeof m === "string" ? m : m.name;
      balances[name] = -perPersonShare;
    });
    currentExpenses.forEach((exp) => {
      const payer = exp.paidBy || exp.payer;
      if (balances[payer] !== undefined) {
        balances[payer] += exp.amount;
      }
    });
    return balances;
  }, [currentTrip, currentExpenses, perPersonShare]);

  const settlements = useMemo(() => {
    const debtors = [];
    const creditors = [];

    Object.entries(netBalances).forEach(([person, balance]) => {
      const rounded = Math.round(balance);
      if (rounded < -1) debtors.push({ person, amount: -rounded });
      else if (rounded > 1) creditors.push({ person, amount: rounded });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const result = [];
    let i = 0,
      j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const payment = Math.min(debtor.amount, creditor.amount);

      result.push({
        id: `${debtor.person}-${creditor.person}-${payment}`,
        from: debtor.person,
        to: creditor.person,
        amount: payment,
      });

      debtor.amount -= payment;
      creditor.amount -= payment;

      if (debtor.amount === 0) i++;
      if (creditor.amount === 0) j++;
    }

    return result;
  }, [netBalances]);

  const getAvatarForMember = (memberName) => {
    const memberObj = currentTrip.members?.find(
      (m) => (typeof m === "string" ? m : m.name) === memberName,
    );
    return typeof memberObj === "object" ? memberObj?.avatar : null;
  };

  const handleCompressedImageUpload = (e, setPicState) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 400, 0.6, (compressedBase64) => {
        setPicState(compressedBase64);
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      setUserGoogleProfile({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        avatar: user.photoURL,
      });
      setIsAdmin(true);
      setShowAuthModal(false);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setAppError("Failed to sign in with Google: " + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserGoogleProfile(null);
    } catch (error) {
      console.error("Sign-Out Error:", error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title || title.trim() === "") {
      setAppError("Expense title cannot be empty!");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setAppError("Please enter a valid expense amount!");
      return;
    }

    const newExpId = String(Date.now());
    const newExp = {
      id: newExpId,
      tripId: activeTripId,
      title: title.trim(),
      amount: parseFloat(amount),
      paidBy,
      category,
    };

    try {
      await setDoc(doc(db, "expenses", newExpId), newExp);
    } catch (error) {
      console.warn("Firestore expense sync fallback:", error);
      setExpenses([newExp, ...expenses]);
    }

    setTitle("");
    setAmount("");
    setAppError(null);
  };

  const handleSettleExpenseCard = async (expenseId) => {
    setExpenses((prev) =>
      prev.filter((exp) => String(exp.id) !== String(expenseId)),
    );
    try {
      await deleteDoc(doc(db, "expenses", String(expenseId)));
    } catch (error) {
      console.warn("Firestore remove expense fallback:", error);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!newTripName.trim()) {
      setAppError("Trip name cannot be empty.");
      return;
    }

    const newTripId = Date.now();
    const newTrip = {
      id: newTripId,
      name: newTripName.trim(),
      image: newTripPic,
      createdBy: userGoogleProfile ? userGoogleProfile.uid : "public",
      members: userGoogleProfile
        ? [
            {
              name: userGoogleProfile.name.split(" ")[0],
              avatar: userGoogleProfile.avatar,
            },
          ]
        : [{ name: "Alex", avatar: null }],
    };

    try {
      await setDoc(doc(db, "trips", String(newTripId)), newTrip);
    } catch (error) {
      console.warn("Firestore trip creation fallback:", error);
      setAllTrips([...allTrips, newTrip]);
    }

    setActiveTripId(newTripId);
    setNewTripName("");
    setNewTripPic(null);
    setShowNewTripModal(false);
    setAppError(null);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setAppError("Member name cannot be empty.");
      return;
    }

    const memberExists = currentTrip.members?.some(
      (m) =>
        (typeof m === "string" ? m : m.name).toLowerCase() ===
        newMemberName.trim().toLowerCase(),
    );
    if (memberExists) {
      setAppError("A member with this name already exists in the trip.");
      return;
    }

    const newMemberObj = {
      name: newMemberName.trim(),
      avatar: newMemberAvatar,
    };

    const updatedMembers = [...(currentTrip.members || []), newMemberObj];

    try {
      await setDoc(
        doc(db, "trips", String(activeTripId)),
        {
          ...currentTrip,
          members: updatedMembers,
        },
        { merge: true },
      );
    } catch (error) {
      console.warn("Firestore member addition fallback:", error);
      const updatedTrips = allTrips.map((t) => {
        if (String(t.id) === String(activeTripId)) {
          return { ...t, members: updatedMembers };
        }
        return t;
      });
      setAllTrips(updatedTrips);
    }

    setNewMemberName("");
    setNewMemberAvatar(null);
    setAppError(null);
  };

  const handleSettle = async (settlement) => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });

    const dynamicData = {
      settledAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      settledDate: new Date().toLocaleDateString(),
      method: "Instant UPI / Direct Transfer",
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    const updatedSettledIds = [...settledIds, settlement.id];
    const updatedMap = {
      ...settlementDetailsMap,
      [settlement.id]: dynamicData,
    };

    setSettledIds(updatedSettledIds);
    setSettlementDetailsMap(updatedMap);

    try {
      await setDoc(doc(db, "meta", "settledState"), {
        settledIds: updatedSettledIds,
        settlementDetailsMap: updatedMap,
      });
    } catch (error) {
      console.warn("Firestore settlement sync fallback:", error);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .default-neumorphic {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .dark .default-neumorphic {
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 6px 6px 16px rgba(0, 0, 0, 0.4), -4px -4px 12px rgba(30, 41, 59, 0.3);
          border: 1px solid rgba(30, 41, 59, 0.8);
        }
        .settled-neumorphic {
          background: rgba(16, 185, 129, 0.08);
          box-shadow: inset 4px 4px 8px rgba(16, 185, 129, 0.15), inset -4px -4px 8px rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .dark .settled-neumorphic {
          background: rgba(16, 185, 129, 0.1);
          box-shadow: inset 4px 4px 10px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .slide-left-fade-out {
          animation: slideOutLeft 0.5s forwards cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideOutLeft {
          0% {
            transform: translateX(0);
            opacity: 1;
            max-height: 200px;
            margin-bottom: 12px;
            padding: 20px;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
            max-height: 0;
            margin-bottom: 0;
            padding-top: 0;
            padding-bottom: 0;
            overflow: hidden;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 pb-20">
        {/* Navigation Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-3 flex items-center justify-between gap-2">
            {/* BRAND & TRIP DROPDOWN CONTAINER */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
              <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-teal-500/20 text-slate-950 flex-shrink-0">
                <HandCoins className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3.5 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-teal-500 to-emerald-500 dark:from-teal-400 dark:to-emerald-300 bg-clip-text text-transparent truncate leading-tight">
                  Tripwise
                </h1>

                <div className="mt-0.5 sm:mt-0">
                  <GlassTripDropdown
                    trips={trips}
                    activeTripId={activeTripId}
                    onSelectTrip={setActiveTripId}
                    onOpenNewTripModal={() => setShowNewTripModal(true)}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>
            </div>

            {/* HEADER QUICK ACTIONS */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 text-slate-700 dark:text-slate-300 p-2 sm:px-3.5 sm:py-2 rounded-2xl text-xs sm:text-xs font-extrabold transition shadow-sm"
                title="Invite Friends"
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500" />
                <span className="hidden sm:inline">Invite</span>
              </button>

              {userGoogleProfile ? (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl">
                  {userGoogleProfile.avatar ? (
                    <img
                      src={userGoogleProfile.avatar}
                      alt="Profile"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-500/20 text-teal-500 text-[10px] sm:text-xs font-bold flex items-center justify-center">
                      {userGoogleProfile.name[0]}
                    </div>
                  )}
                  <span className="text-xs font-bold hidden md:inline">
                    {userGoogleProfile.name}
                  </span>
                  <button
                    onClick={handleSignOut}
                    title="Sign out"
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 text-slate-800 dark:text-slate-200 p-2 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-extrabold transition shadow-sm"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Gmail Login</span>
                </button>
              )}

              <button
                onClick={() => setShowNewTripModal(true)}
                className="flex items-center gap-1.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 p-2 sm:px-4 sm:py-2 rounded-2xl text-xs font-extrabold transition shadow-sm"
                title="Create New Trip"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                <span className="hidden sm:inline">New Trip</span>
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              >
                {darkMode ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-6xl mx-auto px-3 sm:px-6 flex border-t border-slate-200/60 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
            {[
              { id: "dashboard", label: "Dashboard", icon: PieChart },
              {
                id: "settlements",
                label: "Settlements",
                icon: ArrowRightLeft,
                badge: settlements.length,
              },
              {
                id: "members",
                label: "Members",
                icon: Users,
                badge: currentTrip.members?.length || 0,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2.5 px-3.5 sm:py-3.5 sm:px-5 text-xs sm:text-sm font-extrabold border-b-[3px] transition-all flex-shrink-0 whitespace-nowrap ${
                    isActive
                      ? "border-teal-500 text-teal-600 dark:text-teal-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-teal-500/20 text-teal-700 dark:text-teal-300"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Main Application Body */}
        <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
          {/* ACTIVE TRIP COVER PHOTO BANNER */}
          {currentTrip.image && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-36 sm:h-64 rounded-3xl sm:rounded-[2.5rem] overflow-hidden relative shadow-xl shadow-teal-500/5 group border border-slate-200/50 dark:border-slate-800/50"
            >
              <img
                src={currentTrip.image}
                alt={currentTrip.name}
                className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-4 sm:p-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-teal-500/20 backdrop-blur-md text-teal-300 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border border-teal-500/30">
                    Active Trip
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-300">
                    {currentTrip.members?.length || 0} Members
                  </span>
                </div>
                <h2 className="text-xl sm:text-4xl md:text-5xl font-black text-white tracking-tight truncate">
                  {currentTrip.name}
                </h2>
              </div>
            </motion.div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
              <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3.5 sm:p-5 rounded-3xl shadow-sm">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total Spent
                    </p>
                    <h3 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 sm:mt-2 truncate">
                      ₹{totalSpent.toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3.5 sm:p-5 rounded-3xl shadow-sm">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                      Per Person
                    </p>
                    <h3 className="text-lg sm:text-3xl font-black text-teal-600 dark:text-teal-400 mt-1 sm:mt-2 truncate">
                      ₹{Math.round(perPersonShare).toLocaleString()}
                    </h3>
                  </div>
                </div>

                {/* Expense Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-3.5 sm:mb-5 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-teal-500 stroke-[3]" />
                    Add Expense
                  </h2>

                  <form
                    onSubmit={handleAddExpense}
                    className="space-y-3.5 sm:space-y-4"
                  >
                    <div>
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Expense Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dinner, Fuel, Villa"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      />

                      <AnimatePresence>
                        {appError && (
                          <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1 block animate-pulse"
                          >
                            ⚠️ {appError}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                          Paid By
                        </label>
                        <GlassMemberDropdown
                          members={currentTrip.members || []}
                          selectedMember={paidBy}
                          onSelectMember={setPaidBy}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Category
                      </label>
                      <GlassCategoryDropdown
                        categories={CATEGORIES}
                        selectedCategory={category}
                        onSelectCategory={setCategory}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 mt-2"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                      Add Expense
                    </button>
                  </form>
                </div>
              </div>

              {/* Expense Feed */}
              <div className="lg:col-span-7">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-4 sm:mb-5 flex items-center gap-2.5">
                    <Receipt className="w-5 h-5 text-slate-400" />
                    Expense Feed ({currentExpenses.length})
                  </h2>

                  <div className="space-y-3">
                    {currentExpenses.length === 0 ? (
                      <p className="text-xs sm:text-sm font-semibold text-slate-400 text-center py-10">
                        No expenses added to this trip yet.
                      </p>
                    ) : (
                      currentExpenses.map((exp) => (
                        <ExpenseCard
                          key={exp.id}
                          expense={exp}
                          onSettleExpense={handleSettleExpenseCard}
                          getAvatarForMember={getAvatarForMember}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTLEMENTS TAB */}
          {activeTab === "settlements" && (
            <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
                  <div>
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
                      Optimized Settlement Plan
                    </h2>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                      Minimum transactions required to balance all debts for{" "}
                      <strong>{currentTrip.name}</strong>.
                    </p>
                  </div>

                  <span className="self-start sm:self-center text-[10px] sm:text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full font-extrabold">
                    {
                      settlements.filter((s) => !settledIds.includes(s.id))
                        .length
                    }{" "}
                    Pending
                  </span>
                </div>

                <div className="space-y-3.5 sm:space-y-4">
                  {settlements.length === 0 ? (
                    <div className="text-center py-10 sm:py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-4">
                      <CheckCircle2 className="w-10 h-10 sm:w-14 sm:h-14 text-teal-500 mx-auto mb-3 opacity-90" />
                      <p className="text-xs sm:text-base font-extrabold text-slate-800 dark:text-slate-200">
                        Trip Fully Settled!
                      </p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-1">
                        Nobody owes any money right now.
                      </p>
                    </div>
                  ) : (
                    settlements.map((s) => {
                      const isSettled = settledIds.includes(s.id);
                      const details = settlementDetailsMap[s.id];
                      const fromAvatar = getAvatarForMember(s.from);
                      const toAvatar = getAvatarForMember(s.to);

                      return (
                        <div
                          key={s.id}
                          className="flex flex-col p-3.5 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 shadow-sm transition-all gap-3.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                            <div className="flex items-center justify-around sm:justify-start space-x-3 sm:space-x-4">
                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                {fromAvatar ? (
                                  <img
                                    src={fromAvatar}
                                    alt={s.from}
                                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-rose-500/40 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-xs sm:text-sm flex items-center justify-center">
                                    {s.from[0]}
                                  </div>
                                )}
                                <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[80px] text-center">
                                  {s.from}
                                </span>
                              </div>

                              <div className="flex flex-col items-center px-1">
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500 stroke-[3]" />
                                <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                                  Owes
                                </span>
                              </div>

                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                {toAvatar ? (
                                  <img
                                    src={toAvatar}
                                    alt={s.to}
                                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-emerald-500/40 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-xs sm:text-sm flex items-center justify-center">
                                    {s.to[0]}
                                  </div>
                                )}
                                <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[80px] text-center">
                                  {s.to}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/60 dark:border-slate-800/60">
                              <span className="text-base sm:text-xl font-black text-teal-600 dark:text-teal-400">
                                ₹{s.amount.toLocaleString()}
                              </span>

                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={() => !isSettled && handleSettle(s)}
                                className={`text-[11px] sm:text-xs font-extrabold px-3.5 py-2 sm:px-5 sm:py-3 rounded-2xl transition-all duration-300 shadow-md flex items-center gap-1.5 ${
                                  isSettled
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/25 cursor-default ring-2 ring-emerald-400/40 font-black"
                                    : "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20"
                                }`}
                              >
                                {isSettled ? (
                                  <>
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                      }}
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </motion.div>
                                    <span className="tracking-wide">
                                      Settled
                                    </span>
                                  </>
                                ) : (
                                  <span>Mark Settled</span>
                                )}
                              </motion.button>
                            </div>
                          </div>

                          {isSettled && details && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                              className="mt-2 pt-2.5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] sm:text-xs bg-emerald-500/5 p-2.5 sm:p-3 rounded-2xl border border-emerald-500/20"
                            >
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <Clock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span>
                                  {details.settledAt} ({details.settledDate})
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span>{details.method}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                <Hash className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span>{details.transactionId}</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === "members" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-7 shadow-sm">
                <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 sm:mb-5 flex items-center gap-2.5">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
                  Trip Members ({currentTrip.members?.length || 0})
                </h2>

                <div className="space-y-2.5 sm:space-y-3 mb-6">
                  {currentTrip.members?.map((m, idx) => {
                    const name = typeof m === "string" ? m : m.name;
                    const avatar = typeof m === "object" ? m.avatar : null;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-teal-500/30 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                              {name[0]}
                            </div>
                          )}
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                            {name}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full flex-shrink-0">
                          Member
                        </span>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleAddMember}
                  className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60"
                >
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    Add New Member
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="flex gap-3 items-center">
                      <label className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-teal-500 transition overflow-hidden flex-shrink-0">
                        {newMemberAvatar ? (
                          <img
                            src={newMemberAvatar}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-teal-500 transition" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleCompressedImageUpload(e, setNewMemberAvatar)
                          }
                          className="hidden"
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="Add member name..."
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="flex-1 sm:hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Add member name..."
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="hidden sm:block flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    />

                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-extrabold transition shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        {/* GOOGLE AUTH MODAL */}
        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl text-center"
              >
                <div className="p-3 bg-teal-500/10 text-teal-500 rounded-2xl w-max mx-auto mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>

                <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                  Welcome to Tripwise
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mb-6">
                  Sign in with your Google account to sync your trips across
                  devices.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-100 font-extrabold py-3 px-4 rounded-2xl text-xs sm:text-sm transition shadow-md"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="mt-4 text-[11px] sm:text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* INVITE LINK MODAL */}
        <AnimatePresence>
          {showInviteModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-teal-500/10 text-teal-500 rounded-2xl flex-shrink-0">
                    <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      Invite Friends
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Share trip link to collaborate
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 px-2 outline-none truncate"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 p-2 rounded-xl text-xs font-extrabold flex items-center gap-1 transition flex-shrink-0"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold rounded-2xl text-xs"
                >
                  Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CREATE NEW TRIP MODAL */}
        <AnimatePresence>
          {showNewTripModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl"
              >
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-4 sm:mb-5">
                  Create New Trip
                </h3>
                <form onSubmit={handleCreateTrip} className="space-y-4">
                  <div>
                    <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Trip Cover Photo
                    </label>
                    <label className="w-full h-28 sm:h-32 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500/50 transition overflow-hidden">
                      {newTripPic ? (
                        <img
                          src={newTripPic}
                          alt="Trip cover preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400">
                          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-[11px] sm:text-xs font-semibold">
                            Click to upload cover photo
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleCompressedImageUpload(e, setNewTripPic)
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Trip Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Goa Trip 2026, Manali Expedition"
                      value={newTripName}
                      onChange={(e) => setNewTripName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowNewTripModal(false)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-sm"
                    >
                      Create Trip
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FOOTER SECTION */}
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
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap mt-1">
                    Smart group expense splitting &amp; instant settlement tracking.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
                  <span>&copy; 2026 <strong className="text-slate-800 dark:text-slate-200">Mohd Naqeeb</strong>. All rights reserved.</span>
                  <span className="hidden sm:inline">|</span>
                  <span className="flex items-center gap-1">
                    Connect on
                    <a
                      href="https://www.linkedin.com/in/your-linkedin-profile"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn Profile"
                      className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="w-4 h-4 fill-current" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.983 2.821a2.188 2.188 0 1 0 0 4.376 2.188 2.188 0 1 0 0-4.376M9.237 8.855v12.139h3.769v-6.003c0-1.584.298-3.118 2.262-3.118 1.937 0 1.961 1.811 1.961 3.218v5.904H21v-6.657c0-3.27-.704-5.783-4.526-5.783-1.835 0-3.065 1.007-3.568 1.96h-.051v-1.66zm-6.142 0H6.87v12.139H3.095z"/>
                      </svg>
                    </a>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}