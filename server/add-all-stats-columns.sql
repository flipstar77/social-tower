-- Add all the additional stats columns to tower_runs table
-- This expands the schema to store all parsed Tower stats

-- Time data
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS game_time TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS real_time TEXT;

-- Death info
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS killed_by TEXT;

-- Currency data
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS cash_earned TEXT;

-- Damage breakdown
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS projectiles_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS orb_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS death_wave_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS black_hole_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS chain_lightning_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS land_mine_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS smart_missile_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS thorn_damage TEXT;

-- Combat stats
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS total_enemies TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS waves_skipped TEXT;