'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Car,
  Home,
  Compass,
  ArrowRight,
  TrendingDown,
  Lightbulb,
  Check,
  Zap,
  DollarSign,
  PieChart,
  Navigation,
  Star,
  CloudSun,
  Shield,
  Clock,
  PlusCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { calculateEstimatedBudget } from '@/lib/estimatorEngine';
import { animateCounter } from '@/lib/animeAnimations';

export default function BudgetEstimator({ onStartTripWithBudget }) {
  const [fromCity, setFromCity] = useState('Mumbai');
  const [toCity, setToCity] = useState('Lonavala');
  const [days, setDays] = useState(2);
  const [travelers, setTravelers] = useState(4);
  const [travelMode, setTravelMode] = useState('road');
  const [stayType, setStayType] = useState('homestay');
  const [travelStyle, setTravelStyle] = useState('balanced');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'stays', 'itinerary', 'gems'

  const [isCalculating, setIsCalculating] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);

  const totalBudgetRef = useRef(null);
  const perPersonRef = useRef(null);

  useEffect(() => {
    handleCalculate();
  }, []);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const result = calculateEstimatedBudget({
        fromCity,
        toCity,
        days: Number(days),
        travelers: Number(travelers),
        travelMode,
        stayType,
        travelStyle,
      });
      setEstimateResult(result);
      setIsCalculating(false);
    }, 350);
  };

  useEffect(() => {
    if (estimateResult) {
      if (totalBudgetRef.current) {
        animateCounter(totalBudgetRef.current, 0, estimateResult.totalBudget, '₹', 850);
      }
      if (perPersonRef.current) {
        animateCounter(perPersonRef.current, 0, estimateResult.perPersonCost, '₹', 850);
      }
    }
  }, [estimateResult]);

  const destData = estimateResult?.destinationData;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-16 sm:pb-8">
      {/* 1. Destination Visual Hero Header Banner */}
      {destData && (
        <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-slate-200/60 dark:border-slate-800/80 shadow-xl group">
          <img
            src={destData.image}
            alt={destData.name}
            className="w-full h-56 sm:h-80 object-cover object-center transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-5 sm:p-8 text-white space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-teal-500/30 backdrop-blur-md text-teal-300 border border-teal-500/40 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Destination Insight</span>
              </span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                <CloudSun className="w-3 h-3 text-amber-300" />
                <span>{destData.weather}</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight">
              {destData.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
              {destData.tagline}
            </p>
          </div>
        </div>
      )}

      {/* 2. Interactive Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7">
        {/* Left Form Inputs */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-500" />
            <span>Customize Trip Parameters</span>
          </h3>

          <div className="space-y-3.5">
            {/* Origin & Destination */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Starting City
                </label>
                <div className="relative">
                  <Navigation className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Destination
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-teal-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    placeholder="e.g. Lonavala"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Duration & Travelers */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Duration (Days)
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Travelers Count
                </label>
                <div className="relative">
                  <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Travel Mode */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Travel Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'road', label: 'Road / Cab' },
                  { id: 'train', label: 'Train' },
                  { id: 'flight', label: 'Flight' },
                  { id: 'selfdrive', label: 'Self Drive' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTravelMode(mode.id)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-extrabold transition text-center ${
                      travelMode === mode.id
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accommodation Tier */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Stay Style
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'homestay', label: 'Homestay' },
                  { id: 'villa', label: 'Pool Villa' },
                  { id: 'airbnb', label: 'Airbnb' },
                  { id: '3star', label: '3-Star' },
                  { id: '4star', label: '4-Star' },
                  { id: '5star', label: '5-Star Luxury' },
                  { id: 'hostel', label: 'Hostel' },
                ].map((stay) => (
                  <button
                    key={stay.id}
                    type="button"
                    onClick={() => setStayType(stay.id)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-extrabold transition text-center truncate ${
                      stayType === stay.id
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {stay.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Vibe/Style */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Budget Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'budget', label: 'Budget' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'luxury', label: 'Luxury' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setTravelStyle(style.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold transition text-center ${
                      travelStyle === style.id
                        ? 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-400 border font-black'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <Zap className="w-4 h-4 stroke-[3]" />
              <span>{isCalculating ? 'Recalculating...' : 'Recalculate AI Budget'}</span>
            </button>
          </div>
        </div>

        {/* Right Output Panels */}
        <div className="lg:col-span-7 space-y-4">
          {estimateResult && (
            <>
              {/* Grand Total Cards */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 rounded-3xl shadow-sm">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    Estimated Group Total
                  </p>
                  <h3
                    ref={totalBudgetRef}
                    className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 truncate"
                  >
                    ₹{estimateResult.totalBudget.toLocaleString('en-IN')}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    For {estimateResult.travelers} travelers ({estimateResult.days} Days)
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 rounded-3xl shadow-sm">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    Estimated / Person
                  </p>
                  <h3
                    ref={perPersonRef}
                    className="text-xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 mt-1 truncate"
                  >
                    ₹{estimateResult.perPersonCost.toLocaleString('en-IN')}
                  </h3>
                  <span className="text-[10px] text-emerald-500 font-extrabold">
                    ✓ All-inclusive estimate
                  </span>
                </div>
              </div>

              {/* Sub-Tabs for Result Insights */}
              <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Cost Allocation' },
                  { id: 'stays', label: `Top Stays (${destData?.recommendedStays?.length || 0})` },
                  { id: 'itinerary', label: 'Suggested Itinerary' },
                  { id: 'gems', label: 'Hidden Gems & Tips' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sub-Tab 1: Cost Allocation Overview */}
              {activeTab === 'overview' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-teal-500" />
                    <span>Cost Breakdown Matrix</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block">🏨 Accommodation</span>
                      <strong className="text-sm text-slate-800 dark:text-slate-200">
                        ₹{estimateResult.breakdown.stay.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block">🚗 Transport & Fuel</span>
                      <strong className="text-sm text-slate-800 dark:text-slate-200">
                        ₹{estimateResult.breakdown.transport.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block">🍔 Food & Dining</span>
                      <strong className="text-sm text-slate-800 dark:text-slate-200">
                        ₹{estimateResult.breakdown.food.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block">🎯 Activities & Entry</span>
                      <strong className="text-sm text-slate-800 dark:text-slate-200">
                        ₹{estimateResult.breakdown.activities.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block">🛡️ Emergency Buffer (10%)</span>
                      <strong className="text-sm text-teal-600 dark:text-teal-400">
                        ₹{estimateResult.breakdown.buffer.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Curated Stays */}
              {activeTab === 'stays' && destData?.recommendedStays && (
                <div className="space-y-3">
                  {destData.recommendedStays.map((stay, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3.5"
                    >
                      <img
                        src={stay.image}
                        alt={stay.name}
                        className="w-full sm:w-28 h-28 rounded-2xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            {stay.type}
                          </span>
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            {stay.rating}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {stay.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {stay.highlight}
                        </p>
                      </div>

                      <div className="text-center sm:text-right flex-shrink-0">
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 block">
                          ₹{stay.pricePerNight.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/ night</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-Tab 3: Suggested Day-Wise Itinerary */}
              {activeTab === 'itinerary' && destData?.itinerary && (
                <div className="space-y-3">
                  {destData.itinerary.map((dayPlan) => (
                    <div
                      key={dayPlan.day}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                          {dayPlan.day}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {dayPlan.title}
                        </h4>
                      </div>

                      <ul className="space-y-1.5 pl-2">
                        {dayPlan.activities.map((act, actIdx) => (
                          <li
                            key={actIdx}
                            className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2"
                          >
                            <span className="text-teal-500 font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-Tab 4: Hidden Gems & Cost Tips */}
              {activeTab === 'gems' && (
                <div className="space-y-4">
                  {/* Hidden Gems */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-500" />
                      <span>Hidden Gems & Viewpoints</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {destData?.hiddenGems?.map((gem, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                        >
                          <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 block">
                            ✨ {gem.name}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {gem.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Tips */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-500" />
                      <span>Cost-Saving Hacks</span>
                    </h4>

                    <div className="space-y-2">
                      {destData?.tips?.map((tip, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
