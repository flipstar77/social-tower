-- Add detailed damage breakdown columns to tower_runs table
-- Captures ALL damage sources from game stats

ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS projectiles_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS rend_armor_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS thorn_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS orb_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS land_mine_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS death_ray_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS smart_missile_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS inner_land_mine_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS chain_lightning_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS death_wave_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS swamp_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS black_hole_damage TEXT;

-- Combat stats
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS projectiles_count TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS orb_hits TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS land_mines_spawned TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS lifesteal TEXT;

-- Flame bot damage (for completeness)
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS flame_bot_damage TEXT;

COMMENT ON COLUMN tower_runs.projectiles_damage IS 'Damage from projectiles (bullets)';
COMMENT ON COLUMN tower_runs.rend_armor_damage IS 'Damage from rend armor effect';
COMMENT ON COLUMN tower_runs.thorn_damage IS 'Damage from thorns';
COMMENT ON COLUMN tower_runs.orb_damage IS 'Damage from orbs';
COMMENT ON COLUMN tower_runs.land_mine_damage IS 'Damage from land mines';
COMMENT ON COLUMN tower_runs.death_ray_damage IS 'Damage from death ray';
COMMENT ON COLUMN tower_runs.smart_missile_damage IS 'Damage from smart missiles';
COMMENT ON COLUMN tower_runs.inner_land_mine_damage IS 'Damage from inner land mines';
COMMENT ON COLUMN tower_runs.chain_lightning_damage IS 'Damage from chain lightning';
COMMENT ON COLUMN tower_runs.death_wave_damage IS 'Damage from death wave';
COMMENT ON COLUMN tower_runs.swamp_damage IS 'Damage from swamp';
COMMENT ON COLUMN tower_runs.black_hole_damage IS 'Damage from black hole';
COMMENT ON COLUMN tower_runs.projectiles_count IS 'Total projectiles fired';
COMMENT ON COLUMN tower_runs.orb_hits IS 'Total orb hits';
COMMENT ON COLUMN tower_runs.land_mines_spawned IS 'Total land mines spawned';
COMMENT ON COLUMN tower_runs.lifesteal IS 'HP healed from lifesteal';
COMMENT ON COLUMN tower_runs.flame_bot_damage IS 'Damage from flame bot';
