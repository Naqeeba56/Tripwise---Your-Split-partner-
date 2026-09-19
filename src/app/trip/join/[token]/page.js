'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PlaneTakeoff, Users, ArrowRight } from 'lucide-react';
import JoinTripModal from '@/components/JoinTripModal';
import { supabase } from '@/lib/supabase';
import {
  fetchTripByInviteToken,
  addMemberInDb,
  getUserStorageKey,
} from '@/lib/supabaseDb';
import { safeSetItem, safeGetItem } from '@/lib/storage';

export default function JoinTripPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;

  const [trip, setTrip] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Check Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserProfile({
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
        });
      }
    });
  }, []);

  // 2. Fetch Trip by Invite Token from Supabase
  useEffect(() => {
    if (!token) return;

    const loadTrip = async () => {
      setLoading(true);
      try {
        const dbTrip = await fetchTripByInviteToken(token);
        if (dbTrip) {
          setTrip(dbTrip);
        } else {
          // Local storage fallback as secondary option
          const savedTrips = safeGetItem('splittrip_all_trips');
          if (savedTrips) {
            const parsed = JSON.parse(savedTrips);
            const matched = parsed.find(
              (t) =>
                t.invite_token === token ||
                t.inviteToken === token ||
                t.id === token
            );
            if (matched) {
              setTrip(matched);
              setLoading(false);
              return;
            }
          }

          // Default fallback trip if not found anywhere
          setTrip({
            id: token || '1',
            name: 'Goa Trip 2026',
            creatorName: 'Naqeeb',
            creatorUpi: 'naqeeb@upi',
            invite_token: token,
            members: [{ name: 'Naqeeb', avatar: null }],
          });
        }
      } catch (err) {
        console.error('Error fetching trip for join:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [token]);

  const handleJoinComplete = async (memberData) => {
    if (!trip) return;

    try {
      const userId = userProfile?.id || null;

      // Add member to database
      const addedMember = await addMemberInDb(
        trip.id,
        {
          ...memberData,
          role: 'member',
        },
        userId
      );

      // Save locally so it shows up instantly
      const key = getUserStorageKey(userId, 'trips');
      const savedTrips = safeGetItem(key);
      let all = savedTrips ? JSON.parse(savedTrips) : [];

      const updatedMembers = [...(trip.members || []), addedMember];
      const updatedTrip = { ...trip, members: updatedMembers };

      const index = all.findIndex((t) => String(t.id) === String(trip.id));
      if (index >= 0) {
        all[index] = updatedTrip;
      } else {
        all.unshift(updatedTrip);
      }

      safeSetItem(key, all);
      safeSetItem(getUserStorageKey(userId, 'active_trip_id'), trip.id);

      // Keep legacy keys for full compatibility
      safeSetItem('splittrip_all_trips', all);
      safeSetItem('splittrip_active_id', trip.id);
    } catch (err) {
      console.error('Error recording join in database:', err);
    }

    setShowJoinModal(false);
    router.push('/app');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 bg-slate-800 rounded-full mx-auto" />
          <div className="h-4 bg-slate-800 rounded w-32 mx-auto" />
          <p className="text-xs text-slate-500">Loading trip details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl"
      >
        <div className="w-14 h-14 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30 shadow-md">
          <PlaneTakeoff className="w-7 h-7 stroke-[2.5]" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white">
          Join {trip?.name || 'Shared Trip'}
        </h2>
        <p className="text-xs text-slate-400">
          Invited by <strong className="text-teal-400">{trip?.creatorName || 'Organizer'}</strong>
        </p>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-400">
          Invite Token: <span className="text-teal-400 font-bold">{token}</span>
        </div>

        <button
          onClick={() => setShowJoinModal(true)}
          className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
        >
          <span>Enter Details to Join</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </motion.div>

      {/* Join Trip Modal Popup */}
      <JoinTripModal
        isOpen={showJoinModal}
        tripName={trip?.name}
        inviteToken={token}
        onJoin={handleJoinComplete}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
}
