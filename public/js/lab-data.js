/**
 * Lab Data - Complete list of all research labs with categorization
 * Data extracted from complete-labs-guide.md
 */

const ALL_LABS = [
    // Damage & Combat
    { name: 'Damage', category: 'damage', icon: '⚔️', maxLevel: 24 },
    { name: 'Critical Factor', category: 'damage', icon: '⚔️', maxLevel: 24 },
    { name: 'Attack Speed', category: 'damage', icon: '⚔️', maxLevel: 24 },
    { name: 'Super Crit Chance', category: 'damage', icon: '⚔️', maxLevel: 19 },
    { name: 'Super Crit Multi', category: 'damage', icon: '⚔️', maxLevel: 18 },
    { name: 'Damage / Meter', category: 'damage', icon: '⚔️', maxLevel: 24 },
    { name: 'Range', category: 'damage', icon: '⚔️', maxLevel: 22 },
    { name: 'Light Speed Shots', category: 'damage', icon: '⚔️', maxLevel: 1 },

    // Defense
    { name: 'Health', category: 'defense', icon: '🛡️', maxLevel: 24 },
    { name: 'Defense Absolute', category: 'defense', icon: '🛡️', maxLevel: 24 },
    { name: 'Defense %', category: 'defense', icon: '🛡️', maxLevel: 19 },
    { name: 'Health Regen', category: 'defense', icon: '🛡️', maxLevel: 24 },
    { name: 'Energy Shield Extra Hit', category: 'defense', icon: '🛡️', maxLevel: 2 },

    // Economy
    { name: 'Cash Bonus', category: 'economy', icon: '💰', maxLevel: 24 },
    { name: 'Interest', category: 'economy', icon: '💰', maxLevel: 24 },
    { name: 'Max Interest', category: 'economy', icon: '💰', maxLevel: 15 },
    { name: 'Starting Cash', category: 'economy', icon: '💰', maxLevel: 24 },
    { name: 'Labs Coin Discount', category: 'economy', icon: '💰', maxLevel: 24 },
    { name: 'Coins / Wave', category: 'economy', icon: '💰', maxLevel: 24 },
    { name: 'Cash / Wave', category: 'economy', icon: '💰', maxLevel: 24 },
    { name: 'Coins / Kill Bonus', category: 'economy', icon: '💰', maxLevel: 24 },

    // Special & Bonus
    { name: 'Super Tower Bonus', category: 'special', icon: '✨', maxLevel: 17 },
    { name: 'Golden Tower Bonus', category: 'special', icon: '✨', maxLevel: 16 },
    { name: 'Golden Tower Duration', category: 'special', icon: '✨', maxLevel: 16 },

    // Black Hole
    { name: 'Black Hole Damage', category: 'black-hole', icon: '⚫', maxLevel: 10 },
    { name: 'Black Hole Coin Bonus', category: 'black-hole', icon: '⚫', maxLevel: 16 },
    { name: 'Black Hole Disable Ranged Enemies', category: 'black-hole', icon: '⚫', maxLevel: 1 },
    { name: 'Extra Black Hole', category: 'black-hole', icon: '⚫', maxLevel: 1 },

    // Death Wave
    { name: 'Death Wave Damage Amplifier', category: 'death-wave', icon: '💀', maxLevel: 17 },
    { name: 'Death Wave Health', category: 'death-wave', icon: '💀', maxLevel: 17 },
    { name: 'Death Wave Armor Stripping', category: 'death-wave', icon: '💀', maxLevel: 10 },
    { name: 'Death Wave Cells Bonus', category: 'death-wave', icon: '💀', maxLevel: 16 },
    { name: 'Death Wave Coin bonus', category: 'death-wave', icon: '💀', maxLevel: 16 },

    // Chain Lightning
    { name: 'Chain Lightning Shock', category: 'chain-lightning', icon: '⚡', maxLevel: 1 },
    { name: 'Chain Thunder', category: 'chain-lightning', icon: '⚡', maxLevel: 17 },
    { name: 'Shock Chance', category: 'chain-lightning', icon: '⚡', maxLevel: 17 },
    { name: 'Shock Multiplier', category: 'chain-lightning', icon: '⚡', maxLevel: 14 },
    { name: 'Lightning Amplifier - Scatter', category: 'chain-lightning', icon: '⚡', maxLevel: 17 },

    // Chrono Field
    { name: 'Chrono Field Damage Reduction', category: 'chrono-field', icon: '⏰', maxLevel: 1 },
    { name: 'Chrono Field Duration', category: 'chrono-field', icon: '⏰', maxLevel: 17 },
    { name: 'Chrono Field Range', category: 'chrono-field', icon: '⏰', maxLevel: 16 },
    { name: 'Chrono Field Reduction %', category: 'chrono-field', icon: '⏰', maxLevel: 17 },

    // Land Mines
    { name: 'Land Mine Damage', category: 'mines', icon: '💣', maxLevel: 16 },
    { name: 'Land Mine Decay', category: 'mines', icon: '💣', maxLevel: 17 },
    { name: 'Inner Mine Blast Radius', category: 'mines', icon: '💣', maxLevel: 16 },
    { name: 'Inner Mine Rotation Speed', category: 'mines', icon: '💣', maxLevel: 16 },
    { name: 'Inner Mine Stun', category: 'mines', icon: '💣', maxLevel: 1 },

    // Missiles
    { name: 'Missile Amplifier', category: 'missiles', icon: '🚀', maxLevel: 16 },
    { name: 'Missile Barrage', category: 'missiles', icon: '🚀', maxLevel: 1 },
    { name: 'Missile Barrage Quantity', category: 'missiles', icon: '🚀', maxLevel: 6 },
    { name: 'Missile Despawn Time', category: 'missiles', icon: '🚀', maxLevel: 16 },
    { name: 'Missile Radius', category: 'missiles', icon: '🚀', maxLevel: 16 },
    { name: 'Missiles Explosion', category: 'missiles', icon: '🚀', maxLevel: 1 },
    { name: 'Spotlight Missiles', category: 'missiles', icon: '🚀', maxLevel: 16 },
    { name: 'Double Death Ray', category: 'missiles', icon: '🚀', maxLevel: 17 },

    // Orbs
    { name: 'Extra Extra Orbs', category: 'orbs', icon: '🔮', maxLevel: 2 },
    { name: 'Extra Orb Adjuster', category: 'orbs', icon: '🔮', maxLevel: 1 },
    { name: 'Orb Boss Hit', category: 'orbs', icon: '🔮', maxLevel: 10 },
    { name: 'Orbs Speed', category: 'orbs', icon: '🔮', maxLevel: 16 },

    // Swamp
    { name: 'Swamp Radius', category: 'swamp', icon: '🌿', maxLevel: 16 },
    { name: 'Swamp Rend', category: 'swamp', icon: '🌿', maxLevel: 17 },
    { name: 'Swamp Rend - Additional Enemies', category: 'swamp', icon: '🌿', maxLevel: 6 },
    { name: 'Swamp Stun', category: 'swamp', icon: '🌿', maxLevel: 1 },
    { name: 'Swamp Stun Chance', category: 'swamp', icon: '🌿', maxLevel: 16 },
    { name: 'Swamp Stun Time', category: 'swamp', icon: '🌿', maxLevel: 16 },
    { name: 'Max Rend Armor Multiplier', category: 'swamp', icon: '🌿', maxLevel: 17 },
    { name: 'Garlic Thorns', category: 'swamp', icon: '🌿', maxLevel: 10 },

    // Bots
    { name: 'Amplify Bot - Cooldown', category: 'bots', icon: '🤖', maxLevel: 16 },
    { name: 'Amplify Bot - Duration', category: 'bots', icon: '🤖', maxLevel: 16 },
    { name: 'Flame Bot - Burn Stack', category: 'bots', icon: '🤖', maxLevel: 5 },
    { name: 'Flame Bot - Cooldown', category: 'bots', icon: '🤖', maxLevel: 16 },
    { name: 'Gold Bot - Cooldown', category: 'bots', icon: '🤖', maxLevel: 16 },
    { name: 'Gold Bot - Duration', category: 'bots', icon: '🤖', maxLevel: 16 },
    { name: 'Thunder Bot - Cooldown', category: 'bots', icon: '🤖', maxLevel: 16 },
    { name: 'Thunder Bot - Linger Time', category: 'bots', icon: '🤖', maxLevel: 16 },

    // Wall & Defense
    { name: 'Wall Fortification', category: 'wall', icon: '🧱', maxLevel: 20 },
    { name: 'Wall Health', category: 'wall', icon: '🧱', maxLevel: 19 },
    { name: 'Wall Invincibility', category: 'wall', icon: '🧱', maxLevel: 10 },
    { name: 'Wall Rebuild', category: 'wall', icon: '🧱', maxLevel: 16 },
    { name: 'Wall Regen', category: 'wall', icon: '🧱', maxLevel: 17 },
    { name: 'Wall Thorns', category: 'wall', icon: '🧱', maxLevel: 16 },
    { name: 'Protector Damage Reduction', category: 'wall', icon: '🧱', maxLevel: 16 },
    { name: 'Protector Health', category: 'wall', icon: '🧱', maxLevel: 17 },
    { name: 'Protector Radius', category: 'wall', icon: '🧱', maxLevel: 17 },

    // Perks & Cards
    { name: 'Auto Pick Perks', category: 'perks', icon: '🎯', maxLevel: 1 },
    { name: 'Auto Pick Ranking', category: 'perks', icon: '🎯', maxLevel: 17 },
    { name: 'Ban Perks', category: 'perks', icon: '🎯', maxLevel: 8 },
    { name: 'Card Presets', category: 'perks', icon: '🎯', maxLevel: 1 },
    { name: 'First Perk Choice', category: 'perks', icon: '🎯', maxLevel: 1 },
    { name: 'Improve Trade-off Perks', category: 'perks', icon: '🎯', maxLevel: 10 },
    { name: 'Perk Option Quantity', category: 'perks', icon: '🎯', maxLevel: 2 },
    { name: 'Standard Perks Bonus', category: 'perks', icon: '🎯', maxLevel: 16 },
    { name: 'Unlock Perks', category: 'perks', icon: '🎯', maxLevel: 1 },

    // Enemies
    { name: 'Boss Attack', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Boss Health', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Common Enemy Attack', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Common Enemy Health', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Fast Enemy Attack', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Fast Enemy Health', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Fast Enemy Speed', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Ranged Enemy Attack', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Ranged Enemy Health', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Tank Enemy Attack', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Tank Enemy Health', category: 'enemies', icon: '👾', maxLevel: 17 },
    { name: 'Enemy Attack Level Skip', category: 'enemies', icon: '👾', maxLevel: 16 },
    { name: 'Enemy Health Level Skip', category: 'enemies', icon: '👾', maxLevel: 16 },

    // Utility & QOL
    { name: 'Buy Multiplier', category: 'utility', icon: '⚙️', maxLevel: 4 },
    { name: 'Game Speed', category: 'utility', icon: '⚙️', maxLevel: 7 },
    { name: 'Lab Speed', category: 'utility', icon: '⚙️', maxLevel: 24 },
    { name: 'More Round Stats', category: 'utility', icon: '⚙️', maxLevel: 1 },
    { name: 'Package After Boss', category: 'utility', icon: '⚙️', maxLevel: 1 },
    { name: 'Recovery Package Amount', category: 'utility', icon: '⚙️', maxLevel: 16 },
    { name: 'Recovery Package Chance', category: 'utility', icon: '⚙️', maxLevel: 16 },
    { name: 'Recovery Package Max', category: 'utility', icon: '⚙️', maxLevel: 16 },
    { name: 'Shockwave Size', category: 'utility', icon: '⚙️', maxLevel: 16 },
    { name: 'Spotlight Coin Bonus', category: 'utility', icon: '⚙️', maxLevel: 16 },
    { name: 'Target Priority', category: 'utility', icon: '⚙️', maxLevel: 2 },
    { name: 'Waves Required', category: 'utility', icon: '⚙️', maxLevel: 24 },
    { name: 'Second Wind Blast', category: 'utility', icon: '⚙️', maxLevel: 4 },

    // Workshop & Modules
    { name: 'Workshop Attack Discount', category: 'workshop', icon: '🏭', maxLevel: 24 },
    { name: 'Workshop Defense Discount', category: 'workshop', icon: '🏭', maxLevel: 24 },
    { name: 'Workshop Utility Discount', category: 'workshop', icon: '🏭', maxLevel: 24 },
    { name: 'Workshop Enhancements', category: 'workshop', icon: '🏭', maxLevel: 1 },
    { name: 'Workshop Respec', category: 'workshop', icon: '🏭', maxLevel: 1 },
    { name: 'Module Coin Cost', category: 'workshop', icon: '🏭', maxLevel: 17 },
    { name: 'Module Shards Cost', category: 'workshop', icon: '🏭', maxLevel: 17 },
    { name: 'Unmerge Module', category: 'workshop', icon: '🏭', maxLevel: 1 },

    // Drops & Loot
    { name: 'Common Drop Chance', category: 'drops', icon: '📦', maxLevel: 10 },
    { name: 'Rare Drop Chance', category: 'drops', icon: '📦', maxLevel: 10 },
    { name: 'Daily Mission shards', category: 'drops', icon: '📦', maxLevel: 19 },
    { name: 'Reroll Daily Mission', category: 'drops', icon: '📦', maxLevel: 1 },
    { name: 'Reroll Shards', category: 'drops', icon: '📦', maxLevel: 24 },
    { name: 'Shatter Shards', category: 'drops', icon: '📦', maxLevel: 5 },

    // Recharge
    { name: 'Recharge Demon Mode', category: 'recharge', icon: '🔋', maxLevel: 7 },
    { name: 'Recharge Missile Barrage', category: 'recharge', icon: '🔋', maxLevel: 7 },
    { name: 'Recharge Nuke', category: 'recharge', icon: '🔋', maxLevel: 7 },
    { name: 'Recharge Second Wind', category: 'recharge', icon: '🔋', maxLevel: 7 }
];

