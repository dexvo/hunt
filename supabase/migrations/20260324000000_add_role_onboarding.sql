-- Add role, onboarding tracking columns to profiles table
-- Run this in the Supabase SQL editor or via supabase db push

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 1;

-- Add constraint: role must be 'top' or 'bottom' (nullable for existing rows)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IS NULL OR role IN ('top', 'bottom'));
