-- User Labs Table
-- Stores user's current lab levels and workshop stats for personalized recommendations

CREATE TABLE IF NOT EXISTS user_labs (
    id BIGSERIAL PRIMARY KEY,
    discord_id TEXT NOT NULL UNIQUE REFERENCES users(discord_id) ON DELETE CASCADE,

    -- Lab Levels
    damage_lab INTEGER DEFAULT 0,
    crit_factor_lab INTEGER DEFAULT 0,
    crit_chance_percent NUMERIC(5,2) DEFAULT 0,
    supercrit_multiplier_lab INTEGER DEFAULT 0,
    supercrit_chance_lab INTEGER DEFAULT 0,
    super_tower_lab INTEGER DEFAULT 0,
    dpm_lab INTEGER DEFAULT 0,

    -- Workshop Levels (for enhancement calculations)
    damage_workshop INTEGER DEFAULT 0,
    crit_factor_workshop INTEGER DEFAULT 0,
    supercrit_multiplier_workshop INTEGER DEFAULT 0,
    supercrit_chance_workshop INTEGER DEFAULT 0,
    dpm_workshop INTEGER DEFAULT 0,

    -- Enhancement Factors
    damage_enhancement NUMERIC(4,2) DEFAULT 1.00,
    crit_factor_enhancement NUMERIC(4,2) DEFAULT 1.00,

    -- Game Progress
    current_tier INTEGER DEFAULT 1,
    current_wave INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by Discord ID
CREATE INDEX IF NOT EXISTS idx_user_labs_discord_id ON user_labs(discord_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_labs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on row update
DROP TRIGGER IF EXISTS user_labs_updated_at ON user_labs;
CREATE TRIGGER user_labs_updated_at
    BEFORE UPDATE ON user_labs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_labs_updated_at();

-- Grant permissions (adjust as needed for your setup)
-- ALTER TABLE user_labs ENABLE ROW LEVEL SECURITY;
