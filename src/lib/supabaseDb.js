import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Supabase Database Service with User-Isolation and Storage Cache
 */

// Helper to get user-specific storage key
export const getUserStorageKey = (userId, key) => `tripwise_${userId || 'guest'}_${key}`;

/**
 * Fetch trips belonging to the authenticated user
 */
export const fetchUserTrips = async (userId) => {
  if (!userId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          name,
          image_url,
          created_by,
          creator_name,
          creator_upi,
          invite_token,
          daily_budget_limit,
          expense_budget_limit,
          created_at,
          trip_members (
            id,
            name,
            avatar_url,
            upi_id,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Map database format to frontend state
        return data.map((t) => ({
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
          members: t.trip_members?.map((m) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar_url,
            avatar_url: m.avatar_url,
            upi_id: m.upi_id,
            role: m.role,
          })) || [],
        }));
      }
    } catch (err) {
      console.warn('Supabase trips query fallback:', err);
    }
  }

  // User-scoped Local Storage fallback (Zero static mock data!)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(getUserStorageKey(userId, 'trips'));
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
        role: 'admin',
      },
    ],
  };

  if (isSupabaseConfigured() && userId) {
    try {
      const { data: tripInsert, error: tripError } = await supabase
        .from('trips')
        .insert({
          name: formattedTrip.name,
          image_url: formattedTrip.image_url,
          created_by: userId,
          creator_name: formattedTrip.creatorName,
          creator_upi: formattedTrip.creatorUpi,
          invite_token: inviteToken,
          daily_budget_limit: formattedTrip.daily_budget_limit,
          expense_budget_limit: formattedTrip.expense_budget_limit,
        })
        .select()
        .single();

      if (!tripError && tripInsert) {
        formattedTrip.id = tripInsert.id;

        // Add creator as first member
        await supabase.from('trip_members').insert({
          trip_id: tripInsert.id,
          user_id: userId,
          name: formattedTrip.creatorName,
          avatar_url: tripData.creatorAvatar || null,
          upi_id: formattedTrip.creatorUpi,
          role: 'admin',
        });
      }
    } catch (err) {
      console.warn('Supabase trip insert fallback:', err);
    }
  }

  // Update User-scoped Storage
  if (typeof window !== 'undefined' && userId) {
    const key = getUserStorageKey(userId, 'trips');
    const existing = localStorage.getItem(key);
    const parsed = existing ? JSON.parse(existing) : [];
    const updated = [formattedTrip, ...parsed];
    localStorage.setItem(key, JSON.stringify(updated));
  }

  return formattedTrip;
};

/**
 * Fetch expenses for a specific trip
 */
export const fetchTripExpenses = async (tripId, userId) => {
  if (!tripId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((e) => ({
          id: e.id,
          tripId: e.trip_id,
          title: e.title,
          amount: Number(e.amount),
          paidBy: e.paid_by,
          category: e.category,
          date: e.date || e.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase expenses query fallback:', err);
    }
  }

  if (typeof window !== 'undefined' && userId) {
    const saved = localStorage.getItem(getUserStorageKey(userId, `expenses_${tripId}`));
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
    category: expenseData.category || 'Food',
    date: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          trip_id: newExp.tripId,
          title: newExp.title,
          amount: newExp.amount,
          paid_by: newExp.paidBy,
          category: newExp.category,
        })
        .select()
        .single();

      if (!error && data) {
        newExp.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase expense insert fallback:', err);
    }
  }

  if (typeof window !== 'undefined' && userId) {
    const key = getUserStorageKey(userId, `expenses_${expenseData.tripId}`);
    const existing = localStorage.getItem(key);
    const parsed = existing ? JSON.parse(existing) : [];
    const updated = [newExp, ...parsed];
    localStorage.setItem(key, JSON.stringify(updated));
  }

  return newExp;
};

/**
 * Delete / settle an expense
 */
export const deleteExpenseInDb = async (expenseId, tripId, userId) => {
  if (isSupabaseConfigured() && userId) {
    try {
      await supabase.from('expenses').delete().eq('id', expenseId);
    } catch (err) {
      console.warn('Supabase delete expense error:', err);
    }
  }

  if (typeof window !== 'undefined' && userId && tripId) {
    const key = getUserStorageKey(userId, `expenses_${tripId}`);
    const existing = localStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      const filtered = parsed.filter((e) => String(e.id) !== String(expenseId));
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  }
};

/**
 * Add member to trip in DB and user cache
 */
export const addMemberInDb = async (tripId, memberObj, userId) => {
  if (isSupabaseConfigured() && userId) {
    try {
      await supabase.from('trip_members').insert({
        trip_id: tripId,
        name: memberObj.name,
        avatar_url: memberObj.avatar || null,
        upi_id: memberObj.upi_id || '',
        role: 'member',
      });
    } catch (err) {
      console.warn('Supabase add member error:', err);
    }
  }
};
