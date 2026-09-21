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

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !destination.trim() || !contactInfo.trim()) {
      setFormError('Please fill in at least the Title, Destination and Contact Info.');
      return;
    }
    if (description.trim() && description.trim().length < 10) {
      setFormError('Description should be at least 10 characters if you add one.');
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
      created_at: 'Just now',
    };

    const savedPost = await createAnnouncementInDb(newPost, userProfile?.id);

    setAnnouncements([savedPost, ...announcements]);
    setShowCreateModal(false);
    setFormError(null);
    setTitle('');
    setDestination('');
    setDateRange('');
    setBudget('');
    setDescription('');
    setContactInfo('');
    setTagInput('');
    setImage(null);
    setIsLoading(false);
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
                      {item.creator_name[0]}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      {item.creator_name}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.created_at}</span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl">
                  ₹{item.budget_per_person.toLocaleString('en-IN')}/head
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

              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
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
                    type="text"
                    placeholder="e.g. Weekend Roadtrip to Gokarna & Dandeli"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Destination
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gokarna"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Budget / Person (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dates / Schedule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oct 2 - Oct 5 (Long Weekend)"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Trip Details & Plans
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe itinerary, spots, and traveler vibe..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Contact Info / Handle
                    </label>
                    <input
                      type="text"
                      placeholder="WhatsApp, IG, or Email"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Beaches, Trek, Roadtrip"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-[11px] font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                    {formError}
                  </p>
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
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3 rounded-2xl text-xs transition shadow-lg shadow-teal-500/20"
                    disabled={isLoading || isCompressing}
                  >
                    {isLoading ? 'Publishing...' : 'Publish Announcement'}
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
