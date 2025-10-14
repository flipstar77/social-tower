/**
 * eDamage (Effective Damage) Calculator
 * Based on TheTowerofTobi spreadsheet formulas
 */

const { getLabMultiplier } = require('./lab-effects');
const { getCardMasteryMultiplier, calculateSuperTowerBonus } = require('./card-mastery');
const { LAB_NAMES, CARD_MASTERY, BASE_STATS } = require('./constants');

/**
 * Calculate effective damage (eDamage)
 *
 * @param {Object} labs - Lab levels object
 * @param {Object} cardMastery - Card mastery levels object
 * @param {Object} options - Additional options (perks, modules, etc.)
 * @returns {Object} - Calculation breakdown
 */
function calculateEDamage(labs, cardMastery = {}, options = {}) {
  // 1. Get base lab multipliers
  const damageLabMultiplier = getLabMultiplier(LAB_NAMES.DAMAGE, labs[LAB_NAMES.DAMAGE] || 0);
  const attackSpeedLabMultiplier = getLabMultiplier(LAB_NAMES.ATTACK_SPEED, labs[LAB_NAMES.ATTACK_SPEED] || 0);
  const critFactorLabMultiplier = getLabMultiplier(LAB_NAMES.CRITICAL_FACTOR, labs[LAB_NAMES.CRITICAL_FACTOR] || 0);
  const rangeLabMultiplier = getLabMultiplier(LAB_NAMES.RANGE, labs[LAB_NAMES.RANGE] || 0);
  const superCritChanceLabMultiplier = getLabMultiplier(LAB_NAMES.SUPER_CRIT_CHANCE, labs[LAB_NAMES.SUPER_CRIT_CHANCE] || 0);
  const superCritMultiLabMultiplier = getLabMultiplier(LAB_NAMES.SUPER_CRIT_MULTI, labs[LAB_NAMES.SUPER_CRIT_MULTI] || 0);

  // 2. Apply card mastery to labs
  const damageMasteryMultiplier = getCardMasteryMultiplier(
    CARD_MASTERY.DAMAGE,
    cardMastery[CARD_MASTERY.DAMAGE] || 0
  );

  const attackSpeedMasteryMultiplier = getCardMasteryMultiplier(
    CARD_MASTERY.ATTACK_SPEED,
    cardMastery[CARD_MASTERY.ATTACK_SPEED] || 0
  );

  const critChanceMasteryMultiplier = getCardMasteryMultiplier(
    CARD_MASTERY.CRITICAL_CHANCE,
    cardMastery[CARD_MASTERY.CRITICAL_CHANCE] || 0
  );

  const rangeMasteryMultiplier = getCardMasteryMultiplier(
    CARD_MASTERY.RANGE,
    cardMastery[CARD_MASTERY.RANGE] || 0
  );

  // 3. Calculate effective stats with mastery
  const effectiveDamage = damageLabMultiplier * damageMasteryMultiplier;
  const effectiveAttackSpeed = attackSpeedLabMultiplier * attackSpeedMasteryMultiplier;
  const effectiveCritFactor = critFactorLabMultiplier * critChanceMasteryMultiplier;
  const effectiveRange = rangeLabMultiplier * rangeMasteryMultiplier;

  // 4. Calculate Super Tower Bonus WITH card mastery (KEY FIX)
  const superTowerBonus = calculateSuperTowerBonus(
    labs[LAB_NAMES.SUPER_TOWER_BONUS] || 0,
    cardMastery[CARD_MASTERY.SUPER_TOWER] || 0
  );

  // 5. Calculate critical hit damage contribution
  // Formula from spreadsheet: base damage * (1 + crit_chance * (crit_damage - 1))
  const baseCritChance = BASE_STATS.CRITICAL_CHANCE;
  const baseCritDamage = BASE_STATS.CRITICAL_DAMAGE;

  const effectiveCritChance = Math.min(baseCritChance * effectiveCritFactor * superCritChanceLabMultiplier, 1.0);
  const effectiveCritDamage = baseCritDamage * superCritMultiLabMultiplier;

  const criticalHitContribution = 1 + effectiveCritChance * (effectiveCritDamage - 1);

  // 6. Calculate final eDamage
  // Formula: Damage * AttackSpeed * CritContribution * SuperTowerBonus * Range
  const eDamage =
    effectiveDamage *
    effectiveAttackSpeed *
    criticalHitContribution *
    superTowerBonus *
    effectiveRange;

  // 7. Return detailed breakdown
  return {
    eDamage: Math.round(eDamage * 100) / 100,
    breakdown: {
      effectiveDamage: Math.round(effectiveDamage * 100) / 100,
      effectiveAttackSpeed: Math.round(effectiveAttackSpeed * 100) / 100,
      effectiveCritChance: Math.round(effectiveCritChance * 10000) / 100, // as percentage
      effectiveCritDamage: Math.round(effectiveCritDamage * 100) / 100,
      criticalHitContribution: Math.round(criticalHitContribution * 100) / 100,
      superTowerBonus: Math.round(superTowerBonus * 100) / 100,
      effectiveRange: Math.round(effectiveRange * 100) / 100
    },
    components: {
      damageComponent: Math.round(effectiveDamage * 100) / 100,
      attackSpeedComponent: Math.round(effectiveAttackSpeed * 100) / 100,
      critComponent: Math.round(criticalHitContribution * 100) / 100,
      superTowerComponent: Math.round(superTowerBonus * 100) / 100,
      rangeComponent: Math.round(effectiveRange * 100) / 100
    }
  };
}

/**
 * Calculate eDamage improvement from upgrading a specific lab
 *
 * @param {Object} currentLabs - Current lab levels
 * @param {string} labToUpgrade - Lab name to upgrade
 * @param {Object} cardMastery - Card mastery levels
 * @returns {Object} - Improvement details
 */
function calculateLabUpgradeImprovement(currentLabs, labToUpgrade, cardMastery = {}) {
  const currentEDamage = calculateEDamage(currentLabs, cardMastery);

  const upgradedLabs = { ...currentLabs };
  upgradedLabs[labToUpgrade] = (upgradedLabs[labToUpgrade] || 0) + 1;

  const newEDamage = calculateEDamage(upgradedLabs, cardMastery);

  const improvement = newEDamage.eDamage / currentEDamage.eDamage - 1;

  return {
    labName: labToUpgrade,
    currentLevel: currentLabs[labToUpgrade] || 0,
    newLevel: upgradedLabs[labToUpgrade],
    currentEDamage: currentEDamage.eDamage,
    newEDamage: newEDamage.eDamage,
    improvementPercent: Math.round(improvement * 10000) / 100, // percentage with 2 decimals
    improvementRatio: Math.round(improvement * 1000) / 1000
  };
}

module.exports = {
  calculateEDamage,
  calculateLabUpgradeImprovement
};
