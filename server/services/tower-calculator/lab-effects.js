/**
 * Lab Effects Calculator
 * Calculates the multiplier effect of each lab level
 */

const { LAB_BASE_MULTIPLIER } = require('./constants');

/**
 * Calculate the multiplier for a given lab at a specific level
 * Formula: multiplier = base^level
 *
 * @param {string} labName - The lab name (from constants.LAB_NAMES)
 * @param {number} level - The current lab level
 * @returns {number} - The multiplier effect
 */
function getLabMultiplier(labName, level) {
  if (!level || level < 0) return 1.0;

  const baseMultiplier = LAB_BASE_MULTIPLIER[labName];
  if (!baseMultiplier) {
    console.warn(`Unknown lab: ${labName}, defaulting to 1.0`);
    return 1.0;
  }

  // Base^level
  return Math.pow(baseMultiplier, level);
}

/**
 * Get all lab multipliers for a given set of lab levels
 *
 * @param {Object} labs - Object with lab names as keys and levels as values
 * @returns {Object} - Object with lab names as keys and multipliers as values
 */
function getAllLabMultipliers(labs) {
  const multipliers = {};

  for (const [labName, level] of Object.entries(labs)) {
    multipliers[labName] = getLabMultiplier(labName, level || 0);
  }

  return multipliers;
}

/**
 * Calculate the improvement from upgrading a lab by 1 level
 *
 * @param {string} labName - The lab name
 * @param {number} currentLevel - Current level
 * @returns {number} - Percentage improvement (e.g., 0.124 = 12.4%)
 */
function getLabUpgradeImprovement(labName, currentLevel) {
  const currentMultiplier = getLabMultiplier(labName, currentLevel);
  const nextMultiplier = getLabMultiplier(labName, currentLevel + 1);

  return (nextMultiplier / currentMultiplier) - 1;
}

module.exports = {
  getLabMultiplier,
  getAllLabMultipliers,
  getLabUpgradeImprovement
};
