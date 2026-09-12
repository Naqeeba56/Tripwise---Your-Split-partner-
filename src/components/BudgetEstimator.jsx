'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MapPin, Calendar, Users, Compass, ArrowRight,
  TrendingDown, Lightbulb, Zap, PieChart, Navigation,
  CloudSun, Clock, PlusCircle, Loader2, Route,
  ExternalLink, Map, Info, ShieldCheck, Tag,
  Car, Bus, Bike, AlertCircle, Star, Camera,
  CalendarDays, MoonStar, Sunrise,
} from 'lucide-react';
import { calculateEstimatedBudget } from '@/lib/estimatorEngine';
import { animateCounter } from '@/lib/animeAnimations';
import {
  fetchPlaceAutocomplete, geocodePlace, fetchHiddenGems,
  fetchHotelsNearDestination, fetchNearbyPlaces,
  resolvePhotoUrl, getPlacePhotoUrl,
} from '@/lib/googlePlacesService';
import { computeRoute, formatDuration } from '@/lib/routesService';
import { fetchPlaceAutocompleteOffline } from '@/lib/offlineAutocomplete';
import { getCityByName, getCoverImage, getGems } from '@/lib/cityDatabase';
import {
  getTrainFares, getFlightFares, getBusFares, getCabFares,
  getBikeFares, getSelfDriveFares, estimateTolls, findCheapestCombo,
  getHotelPriceRanges, getHiddenGemsWithImages,
  getDistanceKm, getAvailableModes,
} from '@/lib/fareEngine';

// ─── Debounce ─────────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Format seconds → "Xh Ym"
const fmtSecs = (s) => {
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// Date helpers
const today = () => new Date().toISOString().split('T')[0];
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const diffDays = (from, to) => {
  const d = Math.round((new Date(to) - new Date(from)) / 86400000);
  return Math.max(1, d);
};
const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Mode definitions ─────────────────────────────────────────────────────────
const ALL_MODES = [
  { id: 'road',      label: 'Road',       emoji: '🚕' },
  { id: 'cab',       label: 'Cab',        emoji: '🚖' },
  { id: 'train',     label: 'Train',      emoji: '🚂' },
  { id: 'bus',       label: 'Bus',        emoji: '🚌' },
  { id: 'flight',    label: 'Flight',     emoji: '✈️' },
  { id: 'selfdrive', label: 'Self Drive', emoji: '🚗' },
  { id: 'bike',      label: 'Bike',       emoji: '🏍️' },
];

const TOLL_MODES = ['selfdrive', 'bike', 'cab', 'road'];

// ─── Stay options ─────────────────────────────────────────────────────────────
const STAY_OPTIONS = [
  { id: 'nostay',   label: 'No Stay',  emoji: '🏃', desc: 'Day trip' },
  { id: 'hostel',   label: 'Hostel',   emoji: '🛏️', desc: null },
  { id: 'homestay', label: 'Homestay', emoji: '🏡', desc: null },
  { id: 'airbnb',   label: 'Airbnb',   emoji: '🔑', desc: null },
  { id: '3star',    label: '3★',       emoji: '🌟', desc: null },
  { id: '4star',    label: '4★',       emoji: '⭐', desc: null },
  { id: '5star',    label: '5★',       emoji: '👑', desc: null },
  { id: 'villa',    label: 'Villa',    emoji: '🏊', desc: null },
];

// ─── PlaceImage — resolves real Google photo via skipHttpRedirect ──────────────
function PlaceImage({ photos, alt, className, fallbackSrc, w = 800, h = 600 }) {
  const [src, setSrc]       = useState(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
    if (!photos?.length) { setSrc(fallbackSrc || null); return; }
    const photoName = photos[0]?.name;
    if (!photoName) { setSrc(fallbackSrc || null); return; }
    resolvePhotoUrl(photoName, h, w).then((url) => {
      setSrc(url || getPlacePhotoUrl(photoName, h, w) || fallbackSrc || null);
    });
  }, [photos, fallbackSrc, w, h]);

  if (!src || errored) {
    return (
      <div className={`${className} bg-slate-200 dark:bg-slate-800 flex items-center justify-center`}>
        <Camera className="w-5 h-5 text-slate-400" />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} className={className}
      onError={() => { if (fallbackSrc && src !== fallbackSrc) setSrc(fallbackSrc); else setErrored(true); }} />
  );
}

