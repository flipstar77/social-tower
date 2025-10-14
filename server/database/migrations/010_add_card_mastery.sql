-- Add card mastery columns to user_labs table
-- Card mastery levels range from 0-7

ALTER TABLE user_labs
ADD COLUMN IF NOT EXISTS damage_mastery INTEGER DEFAULT 0 CHECK (damage_mastery >= 0 AND damage_mastery <= 7);

ALTER TABLE user_labs
ADD COLUMN IF NOT EXISTS attack_speed_mastery INTEGER DEFAULT 0 CHECK (attack_speed_mastery >= 0 AND attack_speed_mastery <= 7);

ALTER TABLE user_labs
ADD COLUMN IF NOT EXISTS critical_chance_mastery INTEGER DEFAULT 0 CHECK (critical_chance_mastery >= 0 AND critical_chance_mastery <= 7);

ALTER TABLE user_labs
ADD COLUMN IF NOT EXISTS range_mastery INTEGER DEFAULT 0 CHECK (range_mastery >= 0 AND range_mastery <= 7);

ALTER TABLE user_labs
ADD COLUMN IF NOT EXISTS super_tower_mastery INTEGER DEFAULT 0 CHECK (super_tower_mastery >= 0 AND super_tower_mastery <= 7);

ALTER TABLE user_labs
ADD COLUMN IF NOT EXISTS ultimate_crit_mastery INTEGER DEFAULT 0 CHECK (ultimate_crit_mastery >= 0 AND ultimate_crit_mastery <= 7);

ALTER TABLE user_labs
ADD COLUMN IF NOT EXISTS demon_mode_mastery INTEGER DEFAULT 0 CHECK (demon_mode_mastery >= 0 AND demon_mode_mastery <= 7);

-- Add comment for documentation
COMMENT ON COLUMN user_labs.damage_mastery IS 'Damage card mastery level (0-7)';
COMMENT ON COLUMN user_labs.attack_speed_mastery IS 'Attack Speed card mastery level (0-7)';
COMMENT ON COLUMN user_labs.critical_chance_mastery IS 'Critical Chance card mastery level (0-7)';
COMMENT ON COLUMN user_labs.range_mastery IS 'Range card mastery level (0-7)';
COMMENT ON COLUMN user_labs.super_tower_mastery IS 'Super Tower card mastery level (0-7)';
COMMENT ON COLUMN user_labs.ultimate_crit_mastery IS 'Ultimate Crit card mastery level (0-7)';
COMMENT ON COLUMN user_labs.demon_mode_mastery IS 'Demon Mode card mastery level (0-7)';
