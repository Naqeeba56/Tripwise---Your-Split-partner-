'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Send,
  Sparkles,
  Users,
  Tag,
  MessageCircle,
  X,
  Camera,
} from 'lucide-react';
import { fetchAnnouncementsFromDb, createAnnouncementInDb } from '@/lib/supabaseDb';
import { compressToWebP } from '@/lib/imageUtils';
import Spinner from './Spinner';

const INITIAL_ANNOUNCEMENTS = [
  {
    id: '1',
    creator_name: 'Naqeeb',
    creator_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    title: 'Monsoon Trek to Rajmachi Fort & Kataldhar',
    destination: 'Lonavala, Maharashtra',
    date_range: 'July 18 - July 19, 2026',
    budget_per_person: 2500,
    description: 'Looking for 3 fellow trekking enthusiasts to carpool from Mumbai to Rajmachi! Camping gear, bonfire, and waterfall exploration planned.',
    contact_info: 'naqeeb.trek@gmail.com / Telegram @naqeeb_travel',
    tags: ['Trekking', 'Monsoon', 'Camping', 'Carpool'],
    created_at: '2 hours ago',
  },
  {
    id: '2',
    creator_name: 'Aisha & Sarah',
    creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    title: 'North Goa Beach Villa & Sunset Cafe Hopping',
    destination: 'Anjuna & Morjim, Goa',
    date_range: 'August 12 - August 16, 2026',
    budget_per_person: 8500,
    description: 'Rented a 4-bedroom luxury private pool villa in Assagao. 2 rooms open for chill travel buddies interested in live music and food walks.',
    contact_info: 'WhatsApp +91 98200 12345',
    tags: ['Goa', 'VillaParty', 'Music', 'Foodie'],
    created_at: '1 day ago',
  },
  {
    id: '3',
    creator_name: 'Vikram Sethi',
    creator_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    title: 'Spiti Valley 4x4 Overland Roadtrip Expedition',
    destination: 'Spiti & Kaza, Himachal Pradesh',
    date_range: 'Sept 5 - Sept 14, 2026',
    budget_per_person: 18000,
    description: 'Driving in a Thar 4x4 from Chandigarh through Kinnaur, Nako, Tabo, Kaza and Chandratal Lake. Looking for co-driver / 2 travel buddies.',
    contact_info: 'Instagram @vikram_overlander',
    tags: ['Roadtrip', 'Spiti', 'Himalayas', '4x4'],
    created_at: '2 days ago',
  },
];

