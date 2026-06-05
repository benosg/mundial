-- =============================================================
-- Mundial 2026 Pronósticos — Seed Data
-- Run AFTER schema.sql in: Supabase Dashboard → SQL Editor
-- =============================================================

INSERT INTO matches (id, "group", home, home_flag, away, away_flag, kickoff_chile, venue, city, broadcasters)
VALUES
  -- Group A
  ('A1', 'A', 'México',        '🇲🇽', 'Sudáfrica',           '🇿🇦', '11 jun · 15:00', 'Mexico City Stadium',              'Ciudad de México',  ARRAY['DSPORTS','DGO']),
  ('A2', 'A', 'Corea del Sur', '🇰🇷', 'Chequia',             '🇨🇿', '11 jun · 22:00', 'Guadalajara Stadium',              'Guadalajara',       ARRAY['DSPORTS','DGO']),
  ('A3', 'A', 'Chequia',       '🇨🇿', 'Sudáfrica',           '🇿🇦', '18 jun · 12:00', 'Atlanta Stadium',                  'Atlanta',           ARRAY['DSPORTS','DGO']),
  ('A4', 'A', 'México',        '🇲🇽', 'Corea del Sur',       '🇰🇷', '18 jun · 21:00', 'Guadalajara Stadium',              'Guadalajara',       ARRAY['DSPORTS','DGO']),
  ('A5', 'A', 'Chequia',       '🇨🇿', 'México',              '🇲🇽', '24 jun · 21:00', 'Mexico City Stadium',              'Ciudad de México',  ARRAY['DSPORTS','DGO']),
  ('A6', 'A', 'Sudáfrica',     '🇿🇦', 'Corea del Sur',       '🇰🇷', '24 jun · 21:00', 'Monterrey Stadium',                'Monterrey',         ARRAY['DSPORTS','DGO']),

  -- Group B
  ('B1', 'B', 'Canadá',                '🇨🇦', 'Bosnia y Herzegovina', '🇧🇦', '12 jun · 15:00', 'Toronto Stadium',                 'Toronto',           ARRAY['DSPORTS','DGO']),
  ('B2', 'B', 'Qatar',                 '🇶🇦', 'Suiza',                '🇨🇭', '13 jun · 15:00', 'San Francisco Bay Area Stadium',  'San Francisco Bay Area', ARRAY['DSPORTS','DGO']),
  ('B3', 'B', 'Suiza',                 '🇨🇭', 'Bosnia y Herzegovina', '🇧🇦', '18 jun · 15:00', 'Los Angeles Stadium',             'Los Ángeles',       ARRAY['DSPORTS','DGO']),
  ('B4', 'B', 'Canadá',                '🇨🇦', 'Qatar',                '🇶🇦', '18 jun · 18:00', 'BC Place Vancouver',              'Vancouver',         ARRAY['DSPORTS','DGO']),
  ('B5', 'B', 'Suiza',                 '🇨🇭', 'Canadá',               '🇨🇦', '24 jun · 15:00', 'BC Place Vancouver',              'Vancouver',         ARRAY['DSPORTS','DGO']),
  ('B6', 'B', 'Bosnia y Herzegovina',  '🇧🇦', 'Qatar',                '🇶🇦', '24 jun · 15:00', 'Seattle Stadium',                 'Seattle',           ARRAY['DSPORTS','DGO']),

  -- Group C
  ('C1', 'C', 'Brasil',     '🇧🇷', 'Marruecos',  '🇲🇦', '13 jun · 18:00', 'New York/New Jersey Stadium', 'New Jersey',    ARRAY['DSPORTS','DGO']),
  ('C2', 'C', 'Haití',      '🇭🇹', 'Escocia',    '🏴', '13 jun · 21:00', 'Boston Stadium',              'Boston',        ARRAY['DSPORTS','DGO']),
  ('C3', 'C', 'Escocia',    '🏴', 'Marruecos',   '🇲🇦', '19 jun · 18:00', 'Boston Stadium',              'Boston',        ARRAY['DSPORTS','DGO']),
  ('C4', 'C', 'Brasil',     '🇧🇷', 'Haití',       '🇭🇹', '19 jun · 20:30', 'Philadelphia Stadium',        'Filadelfia',    ARRAY['DSPORTS','DGO']),
  ('C5', 'C', 'Escocia',    '🏴', 'Brasil',       '🇧🇷', '24 jun · 18:00', 'Miami Stadium',               'Miami',         ARRAY['DSPORTS','DGO']),
  ('C6', 'C', 'Marruecos',  '🇲🇦', 'Haití',       '🇭🇹', '24 jun · 18:00', 'Atlanta Stadium',             'Atlanta',       ARRAY['DSPORTS','DGO']),

  -- Group D
  ('D1', 'D', 'USA',       '🇺🇸', 'Paraguay',   '🇵🇾', '12 jun · 21:00', 'Los Angeles Stadium',             'Los Ángeles',           ARRAY['DSPORTS','DGO']),
  ('D2', 'D', 'Australia', '🇦🇺', 'Turquía',    '🇹🇷', '14 jun · 00:00', 'BC Place Vancouver',              'Vancouver',             ARRAY['DSPORTS','DGO']),
  ('D3', 'D', 'USA',       '🇺🇸', 'Australia',  '🇦🇺', '19 jun · 15:00', 'Seattle Stadium',                 'Seattle',               ARRAY['DSPORTS','DGO']),
  ('D4', 'D', 'Turquía',   '🇹🇷', 'Paraguay',   '🇵🇾', '19 jun · 23:00', 'San Francisco Bay Area Stadium',  'San Francisco Bay Area', ARRAY['DSPORTS','DGO']),
  ('D5', 'D', 'Turquía',   '🇹🇷', 'USA',        '🇺🇸', '25 jun · 22:00', 'Los Angeles Stadium',             'Los Ángeles',           ARRAY['DSPORTS','DGO']),
  ('D6', 'D', 'Paraguay',  '🇵🇾', 'Australia',  '🇦🇺', '25 jun · 22:00', 'San Francisco Bay Area Stadium',  'San Francisco Bay Area', ARRAY['DSPORTS','DGO']),

  -- Group E
  ('E1', 'E', 'Alemania',        '🇩🇪', 'Curazao',       '🇨🇼', '14 jun · 13:00', 'Houston Stadium',                 'Houston',             ARRAY['DSPORTS','DGO']),
  ('E2', 'E', 'Costa de Marfil', '🇨🇮', 'Ecuador',       '🇪🇨', '14 jun · 19:00', 'Philadelphia Stadium',            'Filadelfia',         ARRAY['DSPORTS','DGO']),
  ('E3', 'E', 'Alemania',        '🇩🇪', 'Costa de Marfil','🇨🇮', '20 jun · 16:00', 'Toronto Stadium',                 'Toronto',            ARRAY['DSPORTS','DGO']),
  ('E4', 'E', 'Ecuador',         '🇪🇨', 'Curazao',       '🇨🇼', '20 jun · 20:00', 'Kansas City Stadium',             'Kansas City',        ARRAY['DSPORTS','DGO']),
  ('E5', 'E', 'Curazao',         '🇨🇼', 'Costa de Marfil','🇨🇮', '25 jun · 16:00', 'Philadelphia Stadium',            'Filadelfia',         ARRAY['DSPORTS','DGO']),
  ('E6', 'E', 'Ecuador',         '🇪🇨', 'Alemania',      '🇩🇪', '25 jun · 16:00', 'New York/New Jersey Stadium',     'New Jersey',         ARRAY['DSPORTS','DGO']),

  -- Group F
  ('F1', 'F', 'Países Bajos', '🇳🇱', 'Japón',  '🇯🇵', '14 jun · 16:00', 'Dallas Stadium',                  'Dallas',              ARRAY['DSPORTS','DGO']),
  ('F2', 'F', 'Suecia',       '🇸🇪', 'Túnez',  '🇹🇳', '14 jun · 22:00', 'Monterrey Stadium',               'Monterrey',          ARRAY['DSPORTS','DGO']),
  ('F3', 'F', 'Países Bajos', '🇳🇱', 'Suecia',  '🇸🇪', '20 jun · 13:00', 'Houston Stadium',                 'Houston',            ARRAY['DSPORTS','DGO']),
  ('F4', 'F', 'Túnez',        '🇹🇳', 'Japón',   '🇯🇵', '21 jun · 00:00', 'Monterrey Stadium',               'Monterrey',          ARRAY['DSPORTS','DGO']),
  ('F5', 'F', 'Japón',        '🇯🇵', 'Suecia',  '🇸🇪', '25 jun · 19:00', 'Dallas Stadium',                  'Dallas',             ARRAY['DSPORTS','DGO']),
  ('F6', 'F', 'Túnez',        '🇹🇳', 'Países Bajos','🇳🇱', '25 jun · 19:00', 'Kansas City Stadium',         'Kansas City',        ARRAY['DSPORTS','DGO']),

  -- Group G
  ('G1', 'G', 'Bélgica',        '🇧🇪', 'Egipto',         '🇪🇬', '15 jun · 15:00', 'Seattle Stadium',                 'Seattle',            ARRAY['DSPORTS','DGO']),
  ('G2', 'G', 'Irán',           '🇮🇷', 'Nueva Zelanda',  '🇳🇿', '15 jun · 21:00', 'Los Angeles Stadium',             'Los Ángeles',        ARRAY['DSPORTS','DGO']),
  ('G3', 'G', 'Bélgica',        '🇧🇪', 'Irán',           '🇮🇷', '21 jun · 15:00', 'Los Angeles Stadium',             'Los Ángeles',        ARRAY['DSPORTS','DGO']),
  ('G4', 'G', 'Nueva Zelanda',  '🇳🇿', 'Egipto',         '🇪🇬', '21 jun · 21:00', 'BC Place Vancouver',              'Vancouver',          ARRAY['DSPORTS','DGO']),
  ('G5', 'G', 'Egipto',         '🇪🇬', 'Irán',           '🇮🇷', '26 jun · 23:00', 'Seattle Stadium',                 'Seattle',            ARRAY['DSPORTS','DGO']),
  ('G6', 'G', 'Nueva Zelanda',  '🇳🇿', 'Bélgica',        '🇧🇪', '26 jun · 23:00', 'BC Place Vancouver',              'Vancouver',          ARRAY['DSPORTS','DGO']),

  -- Group H
  ('H1', 'H', 'España',          '🇪🇸', 'Cabo Verde',      '🇨🇻', '15 jun · 12:00', 'Atlanta Stadium',                 'Atlanta',            ARRAY['DSPORTS','DGO']),
  ('H2', 'H', 'Arabia Saudita',  '🇸🇦', 'Uruguay',         '🇺🇾', '15 jun · 18:00', 'Miami Stadium',                   'Miami',              ARRAY['DSPORTS','DGO']),
  ('H3', 'H', 'España',          '🇪🇸', 'Arabia Saudita',  '🇸🇦', '21 jun · 12:00', 'Atlanta Stadium',                 'Atlanta',            ARRAY['DSPORTS','DGO']),
  ('H4', 'H', 'Uruguay',         '🇺🇾', 'Cabo Verde',      '🇨🇻', '21 jun · 18:00', 'Miami Stadium',                   'Miami',              ARRAY['DSPORTS','DGO']),
  ('H5', 'H', 'Cabo Verde',      '🇨🇻', 'Arabia Saudita',  '🇸🇦', '26 jun · 20:00', 'Houston Stadium',                 'Houston',            ARRAY['DSPORTS','DGO']),
  ('H6', 'H', 'Uruguay',         '🇺🇾', 'España',          '🇪🇸', '26 jun · 20:00', 'Guadalajara Stadium',             'Guadalajara',        ARRAY['DSPORTS','DGO']),

  -- Group I
  ('I1', 'I', 'Francia',  '🇫🇷', 'Senegal', '🇸🇳', '16 jun · 15:00', 'New York/New Jersey Stadium', 'New Jersey',    ARRAY['DSPORTS','DGO']),
  ('I2', 'I', 'Irak',     '🇮🇶', 'Noruega', '🇳🇴', '16 jun · 18:00', 'Boston Stadium',              'Boston',        ARRAY['DSPORTS','DGO']),
  ('I3', 'I', 'Francia',  '🇫🇷', 'Irak',    '🇮🇶', '22 jun · 17:00', 'Philadelphia Stadium',        'Filadelfia',    ARRAY['DSPORTS','DGO']),
  ('I4', 'I', 'Noruega',  '🇳🇴', 'Senegal', '🇸🇳', '22 jun · 20:00', 'New York/New Jersey Stadium', 'New Jersey',    ARRAY['DSPORTS','DGO']),
  ('I5', 'I', 'Noruega',  '🇳🇴', 'Francia', '🇫🇷', '26 jun · 15:00', 'Boston Stadium',              'Boston',        ARRAY['DSPORTS','DGO']),
  ('I6', 'I', 'Senegal',  '🇸🇳', 'Irak',    '🇮🇶', '26 jun · 15:00', 'Toronto Stadium',             'Toronto',       ARRAY['DSPORTS','DGO']),

  -- Group J
  ('J1', 'J', 'Argentina', '🇦🇷', 'Argelia',  '🇩🇿', '16 jun · 21:00', 'Kansas City Stadium',             'Kansas City',        ARRAY['DSPORTS','DGO']),
  ('J2', 'J', 'Austria',   '🇦🇹', 'Jordania', '🇯🇴', '17 jun · 00:00', 'San Francisco Bay Area Stadium',  'San Francisco Bay Area', ARRAY['DSPORTS','DGO']),
  ('J3', 'J', 'Argentina', '🇦🇷', 'Austria',  '🇦🇹', '22 jun · 13:00', 'Dallas Stadium',                  'Dallas',              ARRAY['DSPORTS','DGO']),
  ('J4', 'J', 'Jordania',  '🇯🇴', 'Argelia',  '🇩🇿', '22 jun · 23:00', 'San Francisco Bay Area Stadium',  'San Francisco Bay Area', ARRAY['DSPORTS','DGO']),
  ('J5', 'J', 'Argelia',   '🇩🇿', 'Austria',  '🇦🇹', '27 jun · 22:00', 'Kansas City Stadium',             'Kansas City',        ARRAY['DSPORTS','DGO']),
  ('J6', 'J', 'Jordania',  '🇯🇴', 'Argentina','🇦🇷', '27 jun · 22:00', 'Dallas Stadium',                  'Dallas',             ARRAY['DSPORTS','DGO']),

  -- Group K
  ('K1', 'K', 'Portugal',    '🇵🇹', 'Congo DR',  '🇨🇩', '17 jun · 13:00', 'Houston Stadium',                 'Houston',            ARRAY['DSPORTS','DGO']),
  ('K2', 'K', 'Uzbekistán',  '🇺🇿', 'Colombia',  '🇨🇴', '17 jun · 22:00', 'Mexico City Stadium',             'Ciudad de México',   ARRAY['DSPORTS','DGO']),
  ('K3', 'K', 'Portugal',    '🇵🇹', 'Uzbekistán','🇺🇿', '23 jun · 13:00', 'Houston Stadium',                 'Houston',            ARRAY['DSPORTS','DGO']),
  ('K4', 'K', 'Colombia',    '🇨🇴', 'Congo DR',  '🇨🇩', '23 jun · 22:00', 'Guadalajara Stadium',             'Guadalajara',        ARRAY['DSPORTS','DGO']),
  ('K5', 'K', 'Colombia',    '🇨🇴', 'Portugal',  '🇵🇹', '27 jun · 19:30', 'Miami Stadium',                   'Miami',              ARRAY['DSPORTS','DGO']),
  ('K6', 'K', 'Congo DR',    '🇨🇩', 'Uzbekistán','🇺🇿', '27 jun · 19:30', 'Atlanta Stadium',                 'Atlanta',            ARRAY['DSPORTS','DGO']),

  -- Group L
  ('L1', 'L', 'Inglaterra', '🏴', 'Croacia', '🇭🇷', '17 jun · 16:00', 'Dallas Stadium',                  'Dallas',             ARRAY['DSPORTS','DGO']),
  ('L2', 'L', 'Ghana',      '🇬🇭', 'Panamá',  '🇵🇦', '17 jun · 19:00', 'Toronto Stadium',                 'Toronto',            ARRAY['DSPORTS','DGO']),
  ('L3', 'L', 'Inglaterra', '🏴', 'Ghana',    '🇬🇭', '23 jun · 16:00', 'Boston Stadium',                  'Boston',             ARRAY['DSPORTS','DGO']),
  ('L4', 'L', 'Panamá',     '🇵🇦', 'Croacia',  '🇭🇷', '23 jun · 19:00', 'Toronto Stadium',                 'Toronto',            ARRAY['DSPORTS','DGO']),
  ('L5', 'L', 'Panamá',     '🇵🇦', 'Inglaterra','🏴', '27 jun · 17:00', 'New York/New Jersey Stadium',     'New Jersey',         ARRAY['DSPORTS','DGO']),
  ('L6', 'L', 'Croacia',    '🇭🇷', 'Ghana',    '🇬🇭', '27 jun · 17:00', 'Philadelphia Stadium',            'Filadelfia',         ARRAY['DSPORTS','DGO'])
ON CONFLICT (id) DO NOTHING;
