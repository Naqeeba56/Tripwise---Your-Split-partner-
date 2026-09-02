'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PlaneTakeoff, Users, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import JoinTripModal from '@/components/JoinTripModal';

export default function JoinTripPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;

  const [trip, setTrip] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(true);

  useEffect(() => {
    // Load trips from localStorage or fallback
    try {
      const savedTrips = localStorage.getItem('splittrip_all_trips');
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
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Default fallback trip if not found in local cache
    setTrip({
      id: token || '1',
      name: 'Goa Trip 2026',
      creatorName: 'Naqeeb',
      creatorUpi: 'naqeeb@upi',
      invite_token: token,
      members: [{ name: 'Naqeeb', avatar: null }],
    });
  }, [token]);

  const handleJoinComplete = (memberData) => {
    if (!trip) return;

    try {
      const savedTrips = localStorage.getItem('splittrip_all_trips');
      let all = savedTrips ? JSON.parse(savedTrips) : [];
      const index = all.findIndex((t) => String(t.id) === String(trip.id));

      const updatedMembers = [...(trip.members || []), memberData];
      const updatedTrip = { ...trip, members: updatedMembers };

      if (index >= 0) {
        all[index] = updatedTrip;
      } else {
        all.push(updatedTrip);
      }

      localStorage.setItem('splittrip_all_trips', JSON.stringify(all));
      localStorage.setItem('splittrip_active_id', JSON.stringify(trip.id));
    } catch (err) {
      console.error(err);
    }

    setShowJoinModal(false);
    router.push('/');
  };

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
