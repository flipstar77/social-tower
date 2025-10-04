-- Add ALL Tower stats fields to capture complete analytics
-- This adds 50+ additional columns to store every stat from the game

-- Economic Data
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS interest_earned TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS gem_blocks_tapped TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS cells_earned TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS reroll_shards_earned TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_from_death_wave TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS cash_from_golden_tower TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_from_golden_tower TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_from_blackhole TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_from_spotlight TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_from_orbs TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_from_coin_upgrade TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_from_coin_bonuses TEXT;

-- Damage Taken Stats
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS damage_taken TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS damage_taken_wall TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS damage_taken_while_berserked TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS damage_gain_from_berserk TEXT;

-- Additional Damage Sources
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS rend_armor_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS death_ray_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS inner_land_mine_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS swamp_damage TEXT;

-- Combat Details
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS projectiles_count TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS lifesteal TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS orb_hits TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS land_mines_spawned TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS death_defy TEXT;

-- Enemy Types Breakdown
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS basic_enemies TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS fast_enemies TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS tank_enemies TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS ranged_enemies TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS boss_enemies TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS protector_enemies TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS total_elites TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS vampires TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS rays TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS scatters TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS saboteurs TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS commanders TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS overcharges TEXT;

-- Kill Method Breakdown
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS destroyed_by_orbs TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS destroyed_by_thorns TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS destroyed_by_death_ray TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS destroyed_by_land_mine TEXT;

-- Upgrades & Bonuses
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS recovery_packages TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS free_attack_upgrade TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS free_defense_upgrade TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS free_utility_upgrade TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS hp_from_death_wave TEXT;

-- Resources & Items
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS gems TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS medals TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS reroll_shards TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS cannon_shards TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS armor_shards TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS generator_shards TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS core_shards TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS common_modules TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS rare_modules TEXT;

-- Bot Stats
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS flame_bot_damage TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS thunder_bot_stuns TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS golden_bot_coins_earned TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS guardian_catches TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_fetched TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS coins_stolen TEXT;
ALTER TABLE tower_runs ADD COLUMN IF NOT EXISTS damage_misc TEXT;