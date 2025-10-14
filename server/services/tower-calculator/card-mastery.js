/**
 * Card Mastery Effects Calculator
 * Handles card mastery level bonuses (0-7 levels per card)
 */

const { CARD_MASTERY, CARD_MASTERY_MULTIPLIERS } = require('./constants');

/**
 * Calculate the multiplier bonus from card mastery
 *
 * @param {string} masteryType - The mastery type (from CARD_MASTERY)
 * @param {number} level - The mastery level (0-7)
 * @returns {number} - The multiplier (e.g., 1.14 = +14%)
 */
function getCardMasteryMultiplier(masteryType, level) {
  if (!level || level < 0) return 1.0;
  if (level > 7) level = 7; // Cap at 7

  const perLevelBonus = CARD_MASTERY_MULTIPLIERS[masteryType];
  if (!perLevelBonus) {
    console.warn(`Unknown mastery type: ${masteryType}`);
    return 1.0;
  }

  // Each level adds the bonus multiplicatively
  // Level 1 = +1 * bonus, Level 2 = +2 * bonus, etc.
  // Formula: 1 + (level + 1) * bonus
  // This matches the Excel formula: 1+(CJ5+1)*1%
  return 1 + (level + 1) * perLevelBonus;
}

/**
 * Get all card mastery multipliers
 *
 * @param {Object} masteryLevels - Object with mastery types as keys and levels as values
 * @returns {Object} - Object with mastery types as keys and multipliers as values
 */
function getAllCardMasteryMultipliers(masteryLevels) {
  const multipliers = {};

  for (const masteryType of Object.values(CARD_MASTERY)) {
    const level = masteryLevels[masteryType] || 0;
    multipliers[masteryType] = getCardMasteryMultiplier(masteryType, level);
  }

  return multipliers;
}

/**
 * Calculate Super Tower Bonus with card mastery
 * This is the key fix - Super Tower Bonus must account for card mastery
 *
 * @param {number} superTowerLabLevel - Super Tower Bonus lab level
 * @param {number} superTowerMasteryLevel - Super Tower card mastery level (0-7)
 * @returns {number} - The Super Tower Bonus multiplier
 */
function calculateSuperTowerBonus(superTowerLabLevel, superTowerMasteryLevel) {
  const { getLabMultiplier } = require('./lab-effects');

  // Base multiplier from lab level
  const labMultiplier = getLabMultiplier('super-tower-bonus', superTowerLabLevel);

  // Card mastery bonus
  const masteryMultiplier = getCardMasteryMultiplier(
    CARD_MASTERY.SUPER_TOWER,
    superTowerMasteryLevel
  );

  // Combined effect (multiplicative)
  return labMultiplier * masteryMultiplier;
}

module.exports = {
  getCardMasteryMultiplier,
  getAllCardMasteryMultipliers,
  calculateSuperTowerBonus
};
