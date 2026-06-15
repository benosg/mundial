-- =============================================================
-- Mundial 2026 Pronósticos — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================================

-- Players: authenticated users or anonymous browser-key flow.
-- Identified by auth_user_id (Google login) or browser_key (legacy).
CREATE TABLE IF NOT EXISTS players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  text UNIQUE,
  email         text NOT NULL DEFAULT '',
  name          text NOT NULL DEFAULT '',
  favorite_team text NOT NULL DEFAULT '',
  favorite_flag text NOT NULL DEFAULT '',
  browser_key   text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Matches: World Cup 2026 group-stage fixtures.
-- Match IDs (e.g. 'A1', 'B3') are stable keys shared with the frontend.
CREATE TABLE IF NOT EXISTS matches (
  id            text PRIMARY KEY,
  "group"       text NOT NULL,
  home          text NOT NULL,
  home_flag     text NOT NULL DEFAULT '',
  away          text NOT NULL,
  away_flag     text NOT NULL DEFAULT '',
  kickoff_chile text NOT NULL DEFAULT '',
  venue         text NOT NULL DEFAULT '',
  city          text NOT NULL DEFAULT '',
  broadcasters  text[] NOT NULL DEFAULT '{}',
  home_result   smallint,
  away_result   smallint,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Predictions: one row per player per match.
-- Upserted on save (ON CONFLICT on player_id + match_id).
CREATE TABLE IF NOT EXISTS predictions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id      text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score    smallint NOT NULL DEFAULT 0,
  away_score    smallint NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, match_id)
);

-- Knockout matches: additive bracket domain kept separate from group-stage tables.
CREATE TABLE IF NOT EXISTS knockout_matches (
  id                text PRIMARY KEY,
  phase             text NOT NULL,
  label             text NOT NULL,
  match_order       integer NOT NULL,
  fifa_match_id     text NOT NULL DEFAULT '',
  home_slot         text NOT NULL,
  away_slot         text NOT NULL,
  home_team         text NOT NULL DEFAULT '',
  away_team         text NOT NULL DEFAULT '',
  kickoff_at        timestamptz NOT NULL,
  venue             text NOT NULL DEFAULT '',
  city              text NOT NULL DEFAULT '',
  home_result       smallint,
  away_result       smallint,
  penalties_winner  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knockout_penalties_winner_check CHECK (penalties_winner IN ('home', 'away') OR penalties_winner IS NULL)
);

-- Bracket predictions: one row per player and knockout match.
CREATE TABLE IF NOT EXISTS bracket_predictions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id          text NOT NULL REFERENCES knockout_matches(id) ON DELETE CASCADE,
  home_score        smallint NOT NULL DEFAULT 0,
  away_score        smallint NOT NULL DEFAULT 0,
  penalties_winner  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, match_id),
  CONSTRAINT bracket_penalties_winner_check CHECK (penalties_winner IN ('home', 'away') OR penalties_winner IS NULL)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_predictions_player ON predictions(player_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match  ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_group      ON matches("group");
CREATE INDEX IF NOT EXISTS idx_knockout_phase     ON knockout_matches(phase, match_order);
CREATE INDEX IF NOT EXISTS idx_knockout_kickoff   ON knockout_matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_bracket_player     ON bracket_predictions(player_id);
CREATE INDEX IF NOT EXISTS idx_bracket_match      ON bracket_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_players_browser    ON players(browser_key);
CREATE INDEX IF NOT EXISTS idx_players_auth_user  ON players(auth_user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER knockout_matches_updated_at
  BEFORE UPDATE ON knockout_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bracket_predictions_updated_at
  BEFORE UPDATE ON bracket_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- RLS policies (optional — enable if you add anon key restrictions)
-- =============================================================
-- ALTER TABLE players      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matches      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions  ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Allow all" ON players      FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all" ON matches      FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all" ON predictions  FOR ALL USING (true) WITH CHECK (true);
