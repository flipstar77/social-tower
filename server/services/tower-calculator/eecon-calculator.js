/**
 * eEcon (Effective Economy) Calculator
 * Based on TheTowerofTobi spreadsheet formulas
 */

const { getLabMultiplier } = require('./lab-effects');
const { getCardMasteryMultiplier } = require('./card-mastery');
const { LAB_NAMES, BASE_STATS } = require('./constants');

/**
 * Calculate effective economy (eEcon)
 *
 * @param {Object} labs - Lab levels object
 * @param {Object} cardMastery - Card mastery levels object
 * @param {Object} options - Additional options
 * @returns {Object} - Calculation breakdown
 */
function calculateEEcon(labs, cardMastery = {}, options = {}) {
  // 1. Get economy-related lab multipliers
  const cashBonusLabMultiplier = getLabMultiplier(LAB_NAMES.CASH_BONUS, labs[LAB_NAMES.CASH_BONUS] || 0);
  const cashPerWaveLabMultiplier = getLabMultiplier(LAB_NAMES.CASH_PER_WAVE, labs[LAB_NAMES.CASH_PER_WAVE] || 0);
  const coinsPerKillLabMultiplier = getLabMultiplier(LAB_NAMES.COINS_PER_KILL, labs[LAB_NAMES.COINS_PER_KILL] || 0);
  const coinsPerWaveLabMultiplier = getLabMultiplier(LAB_NAMES.COINS_PER_WAVE, labs[LAB_NAMES.COINS_PER_WAVE] || 0);
  const interestLabMultiplier = getLabMultiplier(LAB_NAMES.INTEREST, labs[LAB_NAMES.INTEREST] || 0);
  const goldenTowerBonusLabMultiplier = getLabMultiplier(LAB_NAMES.GOLDEN_TOWER_BONUS, labs[LAB_NAMES.GOLDEN_TOWER_BONUS] || 0);

  // 2. Calculate cash income component
  // Cash per wave and cash bonus multiply together
  const cashIncome = cashPerWaveLabMultiplier * cashBonusLabMultiplier;

  // 3. Calculate coin income component
  // Coins per kill and coins per wave
  const coinIncome = coinsPerKillLabMultiplier * coinsPerWaveLabMultiplier;

  // 4. Factor in interest (passive income growth)
  const interestBonus = interestLabMultiplier;

  // 5. Factor in golden tower bonus (economic boost periods)
  const goldenTowerBonus = goldenTowerBonusLabMultiplier;

  // 6. Calculate final eEcon
  // Formula: (Cash + Coins) * Interest * GoldenTower
  const eEcon = (cashIncome + coinIncome) * interestBonus * goldenTowerBonus;

  return {
    eEcon: Math.round(eEcon * 100) / 100,
    breakdown: {
      cashIncome: Math.round(cashIncome * 100) / 100,
      coinIncome: Math.round(coinIncome * 100) / 100,
      interestBonus: Math.round(interestBonus * 100) / 100,
      goldenTowerBonus: Math.round(goldenTowerBonus * 100) / 100
    },
    components: {
      cashComponent: Math.round(cashIncome * 100) / 100,
      coinComponent: Math.round(coinIncome * 100) / 100,
      interestComponent: Math.round(interestBonus * 100) / 100,
      goldenTowerComponent: Math.round(goldenTowerBonus * 100) / 100
    }
  };
}

/**
 * Calculate eEcon improvement from upgrading a specific lab
 *
 * @param {Object} currentLabs - Current lab levels
 * @param {string} labToUpgrade - Lab name to upgrade
 * @param {Object} cardMastery - Card mastery levels
 * @returns {Object} - Improvement details
 */
function calculateLabUpgradeImprovement(currentLabs, labToUpgrade, cardMastery = {}) {
  const currentEEcon = calculateEEcon(currentLabs, cardMastery);

  const upgradedLabs = { ...currentLabs };
  upgradedLabs[labToUpgrade] = (upgradedLabs[labToUpgrade] || 0) + 1;

  const newEEcon = calculateEEcon(upgradedLabs, cardMastery);

  const improvement = newEEcon.eEcon / currentEEcon.eEcon - 1;

  return {
    labName: labToUpgrade,
    currentLevel: currentLabs[labToUpgrade] || 0,
    newLevel: upgradedLabs[labToUpgrade],
    currentEEcon: currentEEcon.eEcon,
    newEEcon: newEEcon.eEcon,
    improvementPercent: Math.round(improvement * 10000) / 100,
    improvementRatio: Math.round(improvement * 1000) / 1000
  };
}

module.exports = {
  calculateEEcon,
  calculateLabUpgradeImprovement
};