// ─── CityAutocompleteInput ────────────────────────────────────────────────────
function CityAutocompleteInput({ value, onChange, onResolved, placeholder, icon: Icon, iconColor = 'text-slate-400' }) {
  const [suggs,   setSuggs]   = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const dq  = useDebounce(value, 320);
  const ref = useRef(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      if (!dq || dq.trim().length < 2) { setSuggs([]); setOpen(false); return; }
      setLoading(true);
      try {
        let r = await fetchPlaceAutocomplete(dq);
        if (!r.length) r = await fetchPlaceAutocompleteOffline(dq);
        if (!dead) { setSuggs(r); setOpen(r.length > 0); }
      } catch {
        const r = await fetchPlaceAutocompleteOffline(dq);
        if (!dead) { setSuggs(r); setOpen(r.length > 0); }
      } finally { if (!dead) setLoading(false); }
    })();
    return () => { dead = true; };
  }, [dq]);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const pick = (s) => {
    const name    = s?.placePrediction?.structuredFormat?.mainText?.text || s?.placePrediction?.text?.text || value;
    const placeId = s?.placePrediction?.placeId || s?.placePrediction?.place?.split('/').pop();
    onChange(name); setOpen(false); setSuggs([]);
    if (onResolved) onResolved(name, placeId, s?._cityData || null);
  };

  return (
    <div ref={ref} className="relative">
      <Icon className={`w-3.5 h-3.5 ${iconColor} absolute left-3 top-3 pointer-events-none`} />
      <input value={value}
        onChange={(e) => { onChange(e.target.value); if (e.target.value.length >= 2) setOpen(true); }}
        onFocus={() => suggs.length > 0 && setOpen(true)}
        placeholder={placeholder} autoComplete="off"
        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition" />
      {loading && <Loader2 className="w-3 h-3 text-teal-500 absolute right-3 top-3 animate-spin" />}
      <AnimatePresence>
        {open && suggs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
            {suggs.map((s, i) => {
              const main = s?.placePrediction?.structuredFormat?.mainText?.text || s?.placePrediction?.text?.text || 'Place';
              const sub  = s?.placePrediction?.structuredFormat?.secondaryText?.text || '';
              return (
                <button key={i} type="button" onClick={() => pick(s)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                  <MapPin className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">{main}</span>
                    {sub && <span className="text-[10px] text-slate-400 block truncate">{sub}</span>}
                  </div>
                  {sub && (
                    <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0 max-w-[90px] truncate">
                      {sub.split(',')[0].trim()}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FareCard ─────────────────────────────────────────────────────────────────
function FareCard({ emoji, label, description, oneWayPer, returnPer, totalReturn, duration, recommended, note, badge, extra }) {
  return (
    <div className={`relative rounded-2xl border p-3 space-y-1.5 transition
      ${recommended ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
      {recommended && <span className="absolute -top-2.5 right-3 text-[9px] font-bold bg-teal-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wide">Best Value</span>}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{emoji}</span>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{label}</p>
            {description && <p className="text-[10px] text-slate-400">{description}</p>}
          </div>
        </div>
        {badge && <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      <div className="flex items-end justify-between gap-3 pt-0.5">
        <div className="space-y-0.5">
          {oneWayPer !== undefined && <p className="text-[10px] text-slate-400">One-way/person: <span className="font-semibold text-slate-700 dark:text-slate-300">₹{fmt(oneWayPer)}</span></p>}
          {returnPer  !== undefined && <p className="text-[10px] text-slate-400">Return/person: <span className="font-semibold text-slate-700 dark:text-slate-300">₹{fmt(returnPer)}</span></p>}
          {duration && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{duration}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-slate-400 font-medium">Group Total</p>
          <p className={`text-sm font-bold ${recommended ? 'text-teal-600 dark:text-teal-400' : 'text-slate-800 dark:text-slate-200'}`}>₹{fmt(totalReturn)}</p>
          <p className="text-[9px] text-slate-400">return</p>
        </div>
      </div>
      {note && <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-1 pt-0.5"><Info className="w-3 h-3 flex-shrink-0 mt-0.5" />{note}</p>}
      {extra}
    </div>
  );
}

// ─── TollPanel ────────────────────────────────────────────────────────────────
function TollPanel({ tollData }) {
  if (!tollData || typeof tollData === 'number') return null;
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2.5">
      <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />Toll Estimate (NHAI Avg Rates)
      </h5>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: 'One-way Toll',  value: `₹${fmt(tollData.oneWayToll)}` },
          { label: 'Return Toll',   value: `₹${fmt(tollData.returnToll)}` },
          { label: 'FASTag Saving', value: `-₹${fmt(tollData.fastTagDiscount)}`, green: true },
          { label: 'Net Toll Cost', value: `₹${fmt(tollData.netToll)}`, bold: true },
          { label: 'Tolled KMs',   value: `${tollData.tollableKm} km` },
        ].map((item, i) => (
          <div key={i} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-[9px] text-slate-400 uppercase font-semibold">{item.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${item.green ? 'text-emerald-500' : item.bold ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" />{tollData.note}</p>
    </div>
  );
}

// ─── HotelCategoryCard ────────────────────────────────────────────────────────
function HotelCategoryCard({ category, nights, travelers, recommended }) {
  const isNoStay = category.id === 'nostay';
  const qty      = category.id === 'hostel' ? travelers : Math.max(1, Math.ceil(travelers / 2));

  return (
    <div className={`rounded-2xl border p-3.5 space-y-2.5 relative
      ${recommended ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
      {recommended && <span className="absolute -top-2.5 right-3 text-[9px] font-bold bg-teal-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">Recommended</span>}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.emoji}</span>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{category.label}</p>
            {isNoStay
              ? <p className="text-[10px] text-emerald-500 font-semibold">₹0 — No accommodation cost</p>
              : <p className="text-[10px] text-slate-400">₹{fmt(category.minPrice)}–₹{fmt(category.maxPrice)} / night</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400">{isNoStay ? 'Day trip' : `${nights} nights`}</p>
          <p className={`text-sm font-bold ${recommended ? 'text-teal-600 dark:text-teal-400' : isNoStay ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
            {isNoStay ? '₹0' : `₹${fmt(category.minPrice * nights * qty)}–₹${fmt(category.maxPrice * nights * qty)}`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {category.highlights.map((h, i) => (
          <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">✓ {h}</span>
        ))}
      </div>
      {category.platforms?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {category.platforms.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              <ExternalLink className="w-3 h-3" />{p.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GemCard — real Google Places photo + static fallback ────────────────────
function GemCard({ gem, isLive = false }) {
  const [imgErr, setImgErr] = useState(false);

  if (isLive) {
    const name    = gem.displayName?.text || gem.name || 'Place';
    const address = gem.formattedAddress  || gem.distance || '';
    const rating  = gem.rating;
    const reviews = gem.userRatingCount;
    const summary = gem.editorialSummary?.text || gem.desc || '';
    const lat     = gem.location?.latitude;
    const lng     = gem.location?.longitude;
    const mapsUrl = gem.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    const dirUrl  = lat && lng ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : mapsUrl;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group">
        <div className="relative h-44 overflow-hidden">
          {/* PlaceImage resolves actual Google Places photo via skipHttpRedirect */}
          <PlaceImage photos={gem.photos} alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            fallbackSrc="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop"
            w={800} h={500} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-500/80 text-white">📍 Google Places</span>
          </div>
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-xs font-bold text-white leading-snug">{name}</p>
            {rating && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">{rating.toFixed(1)}</span>
                {reviews && <span className="text-[10px] text-slate-300">({Number(reviews).toLocaleString()})</span>}
              </div>
            )}
          </div>
        </div>
        <div className="p-3 space-y-1.5">
          {address && <p className="text-[10px] text-slate-400 truncate">{address}</p>}
          {summary && <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{summary}</p>}
          <div className="flex gap-3 pt-0.5">
            <a href={dirUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              <Navigation className="w-3 h-3" />Directions
            </a>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              <Map className="w-3 h-3" />Maps
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  // Static gem — curated images from cityDatabase
  const nameHash = (gem.name || '').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  const fallback = `https://picsum.photos/seed/${200 + (nameHash % 700)}/800/600`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group">
      <div className="relative h-44 overflow-hidden">
        <img src={imgErr ? fallback : gem.image} alt={gem.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
          onError={() => setImgErr(true)} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {(gem.tags || [gem.type]).slice(0, 2).map((tag, i) => (
            <span key={i} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/20">{tag}</span>
          ))}
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-xs font-bold text-white">{gem.name}</p>
          <p className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-teal-400" />{gem.distance}
          </p>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">{gem.type}</span>
          {gem.difficulty && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">{gem.difficulty}</span>}
          {gem.bestTime   && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{gem.bestTime}</span>}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{gem.desc}</p>
        <div className="flex gap-3">
          <a href={gem.directions} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            <Navigation className="w-3 h-3" />Directions
          </a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gem.name)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <Map className="w-3 h-3" />Maps
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── LivePlaceCard ────────────────────────────────────────────────────────────
function LivePlaceCard({ place }) {
  const name    = place.displayName?.text || 'Place';
  const address = place.formattedAddress || '';
  const rating  = place.rating;
  const reviews = place.userRatingCount;
  const summary = place.editorialSummary?.text || '';
  const mapsUrl = place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

  return (
    <div className="flex gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group">
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
        <PlaceImage photos={place.photos} alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          fallbackSrc="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=300&auto=format&fit=crop"
          w={300} h={300} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">{name}</p>
        {rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-500">{rating.toFixed(1)}</span>
            {reviews && <span className="text-[10px] text-slate-400">({Number(reviews).toLocaleString()})</span>}
          </div>
        )}
        {address && <p className="text-[10px] text-slate-400 truncate">{address}</p>}
        {summary && <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{summary}</p>}
        <div className="flex gap-2 pt-0.5">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            <Map className="w-3 h-3" />Maps
          </a>
          {place.websiteUri && (
            <a href={place.websiteUri} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              <ExternalLink className="w-3 h-3" />Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OptimizedBudgetPanel ─────────────────────────────────────────────────────
function OptimizedBudgetPanel({ distanceKm, travelers, days, travelStyle, currentMode, toCity, availableModes }) {
  const combo    = useMemo(() => findCheapestCombo({ distanceKm, travelers, days, travelStyle, currentMode }), [distanceKm, travelers, days, travelStyle, currentMode]);
  const filtered = combo.sorted.filter(({ mode }) => availableModes?.[mode] !== false);
  const modeEmoji = { train:'🚂', bus:'🚌', bike:'🏍️', selfdrive:'🚗', cab:'🚖', flight:'✈️', road:'🚕' };

  const tips = [
    { icon: '🎟️', tip: 'Book train tickets 60 days early on IRCTC for confirmed berths at base price.' },
    { icon: '📅', tip: 'Travel Tue–Thu — hotel rates drop 15–25% vs weekends.' },
    { icon: '🍛', tip: `Eat at local dhabas in ${toCity} — save 50–60% on food vs restaurants.` },
    { icon: '🏡', tip: 'Rent a shared villa for 4+ people — cheaper than individual hotel rooms.' },
    { icon: '🏍️', tip: 'Rent a two-wheeler (₹350–500/day) for sightseeing instead of cabs.' },
    { icon: '🛣️', tip: 'Use FASTag on tolls for ~15% effective discount and no cash queues.' },
    { icon: '🌙', tip: 'Overnight sleeper trains save travel time and hotel cost in one go.' },
    { icon: '🔑', tip: `Check Airbnb for private homes in ${toCity} — often 30% cheaper.` },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-500" />All Available Modes — Cheapest First
        </h4>
        <div className="space-y-1.5">
          {filtered.map(({ mode, cost }, i) => {
            const isCurrent  = mode === currentMode;
            const isCheapest = i === 0;
            return (
              <div key={mode} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs
                ${isCheapest ? 'bg-emerald-500/10 border border-emerald-500/30' : isCurrent ? 'bg-teal-500/5 border border-teal-500/20' : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{modeEmoji[mode] || '🚌'}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{ALL_MODES.find((m) => m.id === mode)?.label || mode}</span>
                  {isCheapest && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/20 px-1.5 py-0.5 rounded-full">CHEAPEST</span>}
                  {isCurrent  && <span className="text-[9px] font-bold text-teal-600 bg-teal-500/20 px-1.5 py-0.5 rounded-full">YOUR PICK</span>}
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${isCheapest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>₹{fmt(cost)}</span>
                  {i > 0 && <span className="text-[10px] text-slate-400 block">+₹{fmt(cost - filtered[0].cost)}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {combo.savings > 0 && filtered[0] && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Switch to {ALL_MODES.find((m) => m.id === filtered[0].mode)?.label} → Save ₹{fmt(combo.savings)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">on transport for this trip</p>
            </div>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 space-y-2.5 shadow-sm">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />Smart Money-Saving Tips
        </h4>
        <div className="space-y-2">
          {tips.map((t, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-slate-700 dark:text-slate-300">
              <span className="text-sm flex-shrink-0">{t.icon}</span><span>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main BudgetEstimator ─────────────────────────────────────────────────────
export default function BudgetEstimator({ onStartTripWithBudget }) {
  // Form state
  const [fromCity,    setFromCity]    = useState('Mumbai');
  const [toCity,      setToCity]      = useState('Lonavala');
  const [startDate,   setStartDate]   = useState(today());
  const [endDate,     setEndDate]     = useState(addDays(today(), 2));
  const [travelers,   setTravelers]   = useState(4);
  const [travelMode,  setTravelMode]  = useState('road');
  const [stayType,    setStayType]    = useState('homestay');
  const [travelStyle, setTravelStyle] = useState('balanced');
  const [activeTab,   setActiveTab]   = useState('overview');

  // Days derived from date range
  const days = useMemo(() => diffDays(startDate, endDate), [startDate, endDate]);

  // Resolved geo data
  const [fromGeo, setFromGeo] = useState(null);
  const [toGeo,   setToGeo]   = useState(null);

  // Route data
  const [routeData,    setRouteData]    = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Computed
  const [distKm,     setDistKm]     = useState(83);
  const [availModes, setAvailModes] = useState(null);
  const [tollData,   setTollData]   = useState(null);
  const [fareData,   setFareData]   = useState(null);
  const [hotelData,  setHotelData]  = useState(null);

  // Live Places data
  const [liveGems,      setLiveGems]      = useState([]);
  const [liveHotels,    setLiveHotels]    = useState([]);
  const [liveAttr,      setLiveAttr]      = useState([]);
  const [coverUrl,      setCoverUrl]      = useState(null);
  const [placesLoading, setPlacesLoading] = useState(false);

  // Offline fallback gems
  const [offlineGems, setOfflineGems] = useState(null);

  // Budget result
  const [result,  setResult]  = useState(null);
  const [isCalc,  setIsCalc]  = useState(false);

  const totalRef     = useRef(null);
  const perPersonRef = useRef(null);

  const dbFrom = useDebounce(fromCity, 600);
  const dbTo   = useDebounce(toCity,   600);

  // ── Step 1: Geocode both places + resolve real cover photo ────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [fGeo, tGeo] = await Promise.all([
        geocodePlace(dbFrom).catch(() => null),
        geocodePlace(dbTo).catch(() => null),
      ]);
      if (cancelled) return;

      const fromDb = getCityByName(dbFrom);
      const toDb   = getCityByName(dbTo);
      const fFinal = fGeo || (fromDb ? { lat: fromDb.lat, lng: fromDb.lng, name: fromDb.name, photos: [] } : null);
      const tFinal = tGeo || (toDb   ? { lat: toDb.lat,  lng: toDb.lng,  name: toDb.name,  photos: [] } : null);

      setFromGeo(fFinal);
      setToGeo(tFinal);

      // Cover image: real Google Places photo → city DB fallback
      if (tGeo?.photos?.length) {
        resolvePhotoUrl(tGeo.photos[0].name, 800, 1400).then((url) => {
          if (!cancelled) setCoverUrl(url || getCoverImage(dbTo));
        });
      } else {
        setCoverUrl(getCoverImage(dbTo));
      }

      const offlineDist = getDistanceKm(dbFrom, dbTo, fromDb, toDb);
      setDistKm(offlineDist);
      setAvailModes(getAvailableModes(fromDb, toDb, offlineDist));

      const cityGems = getGems(dbTo);
      setOfflineGems(cityGems || getHiddenGemsWithImages(dbTo));
      setHotelData(getHotelPriceRanges(dbTo, travelStyle));
    })();
    return () => { cancelled = true; };
  }, [dbFrom, dbTo]);

  // ── Step 2: Routes API for exact distance + duration ──────────────────────
  useEffect(() => {
    if (!fromGeo?.lat || !toGeo?.lat) return;
    let cancelled = false;
    setRouteLoading(true);
    (async () => {
      const route = await computeRoute({
        originLat: fromGeo.lat, originLng: fromGeo.lng,
        destLat: toGeo.lat,     destLng: toGeo.lng,
        travelMode,
      });
      if (cancelled) return;
      if (route) {
        setRouteData(route);
        setDistKm(route.distanceKm);
        const fromDb = getCityByName(dbFrom);
        const toDb   = getCityByName(dbTo);
        setAvailModes(getAvailableModes(fromDb, toDb, route.distanceKm));
      }
      setRouteLoading(false);
    })();
    return () => { cancelled = true; setRouteLoading(false); };
  }, [fromGeo, toGeo, travelMode]);

  // ── Step 3: Live Places — hidden gems, hotels, nearby ────────────────────
  useEffect(() => {
    if (!toGeo?.lat) return;
    let cancelled = false;
    setPlacesLoading(true);
    (async () => {
      const [gems, hotels, nearby] = await Promise.all([
        fetchHiddenGems(dbTo, toGeo.lat, toGeo.lng).catch(() => []),
        fetchHotelsNearDestination(dbTo, toGeo.lat, toGeo.lng).catch(() => []),
        fetchNearbyPlaces(toGeo.lat, toGeo.lng, 12000).catch(() => []),
      ]);
      if (cancelled) return;
      setLiveGems(gems);
      setLiveHotels(hotels);
      setLiveAttr(nearby);
      setPlacesLoading(false);
    })();
    return () => { cancelled = true; setPlacesLoading(false); };
  }, [toGeo, dbTo]);

  // ── Fares + tolls ─────────────────────────────────────────────────────────
  useEffect(() => {
    const km   = distKm;
    const numT = Math.max(1, Number(travelers));
    setTollData(TOLL_MODES.includes(travelMode) ? estimateTolls(km, travelMode) : null);

    let fares = null;
    switch (travelMode) {
      case 'train':     fares = getTrainFares(km, numT);                   break;
      case 'flight':    fares = getFlightFares(km, numT);                  break;
      case 'bus':       fares = getBusFares(km, numT);                     break;
      case 'cab':
      case 'road':      fares = getCabFares(km, numT);                     break;
      case 'bike':      fares = getBikeFares(km, numT);                    break;
      case 'selfdrive': fares = getSelfDriveFares(km, numT, travelStyle);  break;
    }
    setFareData(fares);
    setHotelData(getHotelPriceRanges(dbTo, travelStyle));
  }, [travelMode, travelers, days, travelStyle, distKm, dbTo]);

  // Auto-switch mode if current becomes unavailable
  useEffect(() => {
    if (!availModes) return;
    setTravelMode((prev) => {
      if (availModes[prev] !== false) return prev;
      for (const m of ['train', 'bus', 'road', 'cab', 'selfdrive', 'flight', 'bike']) {
        if (availModes[m] !== false) return m;
      }
      return prev;
    });
  }, [availModes]);

  // When No Stay is selected, lock days to 1 (day trip)
  useEffect(() => {
    if (stayType === 'nostay') {
      setEndDate(startDate); // same day return
    }
  }, [stayType, startDate]);

  // ── Budget calculation ────────────────────────────────────────────────────
  const handleCalculate = useCallback(() => {
    setIsCalc(true);
    setTimeout(() => {
      const res = calculateEstimatedBudget({
        fromCity: dbFrom, toCity: dbTo,
        days, travelers: Number(travelers),
        travelMode, stayType, travelStyle,
      });
      // Inject real fare
      const numT = Number(travelers);
      if (fareData) {
        let t = 0;
        if (travelMode === 'train' && Array.isArray(fareData)) {
          t = (fareData.find((f) => f.recommended) || fareData[1])?.totalReturn || 0;
        } else if (travelMode === 'flight' && Array.isArray(fareData)) {
          t = fareData[0]?.totalReturn || 0;
        } else if (travelMode === 'bus' && Array.isArray(fareData)) {
          t = (fareData.find((f) => f.recommended) || fareData[4])?.totalReturn || 0;
        } else if ((travelMode === 'cab' || travelMode === 'road') && Array.isArray(fareData)) {
          t = (fareData.find((f) => f.seats >= numT) || fareData[1])?.returnTotal || 0;
        } else if (travelMode === 'bike' && !Array.isArray(fareData)) {
          t = fareData.totalReturn || 0;
        } else if (travelMode === 'selfdrive' && !Array.isArray(fareData)) {
          const car = fareData.carTypes[travelStyle === 'luxury' ? 2 : 0];
          t = fareData.totalFixed + car.rentalPerDay * days;
        }
        if (t > 0) {
          res.breakdown.transport = Math.round(t);
          res.totalBudget    = Object.values(res.breakdown).reduce((a, b) => a + b, 0);
          res.perPersonCost  = Math.round(res.totalBudget / Math.max(1, numT));
        }
      }
      setResult(res);
      setIsCalc(false);
    }, 280);
  }, [dbFrom, dbTo, days, travelers, travelMode, stayType, travelStyle, fareData]);

  useEffect(() => { handleCalculate(); }, [dbFrom, dbTo, days, travelers, travelMode, stayType, travelStyle, fareData]);

  useEffect(() => {
    if (!result) return;
    if (totalRef.current)     animateCounter(totalRef.current,    0, result.totalBudget,   '₹', 750);
    if (perPersonRef.current) animateCounter(perPersonRef.current, 0, result.perPersonCost, '₹', 750);
  }, [result]);

  const destData      = result?.destinationData;
  const numT          = Math.max(1, Number(travelers));
  const nights        = Math.max(0, days - 1);
  const isDayTrip     = stayType === 'nostay';
  const gemsToShow    = liveGems.length   ? liveGems   : null;
  const hotelsToShow  = liveHotels.length ? liveHotels : null;

  const tabs = [
    { id: 'overview',    label: '📊 Budget'      },
    { id: 'fares',       label: '🎟️ Fares'        },
    { id: 'tolls',       label: '🛣️ Tolls'         },
    { id: 'hotels',      label: `🏨 Hotels${hotelsToShow ? ` (${hotelsToShow.length})` : ''}` },
    { id: 'gems',        label: `✨ Gems${gemsToShow ? ` (${gemsToShow.length})` : ''}` },
    { id: 'attractions', label: `🎯 Spots${liveAttr.length ? ` (${liveAttr.length})` : ''}` },
    { id: 'optimize',    label: '💡 Optimize'     },
    { id: 'itinerary',   label: '📅 Itinerary'    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-16 sm:pb-8">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-slate-200/60 dark:border-slate-800/80 shadow-xl group">
        <AnimatePresence mode="wait">
          <motion.img key={coverUrl || 'default'}
            src={coverUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=85&w=1400&auto=format&fit=crop'}
            alt={toCity}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="w-full h-52 sm:h-72 object-cover object-center group-hover:scale-105 transition duration-700"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=85&w=1400&auto=format&fit=crop'; }} />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent flex flex-col justify-end p-5 sm:p-8 text-white space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-teal-500/30 backdrop-blur-md text-teal-300 border border-teal-500/40 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />AI Budget Estimator
            </span>
            {destData?.weather && (
              <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
                <CloudSun className="w-3 h-3 text-amber-300" />{destData.weather}
              </span>
            )}
            <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
              <Route className="w-3 h-3 text-teal-300" />
              {routeData ? `${routeData.distanceText} · ${routeData.durationText}` : `~${distKm} km`}
              {routeLoading && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </span>
            {isDayTrip && (
              <span className="bg-amber-500/30 backdrop-blur-md text-amber-300 border border-amber-500/40 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1">
                <Sunrise className="w-3 h-3" />Day Trip
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight drop-shadow">{fromCity} → {toCity}</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {toGeo?.summary || destData?.tagline || ''}
          </p>
          {/* Date range in hero */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CalendarDays className="w-3.5 h-3.5 text-teal-300" />
            <span>{fmtDate(startDate)}</span>
            {!isDayTrip && <><ArrowRight className="w-3 h-3" /><span>{fmtDate(endDate)}</span></>}
            <span className="text-slate-400">·</span>
            <span>{isDayTrip ? 'Same-day return' : `${days} day${days > 1 ? 's' : ''}, ${nights} night${nights !== 1 ? 's' : ''}`}</span>
          </div>
        </div>
      </div>

      {/* ── Calculator grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7">

        {/* Left: Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-500" />Customize Trip
          </h3>
          <div className="space-y-3.5">

            {/* Cities */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">From</label>
                <CityAutocompleteInput value={fromCity} onChange={setFromCity}
                  placeholder="e.g. Mumbai" icon={Navigation}
                  onResolved={(name, _id, cityData) => {
                    setFromCity(name);
                    if (cityData) setFromGeo({ lat: cityData.lat, lng: cityData.lng, name: cityData.name, photos: [] });
                  }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">To</label>
                <CityAutocompleteInput value={toCity} onChange={setToCity}
                  placeholder="e.g. Nagpur" icon={MapPin} iconColor="text-teal-500"
                  onResolved={(name, _id, cityData) => {
                    setToCity(name);
                    if (cityData) setToGeo({ lat: cityData.lat, lng: cityData.lng, name: cityData.name, photos: [] });
                  }} />
              </div>
            </div>

            {/* Route badge */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
                <Route className="w-3 h-3" />
                {routeData ? `${routeData.distanceText} · ${routeData.durationText}` : `~${distKm} km`}
                {routeLoading && <Loader2 className="w-3 h-3 animate-spin ml-0.5" />}
              </span>
              {TOLL_MODES.includes(travelMode) && tollData && typeof tollData !== 'number' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" />Toll ₹{fmt(tollData.netToll)}
                </span>
              )}
            </div>

            {/* ── Date range picker ── */}
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-400 flex items-center gap-1 mb-1.5">
                <CalendarDays className="w-3 h-3" />Trip Dates
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-400 block mb-1">Departure</label>
                  <div className="relative">
                    <Sunrise className="w-3.5 h-3.5 text-teal-500 absolute left-3 top-2.5 pointer-events-none" />
                    <input type="date" value={startDate} min={today()}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value > endDate) setEndDate(e.target.value);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-2 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase text-slate-400 block mb-1">
                    {isDayTrip ? 'Return (same day)' : 'Return'}
                  </label>
                  <div className="relative">
                    <MoonStar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input type="date" value={endDate} min={startDate} disabled={isDayTrip}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-2 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 transition ${isDayTrip ? 'opacity-40 cursor-not-allowed' : ''}`} />
                  </div>
                </div>
              </div>
              {/* Duration chip */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1
                  ${isDayTrip ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'}`}>
                  <Clock className="w-3 h-3" />
                  {isDayTrip ? '1 day · same-day return' : `${days} day${days > 1 ? 's' : ''} · ${nights} night${nights !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Travelers */}
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Travelers</label>
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input type="number" min="1" max="50" value={travelers} onChange={(e) => setTravelers(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500" />
              </div>
            </div>

            {/* Travel Mode */}
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1.5">Travel Mode</label>
              <div className="grid grid-cols-4 gap-1.5">
                {ALL_MODES.map((m) => {
                  const available = !availModes || availModes[m.id] !== false;
                  const reason    = availModes?.disabledReasons?.[m.id];
                  const isActive  = travelMode === m.id;
                  return (
                    <div key={m.id} className="relative group/mode">
                      <button type="button" disabled={!available}
                        onClick={() => available && setTravelMode(m.id)}
                        className={`w-full py-2 px-1 rounded-xl text-[10px] font-semibold transition text-center leading-tight
                          ${isActive && available ? 'bg-teal-500 text-slate-950 shadow-sm'
                            : available ? 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-teal-400'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'}`}>
                        <div>{m.emoji}</div><div>{m.label.split(' ')[0]}</div>
                      </button>
                      {!available && reason && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 hidden group-hover/mode:block w-44 text-[9px] text-white bg-slate-800 rounded-lg px-2 py-1.5 text-center shadow-lg pointer-events-none">
                          {reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stay Style — includes No Stay */}
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1.5">Stay Style</label>
              <div className="grid grid-cols-4 gap-1.5">
                {STAY_OPTIONS.map((s) => (
                  <div key={s.id} className="relative group/stay">
                    <button type="button" onClick={() => setStayType(s.id)}
                      className={`w-full py-2 px-1 rounded-xl text-[10px] font-semibold transition text-center leading-tight
                        ${stayType === s.id
                          ? s.id === 'nostay'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-teal-400'}`}>
                      <div>{s.emoji}</div>
                      <div>{s.label}</div>
                    </button>
                    {s.desc && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 hidden group-hover/stay:block w-28 text-[9px] text-white bg-slate-800 rounded-lg px-2 py-1 text-center shadow-lg pointer-events-none">
                        {s.desc}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isDayTrip && (
                <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 px-0.5">
                  <Info className="w-3 h-3" />Day trip — accommodation cost set to ₹0
                </p>
              )}
            </div>

            {/* Budget Tier */}
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Budget Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: 'budget', label: '💸 Budget' }, { id: 'balanced', label: '⚖️ Balanced' }, { id: 'luxury', label: '✨ Luxury' }].map((s) => (
                  <button key={s.id} type="button" onClick={() => setTravelStyle(s.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold transition text-center
                      ${travelStyle === s.id ? 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-400 border font-bold' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-teal-400'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCalculate} disabled={isCalc}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 mt-2">
              <Zap className="w-4 h-4 stroke-[2]" />{isCalc ? 'Calculating…' : 'Recalculate Budget'}
            </button>
          </div>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-7 space-y-4">
          {result && (
            <>
              {/* Totals */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 rounded-3xl shadow-sm">
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400">Group Total</p>
                  <h3 ref={totalRef} className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">₹{fmt(result.totalBudget)}</h3>
                  <span className="text-[10px] text-slate-400">{numT} travelers · {isDayTrip ? '1 day' : `${days} days`}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 rounded-3xl shadow-sm">
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400">Per Person</p>
                  <h3 ref={perPersonRef} className="text-xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1 truncate">₹{fmt(result.perPersonCost)}</h3>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {isDayTrip ? '🏃 No stay — day trip' : routeData ? `✓ ${routeData.distanceText} real route` : '✓ Fare-engine applied'}
                  </span>
                </div>
              </div>

              {/* Day Trip savings highlight */}
              {isDayTrip && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <span className="text-2xl">🏃</span>
                  <div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Day Trip Mode — ₹0 Accommodation</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Saved ₹{fmt(Math.round(
                        Math.ceil(numT / 2) * 2200 * 1 // vs 1 night homestay
                      ))} vs staying one night
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-800/80 pb-2 overflow-x-auto no-scrollbar">
                {tabs.map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap
                      ${activeTab === t.id ? 'bg-teal-500 text-slate-950 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-teal-400'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── Tab: Budget ── */}
              {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-teal-500" />Cost Breakdown
                    {routeData && <span className="ml-auto text-[10px] text-teal-500 font-normal">🗺️ {routeData.distanceText} · {routeData.durationText}</span>}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { emoji: '🏨', label: isDayTrip ? 'Accommodation (None)' : 'Accommodation', val: result.breakdown.stay, zero: isDayTrip },
                      { emoji: '🚗', label: `Transport${routeData ? ` · ${routeData.distanceText}` : ''}`, val: result.breakdown.transport },
                      { emoji: '🍔', label: 'Food & Dining', val: result.breakdown.food },
                      { emoji: '🎯', label: 'Activities', val: result.breakdown.activities },
                      { emoji: '🛡️', label: 'Buffer (10%)', val: result.breakdown.buffer, accent: true, span: true },
                    ].map((item, i) => (
                      <div key={i} className={`p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 ${item.span ? 'col-span-2' : ''}`}>
                        <span className="text-[10px] text-slate-400 font-medium block">{item.emoji} {item.label}</span>
                        <strong className={`text-sm ${item.zero ? 'text-emerald-500' : item.accent ? 'text-teal-600 dark:text-teal-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.zero ? '₹0 saved' : `₹${fmt(item.val)}`}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {[
                      { label: 'Stay',       val: result.breakdown.stay,       color: 'bg-teal-500' },
                      { label: 'Transport',  val: result.breakdown.transport,  color: 'bg-blue-500' },
                      { label: 'Food',       val: result.breakdown.food,       color: 'bg-orange-400' },
                      { label: 'Activities', val: result.breakdown.activities, color: 'bg-violet-500' },
                    ].map((item) => {
                      const pct = result.totalBudget > 0 ? Math.round((item.val / result.totalBudget) * 100) : 0;
                      return (
                        <div key={item.label} className="flex items-center gap-2 text-[10px]">
                          <span className="w-16 text-slate-400 text-right shrink-0">{item.label}</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                              className={`h-full rounded-full ${item.color}`} />
                          </div>
                          <span className="w-8 text-slate-500 font-semibold">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Tab: Fares ── */}
              {activeTab === 'fares' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-teal-500" />
                      {ALL_MODES.find((m) => m.id === travelMode)?.emoji} {ALL_MODES.find((m) => m.id === travelMode)?.label} Fares
                      <span className="ml-auto text-[10px] text-slate-400">{fromCity} → {toCity} · {routeData?.distanceText || `${distKm} km`}</span>
                    </h4>
                    {/* Fare note */}
                    <p className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 flex items-start gap-1.5">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      Fares are distance-based estimates using Indian market rates. RedBus, IRCTC & Ixigo don't provide free public APIs — use the booking links below for live prices.
                    </p>

                    {travelMode === 'train' && Array.isArray(fareData) && fareData.map((c) => (
                      <FareCard key={c.id} emoji={c.emoji} label={c.label}
                        oneWayPer={c.oneWayPerPerson} returnPer={c.returnPerPerson}
                        totalReturn={c.totalReturn} duration={c.durationStr} recommended={c.recommended}
                        extra={<div className="flex gap-3 mt-1.5">
                          <a href={`https://www.irctc.co.in/nget/train-search`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"><ExternalLink className="w-3 h-3" />IRCTC</a>
                          <a href={`https://www.confirmtkt.com/train-search?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"><ExternalLink className="w-3 h-3" />ConfirmTkt</a>
                          <a href={`https://www.ixigo.com/trains`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 hover:underline"><ExternalLink className="w-3 h-3" />Ixigo</a>
                        </div>} />
                    ))}

                    {travelMode === 'flight' && Array.isArray(fareData) && fareData.map((c) => (
                      <FareCard key={c.id} emoji={c.emoji} label={c.label}
                        description={`${c.airline} · ${c.description}`}
                        oneWayPer={c.oneWayPerPerson} returnPer={c.returnPerPerson}
                        totalReturn={c.totalReturn} duration={c.durationStr} recommended={c.recommended} note={c.note}
                        extra={<div className="flex gap-3 mt-1.5">
                          <a href="https://www.makemytrip.com/flights/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"><ExternalLink className="w-3 h-3" />MakeMyTrip</a>
                          <a href="https://www.skyscanner.co.in/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"><ExternalLink className="w-3 h-3" />Skyscanner</a>
                          <a href="https://www.goibibo.com/flights/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"><ExternalLink className="w-3 h-3" />Goibibo</a>
                        </div>} />
                    ))}

                    {travelMode === 'bus' && Array.isArray(fareData) && fareData.map((c) => (
                      <FareCard key={c.id} emoji={c.emoji} label={c.label} description={c.operator}
                        oneWayPer={c.oneWayPerPerson} returnPer={c.returnPerPerson}
                        totalReturn={c.totalReturn} duration={c.durationStr} recommended={c.recommended}
                        extra={<div className="flex gap-3 mt-1.5">
                          <a href={`https://www.redbus.in/bus-tickets/${encodeURIComponent(fromCity.toLowerCase())}-to-${encodeURIComponent(toCity.toLowerCase())}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-red-500 hover:underline"><ExternalLink className="w-3 h-3" />RedBus</a>
                          <a href={`https://www.abhibus.com/`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 hover:underline"><ExternalLink className="w-3 h-3" />AbhiBus</a>
                        </div>} />
                    ))}

                    {(travelMode === 'cab' || travelMode === 'road') && Array.isArray(fareData) && fareData.map((v) => (
                      <FareCard key={v.id} emoji={v.emoji} label={v.label} description={`${v.seats} seats`}
                        oneWayPer={v.perPersonOneWay} returnPer={v.perPersonReturn}
                        totalReturn={v.returnTotal} duration={v.durationStr} recommended={v.recommended} note={v.note}
                        extra={<div className="flex gap-3 mt-1.5">
                          <a href="https://www.olacabs.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 hover:underline"><ExternalLink className="w-3 h-3" />Ola</a>
                          <a href="https://www.uber.com/in/en/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:underline"><ExternalLink className="w-3 h-3" />Uber</a>
                        </div>} />
                    ))}

                    {travelMode === 'bike' && fareData && !Array.isArray(fareData) && (
                      <FareCard emoji="🏍️" label="Bike Ride" description={fareData.note}
                        totalReturn={fareData.totalReturn} duration={fareData.durationStr} recommended
                        extra={<div className="grid grid-cols-3 gap-2 mt-2">
                          {[{ l: 'Fuel/bike 1-way', v: `₹${fmt(fareData.fuelOneWayPerBike)}` }, { l: 'Bikes needed', v: fareData.bikesNeeded }, { l: 'Rental/day', v: `₹${fmt(fareData.rentalPerDay)}` }].map((item, i) => (
                            <div key={i} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <p className="text-[9px] text-slate-400">{item.l}</p>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.v}</p>
                            </div>
                          ))}
                        </div>} />
                    )}

                    {travelMode === 'selfdrive' && fareData && !Array.isArray(fareData) && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[{ l: 'Round-trip Fuel', v: `₹${fmt(fareData.fuelCost)}` }, { l: 'Toll (net)', v: `₹${fmt(typeof fareData.tollCost === 'object' ? fareData.tollCost.netToll : fareData.tollCost)}` }, { l: 'Parking', v: `₹${fmt(fareData.parkingCost)}` }].map((item, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                              <p className="text-[9px] text-slate-400">{item.l}</p>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.v}</p>
                            </div>
                          ))}
                        </div>
                        {fareData.carTypes.map((car) => (
                          <FareCard key={car.id} emoji={car.emoji} label={car.label} description={`${car.seats} seats · ${car.mileage} km/l`}
                            totalReturn={fareData.totalFixed + car.rentalPerDay * days}
                            recommended={car.id === (numT > 4 ? 'suv' : 'hatchback')} badge={`₹${fmt(car.rentalPerDay)}/day`}
                            extra={<a href="https://www.zoomcar.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1"><ExternalLink className="w-3 h-3" />Zoomcar</a>} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Tab: Tolls ── */}
              {activeTab === 'tolls' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />Toll Calculator
                    </h4>
                    {TOLL_MODES.includes(travelMode) && tollData
                      ? <TollPanel tollData={tollData} />
                      : <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">No tolls for {ALL_MODES.find((m) => m.id === travelMode)?.label}</div>}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">All Modes Comparison</p>
                      {['selfdrive', 'cab', 'bike'].map((m) => {
                        const t = estimateTolls(distKm, m);
                        return (
                          <div key={m} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                            <span className="text-slate-600 dark:text-slate-400">{ALL_MODES.find((mo) => mo.id === m)?.emoji} {ALL_MODES.find((mo) => mo.id === m)?.label}</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">₹{fmt(typeof t === 'object' ? t.netToll : t)} <span className="text-[9px] text-slate-400">(after FASTag)</span></span>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">🚂 Train / ✈️ Flight / 🚌 Bus</span>
                        <span className="font-semibold text-emerald-500">₹0 — No Tolls</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Tab: Hotels ── */}
              {activeTab === 'hotels' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {isDayTrip && (
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                      <span className="text-xl">🏃</span>
                      <div>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Day Trip — No Accommodation Needed</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">You selected "No Stay". Returning same day.</p>
                      </div>
                    </div>
                  )}
                  {hotelsToShow?.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-bold uppercase text-teal-600 dark:text-teal-400 px-0.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3" />Live from Google Places</p>
                      {hotelsToShow.map((h, i) => <LivePlaceCard key={h.id || i} place={h} />)}
                    </div>
                  )}
                  {placesLoading && !hotelsToShow?.length && (
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />Fetching live hotels…</div>
                  )}
                  {hotelData && (
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-bold uppercase text-slate-400 px-0.5">Price Ranges for {toCity}</p>
                      <p className="text-[10px] text-slate-400 px-0.5">{isDayTrip ? 'Day trip — no nights needed' : `${nights} nights · ${Math.ceil(numT / 2)} rooms`}</p>
                      {hotelData.categories.map((cat) => (
                        <HotelCategoryCard key={cat.id} category={cat} nights={nights}
                          travelers={numT} recommended={isDayTrip ? cat.id === 'nostay' : cat.id === hotelData.recommended} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Tab: Hidden Gems ── */}
              {activeTab === 'gems' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="flex items-center justify-between px-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-500" />Hidden Gems in {toCity}
                    </p>
                    <div className="flex items-center gap-2">
                      {placesLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />}
                      {gemsToShow && <span className="text-[10px] text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full font-semibold">{gemsToShow.length} live · Google</span>}
                    </div>
                  </div>
                  {gemsToShow?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {gemsToShow.map((gem, i) => <GemCard key={gem.id || i} gem={gem} isLive={true} />)}
                    </div>
                  ) : !placesLoading && offlineGems ? (
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 px-0.5 flex items-center gap-1"><Info className="w-3 h-3" />Curated gems — live data loads as Places API resolves destination</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {offlineGems.map((gem, i) => <GemCard key={i} gem={gem} isLive={false} />)}
                      </div>
                    </div>
                  ) : placesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">Enter a destination to discover hidden gems</div>
                  )}
                </motion.div>
              )}

              {/* ── Tab: Nearby Attractions ── */}
              {activeTab === 'attractions' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-teal-500" />Top Attractions near {toCity}
                      {placesLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500 ml-auto" />}
                    </h4>
                    {liveAttr.length > 0 ? (
                      <div className="space-y-2.5">{liveAttr.map((a, i) => <LivePlaceCard key={a.id || i} place={a} />)}</div>
                    ) : !placesLoading ? (
                      <p className="text-xs text-slate-400 text-center py-4">No attractions found yet.</p>
                    ) : (
                      <div className="space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Tab: Optimize ── */}
              {activeTab === 'optimize' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <OptimizedBudgetPanel distanceKm={distKm} travelers={numT} days={days}
                    travelStyle={travelStyle} currentMode={travelMode} toCity={toCity} availableModes={availModes} />
                </motion.div>
              )}

              {/* ── Tab: Itinerary ── */}
              {activeTab === 'itinerary' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {destData?.itinerary?.length > 0 ? destData.itinerary.map((day) => (
                    <div key={day.day} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center">{day.day}</span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{day.title}</h4>
                      </div>
                      <ul className="space-y-1.5 pl-2">
                        {day.activities.map((act, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-teal-500 font-medium mt-0.5">•</span><span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm text-center space-y-2">
                      <p className="text-xs text-slate-400">No itinerary in database for <strong>{toCity}</strong>.</p>
                      <a href={`https://www.google.com/travel/trips?destination=${encodeURIComponent(toCity)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />Plan on Google Travel
                      </a>
                    </div>
                  )}
                  {destData?.tips && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm space-y-2">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />Local Tips
                      </h4>
                      {destData.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-slate-600 dark:text-slate-300">
                          <span className="text-amber-400 mt-0.5">•</span><span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* CTA */}
              {onStartTripWithBudget && (
                <button onClick={() => onStartTripWithBudget(result)}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2">
                  <PlusCircle className="w-4 h-4" />Start Trip with this Budget<ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
