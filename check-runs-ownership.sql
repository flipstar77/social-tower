-- Check what discord_user_id values exist in tower_runs table
-- Run this in Supabase SQL Editor to see which users own which runs

-- Count runs per user
SELECT
    discord_user_id,
    COUNT(*) as run_count,
    MAX(submitted_at) as latest_run,
    MIN(submitted_at) as oldest_run
FROM tower_runs
GROUP BY discord_user_id
ORDER BY run_count DESC;

-- Show detailed info for all runs
SELECT
    id,
    discord_user_id,
    tier,
    wave,
    submitted_at,
    submission_source
FROM tower_runs
ORDER BY submitted_at DESC
LIMIT 20;

-- Check if there are any runs with NULL discord_user_id
SELECT COUNT(*) as null_user_runs
FROM tower_runs
WHERE discord_user_id IS NULL;
