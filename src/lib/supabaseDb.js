import { supabase, isSupabaseConfigured } from './supabase';
import { safeSetItem, safeGetItem } from './storage';
import { friendlyError } from './errorMessages';

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

  // Load the user's offline cache FIRST. Anything saved here that is NOT found
  // in the database (e.g. an insert that failed because the live schema is
  // missing a column) is merged back in so expenses NEVER vanish on refresh.
  let localExpenses = [];
  if (typeof window !== 'undefined' && userId) {
    const saved = safeGetItem(getUserStorageKey(userId, `expenses_${tripId}`));
    if (saved) {
      try {
        localExpenses = JSON.parse(saved);
        if (!Array.isArray(localExpenses)) localExpenses = [];
      } catch (e) {
        localExpenses = [];
      }
    }
  }

  let dbExpenses = [];
  if (isSupabaseConfigured() && isValidUuid(tripId)) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Index the local cache by id so a row that reached the database can be
        // enriched from the richer local snapshot. The browser cache stores the
        // FULL payers/excludedMembers arrays; the database row may not if the
        // live schema was created before those columns existed (the insert
        // retry drops them). Without this backfill a "paid by multiple" expense
        // reverts to a single name (and wrong settlement) after a refresh.
        const localById = new Map(
          (localExpenses || []).map((le) => [String(le.id), le])
        );

        dbExpenses = data.map((e) => {
          const local = localById.get(String(e.id));
          let payers =
            Array.isArray(e.payers) && e.payers.length ? e.payers : null;
          let paidBy = e.paid_by;
          let excludedMembers = Array.isArray(e.excluded_members)
            ? e.excluded_members
            : [];

          // Backfill only the fields the DB row is missing.
          if (local) {
            if (
              (!Array.isArray(payers) || payers.length === 0) &&
              Array.isArray(local.payers) &&
              local.payers.length
            ) {
              payers = local.payers;
              paidBy = paidBy || local.paidBy;
            }
            if (
              (!Array.isArray(excludedMembers) || excludedMembers.length === 0) &&
              Array.isArray(local.excludedMembers) &&
              local.excludedMembers.length
            ) {
              excludedMembers = local.excludedMembers;
            }
          }

          return {
            id: e.id,
            tripId: e.trip_id,
            title: e.title,
            amount: Number(e.amount),
            paidBy,
            payers,
            addedBy: e.added_by,
            userId: e.user_id,
            category: e.category,
            excludedMembers,
            date: (e.created_at || e.date || new Date()).toString(),
          };
        });
      }
    } catch (err) {
      console.warn('Supabase expenses query fallback:', err);
    }
  }

  // Merge: database rows first, then any local-only rows (never drop them).
  const dbIds = new Set(dbExpenses.map((e) => String(e.id)));
  const extras = (localExpenses || []).filter((e) => e && !dbIds.has(String(e.id)));

  return [...dbExpenses, ...extras];
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
    addedBy: expenseData.addedBy || 'Unknown',
    category: expenseData.category || 'Food',
    excludedMembers: expenseData.excludedMembers || [],
    userId: isValidUuid(userId) ? userId : null,
    date: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && isValidUuid(expenseData.tripId)) {
    let persisted = false;
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
          added_by: newExp.addedBy,
          user_id: newExp.userId,
        })
        .select()
        .single();

      // Retry growing-less columns when the live schema lacks an optional one
      // (e.g. `payers`, `excluded_members`, `added_by`, or `user_id`). This is
      // what previously made inserts silently fail → data only lived in
      // localStorage and "disappeared" after a refresh.
      if (error) {
        const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();
        let retryPayload = {
          trip_id: expenseData.tripId,
          title: newExp.title,
          amount: newExp.amount,
          paid_by: newExp.paidBy,
          category: newExp.category,
          excluded_members: newExp.excludedMembers,
        };
        if (/payers|column.*does not exist|42703/.test(msg)) {
          delete retryPayload.payers;
        }
        if (/added_by|column.*does not exist|42703/.test(msg)) {
          delete retryPayload.added_by;
        }
        if (/user_id|column.*does not exist|42703/.test(msg)) {
          delete retryPayload.user_id;
        }
        if (/excluded_members|column.*does not exist|42703/.test(msg)) {
          delete retryPayload.excluded_members;
        }

        const retry = await supabase
          .from('expenses')
          .insert(retryPayload)
          .select()
          .single();
        if (!retry.error && retry.data) {
          newExp.id = retry.data.id;
          persisted = true;
        } else if (!/payers|payments/.test(msg)) {
          console.warn('Supabase expense insert retry error:', retry.error);
        }
      } else if (data) {
        newExp.id = data.id;
        persisted = true;
      }
    } catch (err) {
      console.warn('Supabase expense insert fallback:', err);
    }

    if (!persisted) {
      // The row never reached the database. Flag it so the UI can say so, and
      // so the local-cache merge in `fetchTripExpenses` keeps it visible after
      // a refresh instead of silently dropping it.
      newExp._localOnly = true;
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
 * Authorization guard: an expense may only be edited/deleted by its creator
 * (expenses.user_id) or the trip organizer (trips.created_by). Returns
 * `{ allowed, reason }`.
 */
const getExpensePermission = async (expenseId, tripId, userId) => {
  if (!isValidUuid(expenseId) || !isValidUuid(tripId) || !isValidUuid(userId)) {
    return { allowed: false, reason: 'Missing or invalid identifiers' };
  }

  try {
    // 1) Expense creator?
    const { data: exp, error: expErr } = await supabase
      .from('expenses')
      .select('user_id')
      .eq('id', expenseId)
      .eq('trip_id', tripId)
      .maybeSingle();
    if (!expErr && exp && exp.user_id && String(exp.user_id) === String(userId)) {
      return { allowed: true, reason: 'creator' };
    }

    // 2) Trip organizer?
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('created_by')
      .eq('id', tripId)
      .maybeSingle();
    if (!tripErr && trip && trip.created_by && String(trip.created_by) === String(userId)) {
      return { allowed: true, reason: 'organizer' };
    }
  } catch (err) {
    console.warn('Expense permission check error:', err);
  }

  return { allowed: false, reason: 'only_creator_or_organizer' };
};

/**
 * Delete / settle an expense (scoped by trip_id AND authorized).
 * The expense may only be deleted by the expense creator or the trip organizer.
 */
export const deleteExpenseInDb = async (expenseId, tripId, userId) => {
  if (isSupabaseConfigured() && isValidUuid(expenseId) && isValidUuid(tripId)) {
    const { allowed, reason } = await getExpensePermission(expenseId, tripId, userId);
    if (!allowed) {
      console.warn(`Expense delete denied: ${reason}`);
    } else {
      try {
        await supabase
          .from('expenses')
          .delete()
          .eq('id', expenseId)
          .eq('trip_id', tripId);
      } catch (err) {
        console.warn('Supabase delete expense error:', err);
      }
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
    const { allowed, reason } = await getExpensePermission(expenseId, tripId, userId);
    if (!allowed) {
      console.warn(`Expense update denied: ${reason}`);
    } else {
      try {
        const payload = {
          ...(fields.title !== undefined ? { title: fields.title } : {}),
          ...(fields.amount !== undefined ? { amount: Number(fields.amount) } : {}),
          ...(fields.paidBy !== undefined ? { paid_by: fields.paidBy } : {}),
          ...(fields.payers !== undefined ? { payers: fields.payers } : {}),
          ...(fields.addedBy !== undefined ? { added_by: fields.addedBy } : {}),
          ...(fields.category !== undefined ? { category: fields.category } : {}),
          ...(fields.excludedMembers !== undefined ? { excluded_members: fields.excludedMembers } : {}),
        };
        await supabase.from('expenses').update(payload).eq('id', expenseId).eq('trip_id', tripId);
      } catch (err) {
        console.warn('Supabase expense update error:', err);
      }
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
 * ── Community announcements ─────────────────────────────────────────────
 *
 * The "Post Trip Announcement" form used to silently lose data: the live
 * Supabase table was missing the `user_id` / `image_url` columns, so EVERY
 * insert failed with PostgreSQL 42703 ("column announcements.user_id does not
 * exist") and the post only lived in React state — gone after a refresh.
 *
 * Three defences now keep announcements safe:
 *   1. `insertAnnouncementResilient()` retries without whichever column the
 *      database reports as missing (schema-drift proof).
 *   2. Anything that still cannot reach the database is cached in localStorage
 *      and merged back by `fetchAnnouncementsFromDb()`, so it survives reloads.
 *   3. The real error is returned to the UI, which shows a friendly message
 *      instead of pretending the post was published.
 */
const ANNOUNCEMENTS_LOCAL_KEY = 'tripwise_announcements_local';

// Columns that may legitimately be absent from an older live schema.
const ANNOUNCEMENT_OPTIONAL_COLUMNS = [
  'user_id',
  'creator_id',
  'image_url',
  'creator_avatar',
  'budget_per_person',
  'date_range',
  'tags',
];

const readLocalAnnouncements = () => {
  try {
    const raw = safeGetItem(ANNOUNCEMENTS_LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const cacheLocalAnnouncement = (post) => {
  try {
    const existing = readLocalAnnouncements().filter((p) => String(p.id) !== String(post.id));
    safeSetItem(ANNOUNCEMENTS_LOCAL_KEY, [post, ...existing].slice(0, 50));
  } catch (err) {
    console.warn('Announcement local cache skipped:', err);
  }
};

/** Extracts the offending column name from a PostgREST/Postgres error. */
const missingColumnFromError = (error) => {
  const msg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`;
  const match =
    /column\s+"?([a-z_][a-z0-9_]*)"?\s+does not exist/i.exec(msg) ||
    /Could not find the '([a-z_][a-z0-9_]*)' column/i.exec(msg);
  return match ? match[1] : null;
};

// Inserts an announcement, transparently dropping optional columns or broken
// foreign keys that the live schema rejects.
async function insertAnnouncementResilient(payload) {
  const attempt = { ...payload };
  let lastError = null;

  for (let i = 0; i <= ANNOUNCEMENT_OPTIONAL_COLUMNS.length + 1; i += 1) {
    const { data, error } = await supabase
      .from('announcements')
      .insert(attempt)
      .select()
      .single();

    if (!error) return { data, error: null };
    lastError = error;

    // Schema drift: the DB does not have that column → drop it and retry.
    const missingColumn = missingColumnFromError(error);
    if (missingColumn && Object.prototype.hasOwnProperty.call(attempt, missingColumn)) {
      delete attempt[missingColumn];
      continue;
    }

    // creator_id / user_id reference profiles(id). A missing profile row must
    // never cost us the whole announcement.
    if (error.code === '23503' || /foreign key/i.test(error.message || '')) {
      if (Object.prototype.hasOwnProperty.call(attempt, 'user_id')) {
        delete attempt.user_id;
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(attempt, 'creator_id')) {
        delete attempt.creator_id;
        continue;
      }
    }

    // Anything else (RLS / network / validation) cannot be fixed by retrying.
    break;
  }

  return { data: null, error: lastError };
}

/**
 * Fetch announcements from Supabase
 */
export const fetchAnnouncementsFromDb = async () => {
  const localOnly = readLocalAnnouncements();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // DB rows are the source of truth; local-only posts stay visible until
        // they successfully sync (or forever, if the schema stays broken).
        const dbIds = new Set(data.map((row) => String(row.id)));
        const pending = localOnly.filter((row) => !dbIds.has(String(row.id)));
        return [...pending, ...data];
      }

      if (error) console.warn('Announcements query failed — showing local cache:', error.message);
    } catch (err) {
      console.warn('Supabase announcements query fallback:', err);
    }
  }

  return localOnly;
};


/**
 * Create announcement in Supabase.
 *
 * NEVER throws. Returns:
 *   { data, error: null, localOnly: false }                     → persisted ✅
 *   { data, error, localOnly: true, message: 'friendly text' }  → cached only
 */
export const createAnnouncementInDb = async (announcementData, userId) => {
  const localPost = {
    ...announcementData,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    cacheLocalAnnouncement(localPost);
    return {
      data: localPost,
      error: null,
      localOnly: true,
      message: 'Supabase is not configured, so this post is only saved on this device.',
    };
  }

  try {
    const payload = {
      creator_name: announcementData.creator_name || 'Traveler',
      creator_avatar: announcementData.creator_avatar || null,
      title: announcementData.title,
      destination: announcementData.destination,
      date_range: announcementData.date_range,
      budget_per_person: Number(announcementData.budget_per_person) || 0,
      description: announcementData.description || '',
      contact_info: announcementData.contact_info,
      tags: announcementData.tags,
      image_url: announcementData.image_url || null,
      created_at: new Date().toISOString(),
    };

    if (isValidUuid(userId)) {
      payload.creator_id = userId;
      payload.user_id = userId;
    }

    const { data, error } = await insertAnnouncementResilient(payload);

    if (!error && data) {
      return { data, error: null, localOnly: false };
    }

    console.error('Announcement insert failed:', error);
    cacheLocalAnnouncement(localPost);
    return {
      data: localPost,
      error,
      localOnly: true,
      message: friendlyError(error, 'We could not save your announcement to the server.'),
    };
  } catch (err) {
    console.error('Supabase announcement insert error:', err);
    cacheLocalAnnouncement(localPost);
    return {
      data: localPost,
      error: err,
      localOnly: true,
      message: friendlyError(err, 'We could not save your announcement to the server.'),
    };
  }
};

