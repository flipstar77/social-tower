/**
 * eHP (Effective Health) Calculator
 * Based on TheTowerofTobi spreadsheet formulas
 */

const { getLabMultiplier } = require('./lab-effects');
const { getCardMasteryMultiplier } = require('./card-mastery');
const { LAB_NAMES, BASE_STATS } = require('./constants');

/**
 * Calculate effective health (eHP)
 *
 * @param {Object} labs - Lab levels object
 * @param {Object} cardMastery - Card mastery levels object
 * @param {Object} options - Additional options
 * @returns {Object} - Calculation breakdown
 */
function calculateEHP(labs, cardMastery = {}, options = {}) {
  // 1. Get health-related lab multipliers
  const healthLabMultiplier = getLabMultiplier(LAB_NAMES.HEALTH, labs[LAB_NAMES.HEALTH] || 0);
  const healthRegenLabMultiplier = getLabMultiplier(LAB_NAMES.HEALTH_REGEN, labs[LAB_NAMES.HEALTH_REGEN] || 0);
  const defenseAbsLabMultiplier = getLabMultiplier(LAB_NAMES.DEFENSE_ABSOLUTE, labs[LAB_NAMES.DEFENSE_ABSOLUTE] || 0);
  const defensePercentLabMultiplier = getLabMultiplier(LAB_NAMES.DEFENSE_PERCENT, labs[LAB_NAMES.DEFENSE_PERCENT] || 0);

  // 2. Calculate effective health
  // Formula: Health * (1 + DefensePercent) * (1 + DefenseAbsolute)
  const effectiveHealth = healthLabMultiplier * defensePercentLabMultiplier * (1 + defenseAbsLabMultiplier - 1);

  // 3. Factor in health regen (regeneration adds to survivability)
  // eHP includes regen contribution over time
  const regenContribution = healthRegenLabMultiplier;

  // 4. Calculate final eHP
  // eHP = Health * Defense multipliers * Regen factor
  const eHP = effectiveHealth * regenContribution;

  return {
    eHP: Math.round(eHP * 100) / 100,
    breakdown: {
      effectiveHealth: Math.round(effectiveHealth * 100) / 100,
      healthLabMultiplier: Math.round(healthLabMultiplier * 100) / 100,
      defenseAbsLabMultiplier: Math.round(defenseAbsLabMultiplier * 100) / 100,
      defensePercentLabMultiplier: Math.round(defensePercentLabMultiplier * 100) / 100,
      regenContribution: Math.round(regenContribution * 100) / 100
    },
    components: {
      healthComponent: Math.round(healthLabMultiplier * 100) / 100,
      defenseComponent: Math.round((defensePercentLabMultiplier * defenseAbsLabMultiplier) * 100) / 100,
      regenComponent: Math.round(regenContribution * 100) / 100
    }
  };
}

/**
 * Calculate eHP improvement from upgrading a specific lab
 *
 * @param {Object} currentLabs - Current lab levels
 * @param {string} labToUpgrade - Lab name to upgrade
 * @param {Object} cardMastery - Card mastery levels
 * @returns {Object} - Improvement details
 */
function calculateLabUpgradeImprovement(currentLabs, labToUpgrade, cardMastery = {}) {
  const currentEHP = calculateEHP(currentLabs, cardMastery);

  const upgradedLabs = { ...currentLabs };
  upgradedLabs[labToUpgrade] = (upgradedLabs[labToUpgrade] || 0) + 1;

  const newEHP = calculateEHP(upgradedLabs, cardMastery);

  const improvement = newEHP.eHP / currentEHP.eHP - 1;

  return {
    labName: labToUpgrade,
    currentLevel: currentLabs[labToUpgrade] || 0,
    newLevel: upgradedLabs[labToUpgrade],
    currentEHP: currentEHP.eHP,
    newEHP: newEHP.eHP,
    improvementPercent: Math.round(improvement * 10000) / 100,
    improvementRatio: Math.round(improvement * 1000) / 1000
  };
}

module.exports = {
  calculateEHP,
  calculateLabUpgradeImprovement
};
