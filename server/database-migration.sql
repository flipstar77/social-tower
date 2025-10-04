-- Migration to handle unlimited large numbers in Tower runs
-- Change damage_dealt and coins_earned from BIGINT to TEXT to store formatted strings

-- Add new TEXT columns
ALTER TABLE tower_runs
ADD COLUMN damage_dealt_text TEXT,
ADD COLUMN coins_earned_text TEXT;

-- Copy existing data to new columns (convert back to original format if needed)
UPDATE tower_runs
SET damage_dealt_text = CASE
    WHEN damage_dealt IS NOT NULL THEN damage_dealt::TEXT
    ELSE NULL
END,
coins_earned_text = CASE
    WHEN coins_earned IS NOT NULL THEN coins_earned::TEXT
    ELSE NULL
END;

-- Drop old BIGINT columns
ALTER TABLE tower_runs
DROP COLUMN damage_dealt,
DROP COLUMN coins_earned;

-- Rename new columns to original names
ALTER TABLE tower_runs
RENAME COLUMN damage_dealt_text TO damage_dealt,
RENAME COLUMN coins_earned_text TO coins_earned;

-- Update the leaderboard functions to handle text sorting by parsing numeric values
DROP FUNCTION IF EXISTS get_server_leaderboard(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_global_leaderboard(INTEGER);

-- New leaderboard function that handles text-based damage values
CREATE OR REPLACE FUNCTION get_server_leaderboard(server_id TEXT, lim INTEGER DEFAULT 10)
RETURNS TABLE (
    discord_username TEXT,
    tier INTEGER,
    wave INTEGER,
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
    ORDER BY tr.discord_user_id, tr.tier DESC, tr.wave DESC, tr.submitted_at DESC
    LIMIT lim;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_global_leaderboard(lim INTEGER DEFAULT 10)
RETURNS TABLE (
    discord_username TEXT,
    tier INTEGER,
    wave INTEGER,
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
    ORDER BY tr.discord_user_id, tr.tier DESC, tr.wave DESC, tr.submitted_at DESC
    LIMIT lim;
END;
$$ LANGUAGE plpgsql;