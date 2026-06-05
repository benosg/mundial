-- =============================================================
-- Migration: Add Google Auth support
-- Run AFTER existing schema.sql in: Supabase Dashboard → SQL Editor
-- =============================================================
-- This migration adds auth_user_id and email columns to the players
-- table for Google OAuth login. Existing browser_key data is preserved.
-- =============================================================

-- Add auth_user_id column (nullable — existing anonymous players keep browser_key)
ALTER TABLE players ADD COLUMN IF NOT EXISTS auth_user_id text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

-- Add unique index on auth_user_id (nullable rows are excluded from uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_auth_user_unique ON players(auth_user_id) WHERE auth_user_id IS NOT NULL AND auth_user_id != '';

-- Add regular index for fast lookups
CREATE INDEX IF NOT EXISTS idx_players_auth_user ON players(auth_user_id);

-- Remove the UNIQUE constraint on browser_key to allow multiple rows with empty string
-- (authenticated users will have browser_key = '')
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_browser_key_key;
