-- Migration: Add missing columns to trip_members table
-- Date: 2026-09-11
-- Purpose: Fix data persistence issue - queries were selecting non-existent columns

-- Add missing columns to trip_members table
ALTER TABLE public.trip_members 
ADD COLUMN IF NOT EXISTS upi_number TEXT DEFAULT '';

ALTER TABLE public.trip_members 
ADD COLUMN IF NOT EXISTS parent_member_name TEXT DEFAULT NULL;

-- Verify the schema is now correct
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'trip_members' ORDER BY ordinal_position;
-- Ensure the expenses table carries the excluded_members column the UI writes to
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS excluded_members JSONB DEFAULT '[]'::jsonb;

-- NOTE: see fix_persistence.sql for the complete, fully-reconciled migration.
