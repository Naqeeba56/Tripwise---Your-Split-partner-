import { supabase, isSupabaseConfigured } from './supabase';
import { safeSetItem, safeGetItem } from './storage';

/**
 * Supabase Database Service with User-Isolation and Storage Cache
 */

// Helper to get user-specific storage key
export const getUserStorageKey = (userId, key) => `tripwise_${userId || 'guest'}_${key}`;

// Helper to check if string is valid UUID
export const isValidUuid = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

/**
 * Ensures user profile exists in Supabase DB profiles table
 */
// --- Resilient member/trip helpers ---------------------------------
// Some projects are missing `upi_number` / `parent_member_name` on
// trip_members. We query/insert the full set first and transparently
// retry with a safe subset so data ALWAYS persists to Supabase.
const MEMBER_FULL_COLS = 'id,name,avatar_url,upi_id,upi_number,role,parent_member_name,user_id';
const MEMBER_SAFE_COLS = 'id,name,avatar_url,upi_id,role,user_id';

const TRIP_SELECT_FULL = `
  id,name,image_url,created_by,creator_name,creator_upi,invite_token,
  daily_budget_limit,expense_budget_limit,created_at,
  trip_members (${MEMBER_FULL_COLS})
`;
const TRIP_SELECT_SAFE = `
  id,name,image_url,created_by,creator_name,creator_upi,invite_token,
  daily_budget_limit,expense_budget_limit,created_at,
  trip_members (${MEMBER_SAFE_COLS})
`;

const mapMember = (m) => ({
  id: m.id,
  name: m.name,
  avatar: m.avatar_url,
  avatar_url: m.avatar_url,
  upi_id: m.upi_id,
  upi_number: m.upi_number || '',
  role: m.role,
  parentMemberName: m.parent_member_name || null,
  userId: m.user_id,
});

const mapTrip = (t) => ({
  id: t.id,
  name: t.name,
  image_url: t.image_url,
  image: t.image_url,
  createdBy: t.created_by,
  creatorName: t.creator_name,
  creatorUpi: t.creator_upi,
  invite_token: t.invite_token,
  inviteToken: t.invite_token,
  daily_budget_limit: t.daily_budget_limit,
  expense_budget_limit: t.expense_budget_limit,
  members: (t.trip_members || []).map(mapMember),
});

// Runs a trips query against Supabase; falls back to the safe column set
// if the live schema is missing optional columns.
async function runTripSelect(queryFn) {
  let res = await queryFn(TRIP_SELECT_FULL);
  if (res.error) {
    res = await queryFn(TRIP_SELECT_SAFE);
  }
  return res;
}

// Inserts a trip_member, retrying without optional columns on failure.
async function insertMemberSafe(payload) {
  let { error } = await supabase.from('trip_members').insert(payload);
  if (error && (payload.upi_number !== undefined || payload.parent_member_name !== undefined)) {
    const safe = { ...payload };
    delete safe.upi_number;
    delete safe.parent_member_name;
    ({ error } = await supabase.from('trip_members').insert(safe));
  }
  return error;
}

export const ensureProfileExists = async (userId, userObj = {}) => {
  if (!isSupabaseConfigured() || !isValidUuid(userId)) return;
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      email: userObj.email || null,
      name: userObj.name || 'Traveler',
      avatar_url: userObj.avatar || null,
      upi_id: userObj.upi_id || '',
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn('Profile upsert notice:', e);
  }
};

/**
 * Fetch trips belonging to the authenticated user
 * Returns: Trips created by user + trips they're a member of
 */
