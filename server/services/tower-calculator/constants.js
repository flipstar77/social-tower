/**
 * Constants for Tower Calculator
 * Based on TheTowerofTobi spreadsheet formulas
 */

// Lab names mapping (used in database and UI)
const LAB_NAMES = {
  // Damage Labs
  DAMAGE: 'damage',
  ATTACK_SPEED: 'attack-speed',
  CRITICAL_FACTOR: 'critical-factor',
  RANGE: 'range',
  DAMAGE_PER_METER: 'damage-per-meter',
  SUPER_CRIT_CHANCE: 'super-crit-chance',
  SUPER_CRIT_MULTI: 'super-crit-multi',
  MAX_REND_ARMOR: 'max-rend-armor-multiplier',
  LIGHT_SPEED_SHOTS: 'light-speed-shots',

  // Health Labs
  HEALTH: 'health',
  HEALTH_REGEN: 'health-regen',
  DEFENSE_ABSOLUTE: 'defense-absolute',
  DEFENSE_PERCENT: 'defense-percent',

  // Economy Labs
  CASH_BONUS: 'cash-bonus',
  CASH_PER_WAVE: 'cash-per-wave',
  COINS_PER_KILL: 'coins-per-kill-bonus',
  COINS_PER_WAVE: 'coins-per-wave',
  INTEREST: 'interest',
  MAX_INTEREST: 'max-interest',

  // Special Labs
  SUPER_TOWER_BONUS: 'super-tower-bonus',
  GOLDEN_TOWER_BONUS: 'golden-tower-bonus',
  GOLDEN_TOWER_DURATION: 'golden-tower-duration',

  // Utility
  ORBS_SPEED: 'orbs-speed',
  LAND_MINE_DAMAGE: 'land-mine-damage',
  WALL_HEALTH: 'wall-health'
};

// Card Mastery types (0-7 levels each)
const CARD_MASTERY = {
  DAMAGE: 'damage_mastery',
  ATTACK_SPEED: 'attack_speed_mastery',
  CRITICAL_CHANCE: 'critical_chance_mastery',
  RANGE: 'range_mastery',
  SUPER_TOWER: 'super_tower_mastery',
  ULTIMATE_CRIT: 'ultimate_crit_mastery',
  DEMON_MODE: 'demon_mode_mastery'
};

// Card mastery multipliers (per level)
const CARD_MASTERY_MULTIPLIERS = {
  [CARD_MASTERY.DAMAGE]: 0.02, // 2% per level
  [CARD_MASTERY.ATTACK_SPEED]: 0.01, // 1% per level
  [CARD_MASTERY.CRITICAL_CHANCE]: 0.01, // 1% per level
  [CARD_MASTERY.RANGE]: 0.01, // 1% per level
  [CARD_MASTERY.SUPER_TOWER]: 0.02, // 2% per level
  [CARD_MASTERY.ULTIMATE_CRIT]: 0.05, // 5% per level
  [CARD_MASTERY.DEMON_MODE]: 0.05 // 5% per level
};

// Base lab growth rates (approximate from spreadsheet)
// These will be refined once we parse the full Lab_Researches data
const LAB_BASE_MULTIPLIER = {
  [LAB_NAMES.DAMAGE]: 1.124, // ~12.4% per level
  [LAB_NAMES.ATTACK_SPEED]: 1.124,
  [LAB_NAMES.CRITICAL_FACTOR]: 1.124,
  [LAB_NAMES.RANGE]: 1.124,
  [LAB_NAMES.SUPER_CRIT_CHANCE]: 1.086,
  [LAB_NAMES.SUPER_CRIT_MULTI]: 1.124,
  [LAB_NAMES.SUPER_TOWER_BONUS]: 1.338, // 33.8% per level (highest efficiency)
  [LAB_NAMES.HEALTH]: 1.124,
  [LAB_NAMES.HEALTH_REGEN]: 1.124,
  [LAB_NAMES.DEFENSE_ABSOLUTE]: 1.124,
  [LAB_NAMES.DEFENSE_PERCENT]: 1.124,
  [LAB_NAMES.CASH_BONUS]: 1.124,
  [LAB_NAMES.CASH_PER_WAVE]: 1.124,
  [LAB_NAMES.COINS_PER_KILL]: 1.124,
  [LAB_NAMES.COINS_PER_WAVE]: 1.124,
  [LAB_NAMES.INTEREST]: 1.124,
  [LAB_NAMES.GOLDEN_TOWER_BONUS]: 1.124,
  [LAB_NAMES.GOLDEN_TOWER_DURATION]: 1.124
};

// Base stats (before any labs)
const BASE_STATS = {
  DAMAGE: 1.0,
  ATTACK_SPEED: 1.0,
  CRITICAL_CHANCE: 0.05, // 5%
  CRITICAL_DAMAGE: 2.0, // 200%
  RANGE: 1.0,
  HEALTH: 1.0,
  DEFENSE: 0,
  CASH_MULTIPLIER: 1.0
};

module.exports = {
  LAB_NAMES,
  CARD_MASTERY,
  CARD_MASTERY_MULTIPLIERS,
  LAB_BASE_MULTIPLIER,
  BASE_STATS
};
