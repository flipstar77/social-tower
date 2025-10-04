-- Fix database schema to store ALL numeric fields as TEXT instead of INTEGER/BIGINT
-- This prevents issues with large numbers in Tower that can exceed integer limits
-- Numbers like "10,38D", "217,87T", wave 11289, etc.

-- Convert all numeric run data fields to TEXT
ALTER TABLE tower_runs ALTER COLUMN tier TYPE TEXT;
ALTER TABLE tower_runs ALTER COLUMN wave TYPE TEXT;
ALTER TABLE tower_runs ALTER COLUMN damage_dealt TYPE TEXT;
ALTER TABLE tower_runs ALTER COLUMN coins_earned TYPE TEXT;
ALTER TABLE tower_runs ALTER COLUMN run_duration TYPE TEXT;

-- Set default values as strings
ALTER TABLE tower_runs ALTER COLUMN run_duration SET DEFAULT '0';

-- Drop research_spent column since it's not in the game data
ALTER TABLE tower_runs DROP COLUMN IF EXISTS research_spent;

-- Update competition participants table
ALTER TABLE competition_participants ALTER COLUMN best_tier TYPE TEXT;
ALTER TABLE competition_participants ALTER COLUMN best_wave TYPE TEXT;

-- Drop existing functions before recreating with new return types
DROP FUNCTION IF EXISTS get_server_leaderboard(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_global_leaderboard(INTEGER);

-- Update the leaderboard functions to work with TEXT columns
CREATE OR REPLACE FUNCTION get_server_leaderboard(server_id TEXT, lim INTEGER DEFAULT 10)
RETURNS TABLE (
    discord_username TEXT,
    tier TEXT,
    wave TEXT,
    damage_dealt TEXT,
    coins_earned TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (tr.discord_user_id)
        u.discord_username,
        tr.tier,
        tr.wave,
        tr.damage_dealt,
        tr.coins_earned,
        tr.submitted_at
    FROM tower_runs tr
    JOIN users u ON tr.discord_user_id = u.discord_id
    WHERE tr.discord_server_id = server_id
    ORDER BY tr.discord_user_id, tr.submitted_at DESC
    LIMIT lim;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_global_leaderboard(lim INTEGER DEFAULT 10)
RETURNS TABLE (
    discord_username TEXT,
    tier TEXT,
    wave TEXT,
    damage_dealt TEXT,
    coins_earned TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (tr.discord_user_id)
        u.discord_username,
        tr.tier,
        tr.wave,
        tr.damage_dealt,
        tr.coins_earned,
        tr.submitted_at
    FROM tower_runs tr
    JOIN users u ON tr.discord_user_id = u.discord_id
    ORDER BY tr.discord_user_id, tr.submitted_at DESC
    LIMIT lim;
END;
$$ LANGUAGE plpgsql;