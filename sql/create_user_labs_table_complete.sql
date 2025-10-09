-- Complete User Labs Table
-- Stores ALL lab levels for personalized recommendations
-- Uses JSON for flexibility with 100+ labs

CREATE TABLE IF NOT EXISTS user_labs (
    id BIGSERIAL PRIMARY KEY,
    discord_id TEXT NOT NULL UNIQUE REFERENCES users(discord_id) ON DELETE CASCADE,

    -- Lab levels stored as JSONB for flexibility
    -- Format: { "damage": 36, "crit_factor": 30, "attack_speed": 25, ... }
    labs JSONB DEFAULT '{}'::jsonb,

    -- Quick access to most important stats (denormalized for performance)
    damage_lab INTEGER DEFAULT 0,
    crit_factor_lab INTEGER DEFAULT 0,
    attack_speed_lab INTEGER DEFAULT 0,
    critical_chance_percent NUMERIC(5,2) DEFAULT 0,
    range_lab INTEGER DEFAULT 0,
    super_crit_multiplier_lab INTEGER DEFAULT 0,
    super_crit_chance_lab INTEGER DEFAULT 0,
    super_tower_lab INTEGER DEFAULT 0,
    health_lab INTEGER DEFAULT 0,

    -- Game Progress
    current_tier INTEGER DEFAULT 1,
    current_wave INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_labs_discord_id ON user_labs(discord_id);

-- GIN index for JSONB lab data (enables fast queries on any lab)
CREATE INDEX IF NOT EXISTS idx_user_labs_labs_gin ON user_labs USING GIN (labs);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_labs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_labs_updated_at_trigger ON user_labs;
CREATE TRIGGER user_labs_updated_at_trigger
    BEFORE UPDATE ON user_labs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_labs_timestamp();

-- Helper function to get a specific lab level
CREATE OR REPLACE FUNCTION get_lab_level(user_discord_id TEXT, lab_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    lab_level INTEGER;
BEGIN
    SELECT (labs->lab_name)::INTEGER INTO lab_level
    FROM user_labs
    WHERE discord_id = user_discord_id;

    RETURN COALESCE(lab_level, 0);
END;
$$ LANGUAGE plpgsql;

-- Helper function to update a specific lab level
CREATE OR REPLACE FUNCTION set_lab_level(user_discord_id TEXT, lab_name TEXT, new_level INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_labs
    SET labs = jsonb_set(labs, ARRAY[lab_name], to_jsonb(new_level))
    WHERE discord_id = user_discord_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_labs IS 'Stores user lab levels for personalized optimization recommendations';
COMMENT ON COLUMN user_labs.labs IS 'JSONB storage for all 100+ lab levels. Format: {"damage": 36, "crit_factor": 30, ...}';
COMMENT ON FUNCTION get_lab_level IS 'Helper to get a specific lab level: SELECT get_lab_level(''123456'', ''damage'')';
COMMENT ON FUNCTION set_lab_level IS 'Helper to set a specific lab level: SELECT set_lab_level(''123456'', ''damage'', 37)';
