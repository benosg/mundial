-- ============================================================
-- Reset player state for testing first-login flow
-- Scoped by email and/or auth_user_id to avoid wiping everything.
-- ============================================================

-- OPTION 1: Reset by email
-- Uncomment and replace with the actual email:
-- UPDATE players
-- SET favorite_team = '',
--     favorite_flag = '',
--     name = ''
-- WHERE email = 'user@example.com';

-- OPTION 2: Reset by auth_user_id (Supabase UUID)
-- Uncomment and replace with the actual auth_user_id:
-- UPDATE players
-- SET favorite_team = '',
--     favorite_flag = '',
--     name = ''
-- WHERE auth_user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- OPTION 3: Reset ALL players (DANGEROUS - for dev/test only)
-- Uncomment to run:
-- UPDATE players
-- SET favorite_team = '',
--     favorite_flag = '',
--     name = '';

-- Verify changes
-- SELECT id, auth_user_id, email, name, favorite_team, favorite_flag
-- FROM players
-- WHERE email = 'user@example.com' OR auth_user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
