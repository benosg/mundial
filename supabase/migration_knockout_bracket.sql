-- Knockout bracket support for Mundial 2026

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

CREATE INDEX IF NOT EXISTS idx_knockout_phase   ON knockout_matches(phase, match_order);
CREATE INDEX IF NOT EXISTS idx_knockout_kickoff ON knockout_matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_bracket_player   ON bracket_predictions(player_id);
CREATE INDEX IF NOT EXISTS idx_bracket_match    ON bracket_predictions(match_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'knockout_matches_updated_at'
  ) THEN
    CREATE TRIGGER knockout_matches_updated_at
      BEFORE UPDATE ON knockout_matches
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'bracket_predictions_updated_at'
  ) THEN
    CREATE TRIGGER bracket_predictions_updated_at
      BEFORE UPDATE ON bracket_predictions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

INSERT INTO knockout_matches (id, phase, label, match_order, fifa_match_id, home_slot, away_slot, kickoff_at, venue, city)
VALUES
  ('73', '16avos', '16avos 1', 73, '400021518', '2A', '2B', '2026-06-28T19:00:00Z', 'Los Angeles Stadium', 'Los Angeles'),
  ('74', '16avos', '16avos 2', 74, '400021513', '1E', '3ABCDF', '2026-06-29T20:30:00Z', 'Boston Stadium', 'Boston'),
  ('75', '16avos', '16avos 3', 75, '400021522', '1F', '2C', '2026-06-30T01:00:00Z', 'Monterrey Stadium', 'Monterrey'),
  ('76', '16avos', '16avos 4', 76, '400021516', '1C', '2F', '2026-06-29T17:00:00Z', 'Houston Stadium', 'Houston'),
  ('77', '16avos', '16avos 5', 77, '400021523', '1I', '3CDFGH', '2026-06-30T21:00:00Z', 'New York/New Jersey Stadium', 'New Jersey'),
  ('78', '16avos', '16avos 6', 78, '400021514', '2E', '2I', '2026-06-30T17:00:00Z', 'Dallas Stadium', 'Dallas'),
  ('79', '16avos', '16avos 7', 79, '400021520', '1A', '3CEFHI', '2026-07-01T01:00:00Z', 'Mexico City Stadium', 'Mexico City'),
  ('80', '16avos', '16avos 8', 80, '400021512', '1L', '3EHIJK', '2026-07-01T16:00:00Z', 'Atlanta Stadium', 'Atlanta'),
  ('81', '16avos', '16avos 9', 81, '400021524', '1D', '3BEFIJ', '2026-07-02T00:00:00Z', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'),
  ('82', '16avos', '16avos 10', 82, '400021525', '1G', '3AEHIJ', '2026-07-01T20:00:00Z', 'Seattle Stadium', 'Seattle'),
  ('83', '16avos', '16avos 11', 83, '400021526', '2K', '2L', '2026-07-02T23:00:00Z', 'Toronto Stadium', 'Toronto'),
  ('84', '16avos', '16avos 12', 84, '400021519', '1H', '2J', '2026-07-02T19:00:00Z', 'Los Angeles Stadium', 'Los Angeles'),
  ('85', '16avos', '16avos 13', 85, '400021527', '1B', '3EFGIJ', '2026-07-03T03:00:00Z', 'BC Place Vancouver', 'Vancouver'),
  ('86', '16avos', '16avos 14', 86, '400021521', '1J', '2H', '2026-07-03T22:00:00Z', 'Miami Stadium', 'Miami'),
  ('87', '16avos', '16avos 15', 87, '400021517', '1K', '3DEIJL', '2026-07-04T01:30:00Z', 'Kansas City Stadium', 'Kansas City'),
  ('88', '16avos', '16avos 16', 88, '400021515', '2D', '2G', '2026-07-03T18:00:00Z', 'Dallas Stadium', 'Dallas'),
  ('89', '8vos', '8vos 1', 89, '400021533', 'W74', 'W77', '2026-07-04T21:00:00Z', 'Philadelphia Stadium', 'Philadelphia'),
  ('90', '8vos', '8vos 2', 90, '400021530', 'W73', 'W75', '2026-07-04T17:00:00Z', 'Houston Stadium', 'Houston'),
  ('91', '8vos', '8vos 3', 91, '400021532', 'W76', 'W78', '2026-07-05T20:00:00Z', 'New York/New Jersey Stadium', 'New Jersey'),
  ('92', '8vos', '8vos 4', 92, '400021531', 'W79', 'W80', '2026-07-06T00:00:00Z', 'Mexico City Stadium', 'Mexico City'),
  ('93', '8vos', '8vos 5', 93, '400021529', 'W83', 'W84', '2026-07-06T19:00:00Z', 'Dallas Stadium', 'Dallas'),
  ('94', '8vos', '8vos 6', 94, '400021534', 'W81', 'W82', '2026-07-07T00:00:00Z', 'Seattle Stadium', 'Seattle'),
  ('95', '8vos', '8vos 7', 95, '400021528', 'W86', 'W88', '2026-07-07T16:00:00Z', 'Atlanta Stadium', 'Atlanta'),
  ('96', '8vos', '8vos 8', 96, '400021535', 'W85', 'W87', '2026-07-07T20:00:00Z', 'BC Place Vancouver', 'Vancouver'),
  ('97', '4tos', '4tos 1', 97, '400021536', 'W89', 'W90', '2026-07-09T20:00:00Z', 'Boston Stadium', 'Boston'),
  ('98', '4tos', '4tos 2', 98, '400021538', 'W93', 'W94', '2026-07-10T19:00:00Z', 'Los Angeles Stadium', 'Los Angeles'),
  ('99', '4tos', '4tos 3', 99, '400021539', 'W91', 'W92', '2026-07-11T21:00:00Z', 'Miami Stadium', 'Miami'),
  ('100', '4tos', '4tos 4', 100, '400021537', 'W95', 'W96', '2026-07-12T01:00:00Z', 'Kansas City Stadium', 'Kansas City'),
  ('101', 'semis', 'Semi 1', 101, '400021541', 'W97', 'W98', '2026-07-14T19:00:00Z', 'Dallas Stadium', 'Dallas'),
  ('102', 'semis', 'Semi 2', 102, '400021540', 'W99', 'W100', '2026-07-15T19:00:00Z', 'Atlanta Stadium', 'Atlanta'),
  ('103', '3er/4to lugar', '3er y 4to lugar', 103, '400021542', 'RU101', 'RU102', '2026-07-18T21:00:00Z', 'Miami Stadium', 'Miami'),
  ('104', 'final', 'Final', 104, '400021543', 'W101', 'W102', '2026-07-19T19:00:00Z', 'New York/New Jersey Stadium', 'New Jersey')
ON CONFLICT (id) DO UPDATE SET
  phase = EXCLUDED.phase,
  label = EXCLUDED.label,
  match_order = EXCLUDED.match_order,
  fifa_match_id = EXCLUDED.fifa_match_id,
  home_slot = EXCLUDED.home_slot,
  away_slot = EXCLUDED.away_slot,
  kickoff_at = EXCLUDED.kickoff_at,
  venue = EXCLUDED.venue,
  city = EXCLUDED.city;
