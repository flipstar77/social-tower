-- Supabase Schema for Tower Discord Bot
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - Discord users who can submit data
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discord_id TEXT UNIQUE NOT NULL,
    discord_username TEXT NOT NULL,
    discord_discriminator TEXT,
    is_linked BOOLEAN DEFAULT false,
    link_code TEXT,
    linked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dashboard integration
    dashboard_user_id UUID,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servers table - Discord servers where the bot is installed
CREATE TABLE servers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discord_server_id TEXT UNIQUE NOT NULL,
    server_name TEXT NOT NULL,
    owner_discord_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Server settings JSON
    settings JSONB DEFAULT '{
        "leaderboard_enabled": true,
        "competition_enabled": true,
        "auto_roles": false,
        "leaderboard_channel": null,
        "announcement_channel": null
    }'::jsonb
);

-- Tower runs table - All run submissions
CREATE TABLE tower_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discord_user_id TEXT NOT NULL,
    discord_server_id TEXT,

    -- Run data (all TEXT to handle large formatted numbers)
    tier TEXT NOT NULL,
    wave TEXT NOT NULL,
    damage_dealt TEXT,
    coins_earned TEXT,
    run_duration TEXT DEFAULT '0',

    -- Time data
    game_time TEXT,
    real_time TEXT,

    -- Death info
    killed_by TEXT,

    -- Currency data
    cash_earned TEXT,

    -- Damage breakdown
    projectiles_damage TEXT,
    orb_damage TEXT,
    death_wave_damage TEXT,
    black_hole_damage TEXT,
    chain_lightning_damage TEXT,
    land_mine_damage TEXT,
    smart_missile_damage TEXT,
    thorn_damage TEXT,

    -- Combat stats
    total_enemies TEXT,
    waves_skipped TEXT

    -- Metadata
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submission_source TEXT DEFAULT 'discord_bot', -- 'discord_bot', 'dashboard', 'api'
    raw_data JSONB, -- Store original submission for debugging

    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_by TEXT,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Link codes table - For linking Discord accounts to dashboard
CREATE TABLE link_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discord_id TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Competitions table - Server-specific competitions
CREATE TABLE competitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discord_server_id TEXT NOT NULL REFERENCES servers(discord_server_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by TEXT NOT NULL, -- Discord user ID
    is_active BOOLEAN DEFAULT true,

    -- Competition settings
    settings JSONB DEFAULT '{
        "min_tier": 1,
        "max_participants": 100,
        "prize_description": null,
        "rules": []
    }'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competition participants
CREATE TABLE competition_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    discord_user_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Best run during competition
    best_tier TEXT,
    best_wave TEXT,
    best_run_id UUID REFERENCES tower_runs(id),

    UNIQUE(competition_id, discord_user_id)
);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;

-- Public read access for leaderboards
CREATE POLICY "Public read access for users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Public read access for servers" ON servers
    FOR SELECT USING (true);

CREATE POLICY "Public read access for tower_runs" ON tower_runs
    FOR SELECT USING (true);

CREATE POLICY "Public read access for competitions" ON competitions
    FOR SELECT USING (true);

CREATE POLICY "Public read access for competition_participants" ON competition_participants
    FOR SELECT USING (true);

-- Insert policies (service role only)
CREATE POLICY "Service role can insert users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert servers" ON servers
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert tower_runs" ON tower_runs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert link_codes" ON link_codes
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Update/Delete policies (service role only)
CREATE POLICY "Service role can update all tables" ON users
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update all tables" ON servers
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update all tables" ON tower_runs
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update all tables" ON link_codes
    FOR UPDATE USING (auth.role() = 'service_role');

-- Functions for leaderboards
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
    ORDER BY tr.discord_user_id, tr.tier DESC, tr.wave DESC, tr.submitted_at DESC
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
    ORDER BY tr.discord_user_id, tr.tier DESC, tr.wave DESC, tr.submitted_at DESC
    LIMIT lim;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_runs_user ON tower_runs (discord_user_id);
CREATE INDEX idx_runs_server ON tower_runs (discord_server_id);
CREATE INDEX idx_runs_tier_wave ON tower_runs (tier DESC, wave DESC);
CREATE INDEX idx_runs_submitted_at ON tower_runs (submitted_at DESC);
CREATE INDEX idx_link_codes_code ON link_codes (code);
CREATE INDEX idx_link_codes_discord_id ON link_codes (discord_id);