export const fetchUserTrips = async (userId) => {
  if (!userId) return [];

  if (isSupabaseConfigured()) {
    try {
      // Step 1: Get trips created by user (resilient to missing columns)
      const resCreated = await runTripSelect((sel) =>
        supabase
          .from('trips')
          .select(sel)
          .eq('created_by', userId)
          .order('created_at', { ascending: false })
      );
      const createdTrips = resCreated.data || [];

      // Step 2: Get trips where user is a member (but not creator)
      const { data: memberTripsData } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', userId);

      let memberTrips = [];
      if (memberTripsData && memberTripsData.length > 0) {
        const tripIds = memberTripsData.map((m) => m.trip_id);
        const resMembers = await runTripSelect((sel) =>
          supabase
            .from('trips')
            .select(sel)
            .in('id', tripIds)
            .order('created_at', { ascending: false })
        );
        memberTrips = resMembers.data || [];
      }

      // Step 3: Merge and deduplicate by trip ID
      const allTrips = [...(createdTrips || []), ...memberTrips];
      const uniqueTripsMap = new Map();

      allTrips.forEach((trip) => {
        if (!uniqueTripsMap.has(trip.id)) {
          uniqueTripsMap.set(trip.id, trip);
        }
      });

      const data = Array.from(uniqueTripsMap.values()).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      if (data) {
        return data.map(mapTrip);
      }
    } catch (err) {
      console.warn('Supabase trips query fallback:', err);
    }
  }

  // User-scoped Local Storage fallback
  if (typeof window !== 'undefined') {
    const saved = safeGetItem(getUserStorageKey(userId, 'trips'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
  }

  return [];
};

/**
 * Save / Create a new Trip in Supabase and user cache
 */
export const createTripInDb = async (tripData, userId) => {
  const newTripId = String(Date.now());
  const inviteToken = tripData.invite_token || Math.random().toString(36).substring(2, 10);

  const formattedTrip = {
    id: newTripId,
    name: tripData.name,
    image_url: tripData.image || tripData.image_url || null,
    image: tripData.image || tripData.image_url || null,
    createdBy: userId || 'anonymous',
    creatorName: tripData.creatorName || 'Organizer',
    creatorUpi: tripData.creatorUpi || 'naqeeb@upi',
    invite_token: inviteToken,
    inviteToken: inviteToken,
    daily_budget_limit: Number(tripData.daily_budget_limit) || 10000,
    expense_budget_limit: Number(tripData.expense_budget_limit) || 3000,
    members: tripData.members || [
      {
        name: tripData.creatorName || 'Organizer',
        avatar: tripData.creatorAvatar || null,
        upi_id: tripData.creatorUpi || 'naqeeb@upi',
        upi_number: tripData.creatorUpiNumber || '',
        role: 'admin',
      },
    ],
  };

  if (isSupabaseConfigured() && userId) {
    try {
      await ensureProfileExists(userId, { name: tripData.creatorName, upi_id: tripData.creatorUpi });

      const tripPayload = {
        name: formattedTrip.name,
        image_url: formattedTrip.image_url,
        creator_name: formattedTrip.creatorName,
        creator_upi: formattedTrip.creatorUpi,
        invite_token: inviteToken,
        daily_budget_limit: formattedTrip.daily_budget_limit,
        expense_budget_limit: formattedTrip.expense_budget_limit,
      };

      if (isValidUuid(userId)) {
        tripPayload.created_by = userId;
      }

      let { data: tripInsert, error: tripError } = await supabase
        .from('trips')
        .insert(tripPayload)
        .select()
        .single();

      // If foreign key constraint failed on created_by, retry without created_by
      if (tripError && tripPayload.created_by) {
        console.warn('Retrying trip insert without created_by FK:', tripError.message);
        delete tripPayload.created_by;
        const retryRes = await supabase
          .from('trips')
          .insert(tripPayload)
          .select()
          .single();
        tripInsert = retryRes.data;
        tripError = retryRes.error;
      }

      if (tripError) {
        console.error('Supabase trip insert error:', tripError);
      }

      if (!tripError && tripInsert) {
        formattedTrip.id = tripInsert.id;

        // Insert initial members into DB
        for (const m of formattedTrip.members) {
          const mObj = typeof m === 'string' ? { name: m } : m;
          const memberPayload = {
            trip_id: tripInsert.id,
            name: mObj.name,
            avatar_url: mObj.avatar || mObj.avatar_url || null,
            upi_id: mObj.upi_id || '',
            upi_number: mObj.upi_number || '',
            role: mObj.role || 'member',
            parent_member_name: mObj.parentMemberName || null,
          };

          if (isValidUuid(userId)) {
            memberPayload.user_id = userId;
          }

          let mError = await insertMemberSafe(memberPayload);
          if (mError && memberPayload.user_id) {
            delete memberPayload.user_id;
            mError = await insertMemberSafe(memberPayload);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase trip insert fallback:', err);
    }
  }

  // Update User-scoped Storage
  if (typeof window !== 'undefined' && userId) {
    const key = getUserStorageKey(userId, 'trips');
    const existing = safeGetItem(key);
    const parsed = existing ? JSON.parse(existing) : [];
    const updated = [formattedTrip, ...parsed];
    safeSetItem(key, updated);
  }

  return formattedTrip;
};

/**
 * Fetch expenses for a specific trip
 */
export const fetchTripExpenses = async (tripId, userId) => {
  if (!tripId) return [];

  if (isSupabaseConfigured() && isValidUuid(tripId)) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((e) => ({
          id: e.id,
          tripId: e.trip_id,
          title: e.title,
          amount: Number(e.amount),
          paidBy: e.paid_by,
          payers: Array.isArray(e.payers) && e.payers.length ? e.payers : null,
          category: e.category,
          excludedMembers: Array.isArray(e.excluded_members) ? e.excluded_members : [],
          date: e.date || e.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase expenses query fallback:', err);
    }
  }

  if (typeof window !== 'undefined' && userId) {
    const saved = safeGetItem(getUserStorageKey(userId, `expenses_${tripId}`));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
  }

  return [];
};

/**
 * Add an expense to a trip
 */
export const createExpenseInDb = async (expenseData, userId) => {
  const newExpId = String(Date.now());
  const newExp = {
    id: newExpId,
    tripId: String(expenseData.tripId),
    title: expenseData.title,
    amount: Number(expenseData.amount),
    paidBy: expenseData.paidBy,
    payers: expenseData.payers || null,
    category: expenseData.category || 'Food',
    excludedMembers: expenseData.excludedMembers || [],
    date: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && isValidUuid(expenseData.tripId)) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          trip_id: expenseData.tripId,
          title: newExp.title,
          amount: newExp.amount,
          paid_by: newExp.paidBy,
          payers: newExp.payers,
          category: newExp.category,
          excluded_members: newExp.excludedMembers,
        })
        .select()
        .single();

      // If the DB doesn't have a `payers` column yet, retry without it.
      if (error && error.message && /payers/i.test(`${error.message} ${error.details || ''}`)) {
        const retry = await supabase
          .from('expenses')
          .insert({
            trip_id: expenseData.tripId,
            title: newExp.title,
            amount: newExp.amount,
            paid_by: newExp.paidBy,
            category: newExp.category,
            excluded_members: newExp.excludedMembers,
          })
          .select()
          .single();
        if (!retry.error && retry.data) {
          newExp.id = retry.data.id;
        }
      } else if (!error && data) {
        newExp.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase expense insert fallback:', err);
    }
  }

  if (typeof window !== 'undefined' && userId) {
    const key = getUserStorageKey(userId, `expenses_${expenseData.tripId}`);
    const existing = safeGetItem(key);
    const parsed = existing ? JSON.parse(existing) : [];
    const updated = [newExp, ...parsed];
    safeSetItem(key, updated);
  }

  return newExp;
};

/**
 * Delete / settle an expense (with trip_id verification for security)
 */
export const deleteExpenseInDb = async (expenseId, tripId, userId) => {
  if (isSupabaseConfigured() && isValidUuid(expenseId) && isValidUuid(tripId)) {
    try {
      // IMPORTANT: Filter by trip_id to prevent users from deleting other trips' expenses
      await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('trip_id', tripId);
    } catch (err) {
      console.warn('Supabase delete expense error:', err);
    }
  }

  if (typeof window !== 'undefined' && userId && tripId) {
    const key = getUserStorageKey(userId, `expenses_${tripId}`);
    const existing = safeGetItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      const filtered = parsed.filter((e) => String(e.id) !== String(expenseId));
      safeSetItem(key, filtered);
    }
  }
};

/**
 * Update / edit an expense (title, amount, category, paid-by, payers, exclusions)
 * scoped by trip_id so users can only edit expenses of their own trip.
 */
export const updateExpenseInDb = async (expenseId, tripId, fields = {}, userId) => {
  if (isSupabaseConfigured() && isValidUuid(expenseId) && isValidUuid(tripId)) {
    try {
      const payload = {
        ...(fields.title !== undefined ? { title: fields.title } : {}),
        ...(fields.amount !== undefined ? { amount: Number(fields.amount) } : {}),
        ...(fields.paidBy !== undefined ? { paid_by: fields.paidBy } : {}),
        ...(fields.payers !== undefined ? { payers: fields.payers } : {}),
        ...(fields.category !== undefined ? { category: fields.category } : {}),
        ...(fields.excludedMembers !== undefined ? { excluded_members: fields.excludedMembers } : {}),
      };
      await supabase.from('expenses').update(payload).eq('id', expenseId).eq('trip_id', tripId);
    } catch (err) {
      console.warn('Supabase expense update error:', err);
    }
  }

  if (typeof window !== 'undefined' && userId && tripId) {
    const key = getUserStorageKey(userId, `expenses_${tripId}`);
    const existing = safeGetItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      const updated = parsed.map((e) => (String(e.id) === String(expenseId) ? { ...e, ...fields } : e));
      safeSetItem(key, updated);
    }
  }
};

/**
 * Add member to trip in DB and user cache
 */
export const addMemberInDb = async (tripId, memberObj, userId) => {
  const newMember = {
    id: memberObj.id || String(Date.now() + Math.random()),
    ...memberObj
  };
  if (isSupabaseConfigured() && isValidUuid(tripId)) {
    try {
      const payload = {
        trip_id: tripId,
        name: memberObj.name,
        avatar_url: memberObj.avatar || null,
        upi_id: memberObj.upi_id || '',
        upi_number: memberObj.upi_number || '',
        role: memberObj.role || 'member',
        parent_member_name: memberObj.parentMemberName || null,
      };

      if (userId && isValidUuid(userId)) {
        payload.user_id = userId;
      }

      let { data, error } = await supabase
        .from('trip_members')
        .insert(payload)
        .select()
        .single();

      // Retry without optional columns if the live schema lacks them
      if (error && (payload.upi_number !== undefined || payload.parent_member_name !== undefined)) {
        const safe = { ...payload };
        delete safe.upi_number;
        delete safe.parent_member_name;
        const retry = await supabase.from('trip_members').insert(safe).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        newMember.id = data.id;
        newMember.avatar_url = data.avatar_url;
        newMember.avatar = data.avatar_url;
        newMember.upi_id = data.upi_id;
        newMember.upi_number = data.upi_number || '';
        newMember.parentMemberName = data.parent_member_name || null;
        newMember.role = data.role;
      }
    } catch (err) {
      console.warn('Supabase add member error:', err);
    }
  }
  return newMember;
};

/**
 * Fetch a trip by its invite token (for joining trips)
 */
export const fetchTripByInviteToken = async (token) => {
  if (!token) return null;

  if (isSupabaseConfigured()) {
    try {
      let { data, error } = await supabase
        .from('trips')
        .select(TRIP_SELECT_FULL)
        .eq('invite_token', token)
        .single();

      if (error) {
        const res = await supabase
          .from('trips')
          .select(TRIP_SELECT_SAFE)
          .eq('invite_token', token)
          .single();
        data = res.data;
        error = res.error;
      }

      if (!error && data) {
        return mapTrip(data);
      }
    } catch (err) {
      console.warn('Supabase fetch trip by invite token notice:', err);
    }
  }
  return null;
};

/**
 * Persist a settlement in Supabase DB
 */
export const createSettlementInDb = async (tripId, settlementData, userId) => {
  if (isSupabaseConfigured() && isValidUuid(tripId)) {
    try {
      await supabase.from('settlements').insert({
        trip_id: tripId,
        settlement_key: settlementData.id || String(Date.now()),
        from_member: settlementData.from,
        to_member: settlementData.to,
        amount: settlementData.amount,
        status: 'settled',
        method: settlementData.method || 'UPI',
        transaction_id: settlementData.transactionId || null,
      });
    } catch (err) {
      console.warn('Supabase create settlement notice:', err);
    }
  }
};

/**
 * Delete a member from a trip
 */
export const deleteMemberInDb = async (tripId, memberId, userId) => {
  if (isSupabaseConfigured() && isValidUuid(tripId) && isValidUuid(memberId)) {
    try {
      // Delete from trip_members table with both trip and member verification
      const { error } = await supabase
        .from('trip_members')
        .delete()
        .eq('id', memberId)
        .eq('trip_id', tripId);

      if (error) {
        console.error('Error deleting member:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase delete member error:', err);
      return false;
    }
  }
  return false;
};

/**
 * Delete an entire trip and all its related data
 */
export const deleteTripInDb = async (tripId, userId) => {
  if (isSupabaseConfigured() && isValidUuid(tripId)) {
    try {
      // First, verify the user is the trip creator
      const { data: trip, error: fetchError } = await supabase
        .from('trips')
        .select('created_by')
        .eq('id', tripId)
        .single();

      if (fetchError || !trip) {
        console.error('Trip not found:', fetchError);
        return false;
      }

      // IMPORTANT: Only allow trip creator to delete
      if (trip.created_by !== userId) {
        console.error('Only trip creator can delete this trip');
        return false;
      }

      // Delete the trip (cascade will delete members, expenses, settlements)
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('created_by', userId); // Double-check ownership

      if (deleteError) {
        console.error('Error deleting trip:', deleteError);
        return false;
      }

      // Remove from localStorage
      if (typeof window !== 'undefined' && userId) {
        const key = getUserStorageKey(userId, 'trips');
        const existing = safeGetItem(key);
        if (existing) {
          const parsed = JSON.parse(existing);
          const filtered = parsed.filter((t) => String(t.id) !== String(tripId));
          safeSetItem(key, filtered);
        }
      }

      return true;
    } catch (err) {
      console.error('Supabase delete trip error:', err);
      return false;
    }
  }
  return false;
};

/**
 * Fetch announcements from Supabase
 */
export const fetchAnnouncementsFromDb = async () => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase announcements query fallback:', err);
    }
  }
  return [];
};

/**
 * Create announcement in Supabase
 */
export const createAnnouncementInDb = async (announcementData, userId) => {
  if (isSupabaseConfigured()) {
    try {
      const payload = {
        creator_name: announcementData.creator_name,
        creator_avatar: announcementData.creator_avatar,
        title: announcementData.title,
        destination: announcementData.destination,
        date_range: announcementData.date_range,
        budget_per_person: announcementData.budget_per_person,
        description: announcementData.description,
        contact_info: announcementData.contact_info,
        tags: announcementData.tags,
        image_url: announcementData.image_url || null,
        created_at: new Date().toISOString(),
      };

      if (isValidUuid(userId)) {
        payload.user_id = userId;
      }

      const { data, error } = await supabase
        .from('announcements')
        .insert(payload)
        .select()
        .single();
      
      if (!error && data) {
        return data;
      } else {
        console.warn('Failed to insert announcement:', error);
      }
    } catch (err) {
      console.warn('Supabase announcement insert error:', err);
    }
  }
  return announcementData;
};