export default function CommunityAnnouncements({
  userProfile,
  onOpenAuthModal,
}) {
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // New announcement form state
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  // Field-level messages rendered directly under each input (never the browser's
  // native "Please fill out this field." bubble).
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState(null); // { type: 'success' | 'warning', text }

  React.useEffect(() => {
    const loadAnnouncements = async () => {
      const dbAnnouncements = await fetchAnnouncementsFromDb();
      if (dbAnnouncements && dbAnnouncements.length > 0) {
        setAnnouncements(dbAnnouncements);
      }
    };
    loadAnnouncements();
  }, []);

  const allTags = ['ALL', 'Trekking', 'Monsoon', 'Goa', 'Roadtrip', 'Camping', 'Himalayas', 'Foodie'];

  const filtered = announcements.filter((a) => {
    if (selectedTag === 'ALL') return true;
    return a.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const webpBase64 = await compressToWebP(file, 800, 0.85);
      setImage(webpBase64);
    } catch (err) {
      console.error('Image WebP compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Clears a single field error as soon as the traveller starts fixing it.
  const clearFieldError = (field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  // Human-readable validation. Returns { field: 'message' } — never throws and
  // never relies on the browser's native constraint validation.
  const validateAnnouncement = () => {
    const errors = {};
    const t = title.trim();
    const d = destination.trim();
    const c = contactInfo.trim();
    const desc = description.trim();
    const dates = dateRange.trim();

    if (!t) errors.title = 'Add a headline so travellers know what the trip is.';
    else if (t.length < 3) errors.title = 'The headline needs at least 3 characters.';
    else if (t.length > 120) errors.title = 'Keep the headline under 120 characters.';

    if (!d) errors.destination = 'Where is the trip going?';
    else if (d.length > 80) errors.destination = 'Keep the destination under 80 characters.';

    if (!c) errors.contactInfo = 'Add a WhatsApp number, Instagram handle or email so people can reach you.';
    else if (c.length > 120) errors.contactInfo = 'Keep the contact info under 120 characters.';

    if (budget !== '' && budget != null) {
      const n = Number(budget);
      if (!Number.isFinite(n) || n < 0) errors.budget = 'Budget must be a positive number.';
      else if (n > 1000000) errors.budget = 'That looks too high — please keep it under ₹10,00,000 per person.';
    }

    if (desc && desc.length < 10) {
      errors.description = 'Add a little more detail (at least 10 characters) or leave it empty.';
    }

    if (dates && dates.length < 3) {
      errors.dateRange = 'Dates look incomplete — try "Oct 2 - Oct 5".';
    }

    const tagList = tagInput.split(',').map((x) => x.trim()).filter(Boolean);
    if (tagList.length > 8) errors.tags = 'Please use at most 8 tags.';
    if (tagList.some((x) => x.length > 20)) errors.tags = 'Each tag must be under 20 characters.';

    return errors;
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setFormError(null);

    const errors = validateAnnouncement();
    setFieldErrors(errors);

    if (Object.keys(errors).length) {
      setFormError(Object.values(errors)[0]);
      const firstInvalid = ['title', 'destination', 'contactInfo', 'budget', 'description', 'dateRange', 'tags'].find(
        (key) => errors[key]
      );
      const el = typeof document !== 'undefined' && document.getElementById(`announcement-${firstInvalid}`);
      if (el && el.focus) el.focus();
      return;
    }

    setIsLoading(true);
    const tagsArray = tagInput
      ? tagInput.split(',').map((t) => t.trim()).filter(Boolean)
      : ['Travel', 'Trip'];

    const newPost = {
      id: String(Date.now()),
      creator_name: userProfile?.name || 'Traveler',
      creator_avatar: userProfile?.photoURL || null,
      title: title.trim(),
      destination: destination.trim(),
      date_range: dateRange.trim() || 'Flexible Dates',
      budget_per_person: Number(budget) || 3000,
      description: description.trim(),
      contact_info: contactInfo.trim(),
      tags: tagsArray,
      image_url: image,
      created_at: new Date().toISOString(),
    };

    const result = await createAnnouncementInDb(newPost, userProfile?.id);
    setIsLoading(false);

    // The insert failed → keep the modal open and the typed text intact so
    // nothing is lost, and explain what went wrong in plain language.
    if (!result || result.localOnly || result.error) {
      setFormError(
        result?.message
          ? `${result.message} Your text is still here — please try again.`
          : 'We could not save your announcement to the server. Please try again.'
      );
      setNotice({
        type: 'warning',
        text: 'Your last announcement could not be saved to the server. It is kept on this device until it saves.',
      });
      return;
    }

    setAnnouncements((prev) => [result.data, ...prev]);
    setNotice({ type: 'success', text: 'Announcement published 🎉' });
    setShowCreateModal(false);
    setFormError(null);
    setFieldErrors({});
    setTitle('');
    setDestination('');
    setDateRange('');
    setBudget('');
    setDescription('');
    setContactInfo('');
    setTagInput('');
    setImage(null);
  };

  // Friendly "when" label. Accepts ISO timestamps from the database as well as
  // the already-human strings used by the seeded demo posts.
  const formatWhen = (value) => {
    if (!value || typeof value !== 'string') return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const mins = Math.round((Date.now() - parsed.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getContactLink = (contact) => {
    if (!contact) return '#';
    const c = contact.toLowerCase();
    if (c.includes('whatsapp') || c.includes('wa.me') || contact.match(/^\+?\d{10,14}$/)) {
      const num = contact.replace(/\D/g, '');
      return `https://wa.me/${num}`;
    }
    if (c.includes('instagram') || c.includes('ig') || c.includes('@')) {
      const handle = contact.split('@').pop().split(' ')[0];
      return `https://instagram.com/${handle}`;
    }
    return `mailto:${contact}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent p-5 sm:p-7 rounded-3xl border border-emerald-500/20 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500 text-slate-950 rounded-2xl shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Megaphone className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Travel Community Board
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Discover group meetups, road trips, and connect with fellow explorers.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!userProfile) {
              if (onOpenAuthModal) onOpenAuthModal();
            } else {
              setShowCreateModal(true);
            }
          }}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-4 py-3 rounded-2xl text-xs sm:text-sm transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Post Trip Announcement</span>
        </button>
      </div>

      {/* Success / offline-save feedback for the last post attempt */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="status"
            className={`flex items-start gap-2 px-4 py-3 rounded-2xl border text-xs font-medium ${
              notice.type === 'success'
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            <span className="shrink-0">{notice.type === 'success' ? '✅' : '⚠️'}</span>
            <span className="flex-1">{notice.text}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setNotice(null)}
              className="shrink-0 hover:opacity-70"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedTag === tag
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition-all duration-300"
          >
            <div className="space-y-3">
              {/* Creator info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.creator_avatar ? (
                    <img
                      src={item.creator_avatar}
                      alt={item.creator_name}
                      className="w-8 h-8 rounded-full object-cover border border-teal-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center">
                      {(item.creator_name || 'T')[0]}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      {item.creator_name}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatWhen(item.created_at)}</span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl">
                  ₹{Number(item.budget_per_person || 0).toLocaleString('en-IN')}/head
                </span>
              </div>

              {/* Title & Destination */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-semibold mt-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.destination}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.date_range}</span>
                </div>
              </div>

              {/* Image if available */}
              {item.image_url && (
                <div className="w-full h-32 rounded-xl overflow-hidden my-2 border border-slate-200 dark:border-slate-800">
                  <img src={item.image_url} alt="Trip Image" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                {item.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {item.tags?.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Connect Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                {item.contact_info}
              </span>
              <a
                href={getContactLink(item.contact_info)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Connect</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2.5 bg-teal-500/10 text-teal-500 rounded-2xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  New Trip Announcement
                </h3>
              </div>

              <form onSubmit={handleCreateAnnouncement} noValidate className="space-y-3">
                {/* Image Upload */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <label className="w-full h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-teal-500 transition overflow-hidden relative shadow-sm">
                    {image ? (
                      <img src={image} alt="Trip Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase">Add Trip Image</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {isCompressing && <span className="text-[10px] text-teal-500 font-medium">Compressing...</span>}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Announcement Headline
                  </label>
                  <input
                    id="announcement-title"
                    type="text"
                    placeholder="e.g. Weekend Roadtrip to Gokarna & Dandeli"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clearFieldError('title');
                    }}
                    aria-invalid={Boolean(fieldErrors.title)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${
                      fieldErrors.title ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-[10px] font-semibold text-rose-500">{fieldErrors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Destination
                    </label>
                    <input
                      id="announcement-destination"
                      type="text"
                      placeholder="e.g. Gokarna"
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        clearFieldError('destination');
                      }}
                      aria-invalid={Boolean(fieldErrors.destination)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${
                        fieldErrors.destination ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                    {fieldErrors.destination && (
                      <p className="mt-1 text-[10px] font-semibold text-rose-500">{fieldErrors.destination}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Budget / Person (₹)
                    </label>
                    <input
                      id="announcement-budget"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="e.g. 5000"
                      value={budget}
                      onChange={(e) => {
                        setBudget(e.target.value);
                        clearFieldError('budget');
                      }}
                      aria-invalid={Boolean(fieldErrors.budget)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${
                        fieldErrors.budget ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                    {fieldErrors.budget && (
                      <p className="mt-1 text-[10px] font-semibold text-rose-500">{fieldErrors.budget}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dates / Schedule
                  </label>
                  <input
                    id="announcement-dateRange"
                    type="text"
                    placeholder="e.g. Oct 2 - Oct 5 (Long Weekend)"
                    value={dateRange}
                    onChange={(e) => {
                      setDateRange(e.target.value);
                      clearFieldError('dateRange');
                    }}
                    aria-invalid={Boolean(fieldErrors.dateRange)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${
                      fieldErrors.dateRange ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {fieldErrors.dateRange && (
                    <p className="mt-1 text-[10px] font-semibold text-rose-500">{fieldErrors.dateRange}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Trip Details & Plans
                  </label>
                  <textarea
                    id="announcement-description"
                    rows={3}
                    placeholder="Describe itinerary, spots, and traveler vibe..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clearFieldError('description');
                    }}
                    aria-invalid={Boolean(fieldErrors.description)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${
                      fieldErrors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {fieldErrors.description && (
                    <p className="mt-1 text-[10px] font-semibold text-rose-500">{fieldErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Contact Info / Handle
                    </label>
                    <input
                      id="announcement-contactInfo"
                      type="text"
                      placeholder="WhatsApp, IG, or Email"
                      value={contactInfo}
                      onChange={(e) => {
                        setContactInfo(e.target.value);
                        clearFieldError('contactInfo');
                      }}
                      aria-invalid={Boolean(fieldErrors.contactInfo)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${
                        fieldErrors.contactInfo ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                    {fieldErrors.contactInfo && (
                      <p className="mt-1 text-[10px] font-semibold text-rose-500">{fieldErrors.contactInfo}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      id="announcement-tags"
                      type="text"
                      placeholder="Beaches, Trek, Roadtrip"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        clearFieldError('tags');
                      }}
                      aria-invalid={Boolean(fieldErrors.tags)}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 ${
                        fieldErrors.tags ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                    {fieldErrors.tags && (
                      <p className="mt-1 text-[10px] font-semibold text-rose-500">{fieldErrors.tags}</p>
                    )}
                  </div>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-medium"
                  >
                    <span className="shrink-0">⚠️</span>
                    <span className="flex-1">{formError}</span>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-2xl text-xs"
                    disabled={isLoading || isCompressing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3 rounded-2xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                    disabled={isLoading || isCompressing}
                  >
                    {isLoading ? (
                      <>
                        <Spinner size={14} />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      'Publish Announcement'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
