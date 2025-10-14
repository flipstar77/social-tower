/**
 * ROI (Return on Investment) Calculator
 * Calculates which lab upgrades provide the best improvement per time invested
 */

const { calculateEDamage, calculateLabUpgradeImprovement: edmgImprovement } = require('./edmg-calculator');
const { calculateEHP, calculateLabUpgradeImprovement: ehpImprovement } = require('./ehp-calculator');
const { calculateEEcon, calculateLabUpgradeImprovement: eeconImprovement } = require('./eecon-calculator');
const { LAB_NAMES } = require('./constants');

// Simplified lab upgrade times (in hours)
// TODO: Parse from Lab_Researches.csv for exact values
const LAB_UPGRADE_TIMES = {
  [LAB_NAMES.DAMAGE]: 10,
  [LAB_NAMES.ATTACK_SPEED]: 10,
  [LAB_NAMES.CRITICAL_FACTOR]: 10,
  [LAB_NAMES.RANGE]: 10,
  [LAB_NAMES.SUPER_CRIT_CHANCE]: 10,
  [LAB_NAMES.SUPER_CRIT_MULTI]: 10,
  [LAB_NAMES.SUPER_TOWER_BONUS]: 20, // Higher time cost
  [LAB_NAMES.HEALTH]: 10,
  [LAB_NAMES.HEALTH_REGEN]: 10,
  [LAB_NAMES.DEFENSE_ABSOLUTE]: 10,
  [LAB_NAMES.DEFENSE_PERCENT]: 10,
  [LAB_NAMES.CASH_BONUS]: 10,
  [LAB_NAMES.CASH_PER_WAVE]: 10,
  [LAB_NAMES.COINS_PER_KILL]: 10,
  [LAB_NAMES.COINS_PER_WAVE]: 10,
  [LAB_NAMES.INTEREST]: 10,
  [LAB_NAMES.GOLDEN_TOWER_BONUS]: 10
};

/**
 * Calculate ROI for all possible lab upgrades
 *
 * @param {Object} currentLabs - Current lab levels
 * @param {Object} cardMastery - Card mastery levels
 * @param {string} focus - Focus area: 'damage', 'health', 'economy', or 'all'
 * @returns {Array} - Sorted array of upgrade recommendations
 */
function calculateLabPriorities(currentLabs, cardMastery = {}, focus = 'damage') {
  const upgrades = [];

  // Determine which labs to consider based on focus
  let labsToConsider = [];

  if (focus === 'damage' || focus === 'all') {
    labsToConsider.push(
      LAB_NAMES.DAMAGE,
      LAB_NAMES.ATTACK_SPEED,
      LAB_NAMES.CRITICAL_FACTOR,
      LAB_NAMES.RANGE,
      LAB_NAMES.SUPER_CRIT_CHANCE,
      LAB_NAMES.SUPER_CRIT_MULTI,
      LAB_NAMES.SUPER_TOWER_BONUS
    );
  }

  if (focus === 'health' || focus === 'all') {
    labsToConsider.push(
      LAB_NAMES.HEALTH,
      LAB_NAMES.HEALTH_REGEN,
      LAB_NAMES.DEFENSE_ABSOLUTE,
      LAB_NAMES.DEFENSE_PERCENT
    );
  }

  if (focus === 'economy' || focus === 'all') {
    labsToConsider.push(
      LAB_NAMES.CASH_BONUS,
      LAB_NAMES.CASH_PER_WAVE,
      LAB_NAMES.COINS_PER_KILL,
      LAB_NAMES.COINS_PER_WAVE,
      LAB_NAMES.INTEREST,
      LAB_NAMES.GOLDEN_TOWER_BONUS
    );
  }

  // Calculate improvement for each lab
  for (const labName of labsToConsider) {
    const currentLevel = currentLabs[labName] || 0;
    let improvement;

    // Determine which calculator to use based on lab type
    if ([LAB_NAMES.DAMAGE, LAB_NAMES.ATTACK_SPEED, LAB_NAMES.CRITICAL_FACTOR, LAB_NAMES.RANGE, LAB_NAMES.SUPER_CRIT_CHANCE, LAB_NAMES.SUPER_CRIT_MULTI, LAB_NAMES.SUPER_TOWER_BONUS].includes(labName)) {
      improvement = edmgImprovement(currentLabs, labName, cardMastery);
    } else if ([LAB_NAMES.HEALTH, LAB_NAMES.HEALTH_REGEN, LAB_NAMES.DEFENSE_ABSOLUTE, LAB_NAMES.DEFENSE_PERCENT].includes(labName)) {
      improvement = ehpImprovement(currentLabs, labName, cardMastery);
    } else {
      improvement = eeconImprovement(currentLabs, labName, cardMastery);
    }

    const upgradeTime = LAB_UPGRADE_TIMES[labName] || 10;
    const roi = improvement.improvementPercent / upgradeTime; // ROI per hour

    upgrades.push({
      labName,
      displayName: labName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      currentLevel,
      newLevel: currentLevel + 1,
      improvementPercent: improvement.improvementPercent,
      upgradeTimeHours: upgradeTime,
      roi: Math.round(roi * 100) / 100,
      category: getDamageCategory(labName)
    });
  }

  // Sort by ROI (descending)
  upgrades.sort((a, b) => b.roi - a.roi);

  return upgrades;
}

/**
 * Get the category for a lab (for display purposes)
 */
function getLabCategory(labName) {
  if ([LAB_NAMES.DAMAGE, LAB_NAMES.ATTACK_SPEED, LAB_NAMES.CRITICAL_FACTOR, LAB_NAMES.RANGE, LAB_NAMES.SUPER_CRIT_CHANCE, LAB_NAMES.SUPER_CRIT_MULTI, LAB_NAMES.SUPER_TOWER_BONUS].includes(labName)) {
    return 'Damage';
  }
  if ([LAB_NAMES.HEALTH, LAB_NAMES.HEALTH_REGEN, LAB_NAMES.DEFENSE_ABSOLUTE, LAB_NAMES.DEFENSE_PERCENT].includes(labName)) {
    return 'Health';
  }
  return 'Economy';
}

/**
 * Calculate comprehensive stats (eDamage, eHP, eEcon) for current labs
 *
 * @param {Object} currentLabs - Current lab levels
 * @param {Object} cardMastery - Card mastery levels
 * @returns {Object} - All calculated stats
 */
function calculateAllStats(currentLabs, cardMastery = {}) {
  const edmg = calculateEDamage(currentLabs, cardMastery);
  const ehp = calculateEHP(currentLabs, cardMastery);
  const eecon = calculateEEcon(currentLabs, cardMastery);

  return {
    eDamage: edmg.eDamage,
    eDamageBreakdown: edmg.breakdown,
    eHP: ehp.eHP,
    eHPBreakdown: ehp.breakdown,
    eEcon: eecon.eEcon,
    eEconBreakdown: eecon.breakdown
  };
}

function getDamageCategory(labName) {
  return getLabCategory(labName);
}

module.exports = {
  calculateLabPriorities,
  calculateAllStats,
  LAB_UPGRADE_TIMES
};