const CATEGORY_LABELS = {
    'damage': '⚔️ Damage & Combat',
    'defense': '🛡️ Defense',
    'economy': '💰 Economy',
    'special': '✨ Special Bonuses',
    'black-hole': '⚫ Black Hole',
    'death-wave': '💀 Death Wave',
    'chain-lightning': '⚡ Chain Lightning',
    'chrono-field': '⏰ Chrono Field',
    'mines': '💣 Land Mines',
    'missiles': '🚀 Missiles & Death Ray',
    'orbs': '🔮 Orbs',
    'swamp': '🌿 Swamp & Thorns',
    'bots': '🤖 Bots',
    'wall': '🧱 Wall & Protector',
    'perks': '🎯 Perks & Cards',
    'enemies': '👾 Enemies',
    'utility': '⚙️ Utility & QOL',
    'workshop': '🏭 Workshop & Modules',
    'drops': '📦 Drops & Loot',
    'recharge': '🔋 Recharge'
};

// Convert lab name to ID format (e.g., "Damage / Meter" -> "damage-meter")
function labNameToId(name) {
    return name
        .toLowerCase()
        .replace(/[\/\s]+/g, '-')
        .replace(/[%()]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
}

// Convert lab ID to camelCase key (e.g., "damage-meter" -> "damageMeter")
function labIdToKey(id) {
    return id.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Export to window for use by labs-manager.js
window.ALL_LABS = ALL_LABS;
window.CATEGORY_LABELS = CATEGORY_LABELS;
window.labNameToId = labNameToId;
window.labIdToKey = labIdToKey;

console.log('✅ Lab data loaded:', ALL_LABS.length, 'labs in', Object.keys(CATEGORY_LABELS).length, 'categories');
