-- =============================================================
-- Add is_admin column to players table
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================================

ALTER TABLE players
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Optional: Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_players_is_admin ON players(is_admin);

-- =============================================================
-- Example: Make a specific player admin (replace with actual ID)
-- UPDATE players SET is_admin = true WHERE id = 'your-player-uuid-here';
-- =============================================================