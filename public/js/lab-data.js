/**
 * Lab Data - Complete list of all research labs with categorization
 * Data extracted from complete-labs-guide.md
 */

const ALL_LABS = [
    // Damage & Combat
    { name: 'Damage', category: 'damage', icon: '⚔️' },
    { name: 'Critical Factor', category: 'damage', icon: '⚔️' },
    { name: 'Attack Speed', category: 'damage', icon: '⚔️' },
    { name: 'Super Crit Chance', category: 'damage', icon: '⚔️' },
    { name: 'Super Crit Multi', category: 'damage', icon: '⚔️' },
    { name: 'Damage / Meter', category: 'damage', icon: '⚔️' },
    { name: 'Range', category: 'damage', icon: '⚔️' },
    { name: 'Light Speed Shots', category: 'damage', icon: '⚔️' },

    // Defense
    { name: 'Health', category: 'defense', icon: '🛡️' },
    { name: 'Defense Absolute', category: 'defense', icon: '🛡️' },
    { name: 'Defense %', category: 'defense', icon: '🛡️' },
    { name: 'Health Regen', category: 'defense', icon: '🛡️' },
    { name: 'Energy Shield Extra Hit', category: 'defense', icon: '🛡️' },

    // Economy
    { name: 'Cash Bonus', category: 'economy', icon: '💰' },
    { name: 'Interest', category: 'economy', icon: '💰' },
    { name: 'Max Interest', category: 'economy', icon: '💰' },
    { name: 'Starting Cash', category: 'economy', icon: '💰' },
    { name: 'Labs Coin Discount', category: 'economy', icon: '💰' },
    { name: 'Coins / Wave', category: 'economy', icon: '💰' },
    { name: 'Cash / Wave', category: 'economy', icon: '💰' },
    { name: 'Coins / Kill Bonus', category: 'economy', icon: '💰' },

    // Special & Bonus
    { name: 'Super Tower Bonus', category: 'special', icon: '✨' },
    { name: 'Golden Tower Bonus', category: 'special', icon: '✨' },
    { name: 'Golden Tower Duration', category: 'special', icon: '✨' },

    // Black Hole
    { name: 'Black Hole Damage', category: 'black-hole', icon: '⚫' },
    { name: 'Black Hole Coin Bonus', category: 'black-hole', icon: '⚫' },
    { name: 'Black Hole Disable Ranged Enemies', category: 'black-hole', icon: '⚫' },
    { name: 'Extra Black Hole', category: 'black-hole', icon: '⚫' },

    // Death Wave
    { name: 'Death Wave Damage Amplifier', category: 'death-wave', icon: '💀' },
    { name: 'Death Wave Health', category: 'death-wave', icon: '💀' },
    { name: 'Death Wave Armor Stripping', category: 'death-wave', icon: '💀' },
    { name: 'Death Wave Cells Bonus', category: 'death-wave', icon: '💀' },
    { name: 'Death Wave Coin bonus', category: 'death-wave', icon: '💀' },

    // Chain Lightning
    { name: 'Chain Lightning Shock', category: 'chain-lightning', icon: '⚡' },
    { name: 'Chain Thunder', category: 'chain-lightning', icon: '⚡' },
    { name: 'Shock Chance', category: 'chain-lightning', icon: '⚡' },
    { name: 'Shock Multiplier', category: 'chain-lightning', icon: '⚡' },
    { name: 'Lightning Amplifier - Scatter', category: 'chain-lightning', icon: '⚡' },

    // Chrono Field
    { name: 'Chrono Field Damage Reduction', category: 'chrono-field', icon: '⏰' },
    { name: 'Chrono Field Duration', category: 'chrono-field', icon: '⏰' },
    { name: 'Chrono Field Range', category: 'chrono-field', icon: '⏰' },
    { name: 'Chrono Field Reduction %', category: 'chrono-field', icon: '⏰' },

    // Land Mines
    { name: 'Land Mine Damage', category: 'mines', icon: '💣' },
    { name: 'Land Mine Decay', category: 'mines', icon: '💣' },
    { name: 'Inner Mine Blast Radius', category: 'mines', icon: '💣' },
    { name: 'Inner Mine Rotation Speed', category: 'mines', icon: '💣' },
    { name: 'Inner Mine Stun', category: 'mines', icon: '💣' },

    // Missiles
    { name: 'Missile Amplifier', category: 'missiles', icon: '🚀' },
    { name: 'Missile Barrage', category: 'missiles', icon: '🚀' },
    { name: 'Missile Barrage Quantity', category: 'missiles', icon: '🚀' },
    { name: 'Missile Despawn Time', category: 'missiles', icon: '🚀' },
    { name: 'Missile Radius', category: 'missiles', icon: '🚀' },
    { name: 'Missiles Explosion', category: 'missiles', icon: '🚀' },
    { name: 'Spotlight Missiles', category: 'missiles', icon: '🚀' },
    { name: 'Double Death Ray', category: 'missiles', icon: '🚀' },

    // Orbs
    { name: 'Extra Extra Orbs', category: 'orbs', icon: '🔮' },
    { name: 'Extra Orb Adjuster', category: 'orbs', icon: '🔮' },
    { name: 'Orb Boss Hit', category: 'orbs', icon: '🔮' },
    { name: 'Orbs Speed', category: 'orbs', icon: '🔮' },

    // Swamp
    { name: 'Swamp Radius', category: 'swamp', icon: '🌿' },
    { name: 'Swamp Rend', category: 'swamp', icon: '🌿' },
    { name: 'Swamp Rend - Additional Enemies', category: 'swamp', icon: '🌿' },
    { name: 'Swamp Stun', category: 'swamp', icon: '🌿' },
    { name: 'Swamp Stun Chance', category: 'swamp', icon: '🌿' },
    { name: 'Swamp Stun Time', category: 'swamp', icon: '🌿' },
    { name: 'Max Rend Armor Multiplier', category: 'swamp', icon: '🌿' },
    { name: 'Garlic Thorns', category: 'swamp', icon: '🌿' },

    // Bots
    { name: 'Amplify Bot - Cooldown', category: 'bots', icon: '🤖' },
    { name: 'Amplify Bot - Duration', category: 'bots', icon: '🤖' },
    { name: 'Flame Bot - Burn Stack', category: 'bots', icon: '🤖' },
    { name: 'Flame Bot - Cooldown', category: 'bots', icon: '🤖' },
    { name: 'Gold Bot - Cooldown', category: 'bots', icon: '🤖' },
    { name: 'Gold Bot - Duration', category: 'bots', icon: '🤖' },
    { name: 'Thunder Bot - Cooldown', category: 'bots', icon: '🤖' },
    { name: 'Thunder Bot - Linger Time', category: 'bots', icon: '🤖' },

    // Wall & Defense
    { name: 'Wall Fortification', category: 'wall', icon: '🧱' },
    { name: 'Wall Health', category: 'wall', icon: '🧱' },
    { name: 'Wall Invincibility', category: 'wall', icon: '🧱' },
    { name: 'Wall Rebuild', category: 'wall', icon: '🧱' },
    { name: 'Wall Regen', category: 'wall', icon: '🧱' },
    { name: 'Wall Thorns', category: 'wall', icon: '🧱' },
    { name: 'Protector Damage Reduction', category: 'wall', icon: '🧱' },
    { name: 'Protector Health', category: 'wall', icon: '🧱' },
    { name: 'Protector Radius', category: 'wall', icon: '🧱' },

    // Perks & Cards
    { name: 'Auto Pick Perks', category: 'perks', icon: '🎯' },
    { name: 'Auto Pick Ranking', category: 'perks', icon: '🎯' },
    { name: 'Ban Perks', category: 'perks', icon: '🎯' },
    { name: 'Card Presets', category: 'perks', icon: '🎯' },
    { name: 'First Perk Choice', category: 'perks', icon: '🎯' },
    { name: 'Improve Trade-off Perks', category: 'perks', icon: '🎯' },
    { name: 'Perk Option Quantity', category: 'perks', icon: '🎯' },
    { name: 'Standard Perks Bonus', category: 'perks', icon: '🎯' },
    { name: 'Unlock Perks', category: 'perks', icon: '🎯' },

    // Enemies
    { name: 'Boss Attack', category: 'enemies', icon: '👾' },
    { name: 'Boss Health', category: 'enemies', icon: '👾' },
    { name: 'Common Enemy Attack', category: 'enemies', icon: '👾' },
    { name: 'Common Enemy Health', category: 'enemies', icon: '👾' },
    { name: 'Fast Enemy Attack', category: 'enemies', icon: '👾' },
    { name: 'Fast Enemy Health', category: 'enemies', icon: '👾' },
    { name: 'Fast Enemy Speed', category: 'enemies', icon: '👾' },
    { name: 'Ranged Enemy Attack', category: 'enemies', icon: '👾' },
    { name: 'Ranged Enemy Health', category: 'enemies', icon: '👾' },
    { name: 'Tank Enemy Attack', category: 'enemies', icon: '👾' },
    { name: 'Tank Enemy Health', category: 'enemies', icon: '👾' },
    { name: 'Enemy Attack Level Skip', category: 'enemies', icon: '👾' },
    { name: 'Enemy Health Level Skip', category: 'enemies', icon: '👾' },

    // Utility & QOL
    { name: 'Buy Multiplier', category: 'utility', icon: '⚙️' },
    { name: 'Game Speed', category: 'utility', icon: '⚙️' },
    { name: 'Lab Speed', category: 'utility', icon: '⚙️' },
    { name: 'More Round Stats', category: 'utility', icon: '⚙️' },
    { name: 'Package After Boss', category: 'utility', icon: '⚙️' },
    { name: 'Recovery Package Amount', category: 'utility', icon: '⚙️' },
    { name: 'Recovery Package Chance', category: 'utility', icon: '⚙️' },
    { name: 'Recovery Package Max', category: 'utility', icon: '⚙️' },
    { name: 'Shockwave Size', category: 'utility', icon: '⚙️' },
    { name: 'Spotlight Coin Bonus', category: 'utility', icon: '⚙️' },
    { name: 'Target Priority', category: 'utility', icon: '⚙️' },
    { name: 'Waves Required', category: 'utility', icon: '⚙️' },
    { name: 'Second Wind Blast', category: 'utility', icon: '⚙️' },

    // Workshop & Modules
    { name: 'Workshop Attack Discount', category: 'workshop', icon: '🏭' },
    { name: 'Workshop Defense Discount', category: 'workshop', icon: '🏭' },
    { name: 'Workshop Utility Discount', category: 'workshop', icon: '🏭' },
    { name: 'Workshop Enhancements', category: 'workshop', icon: '🏭' },
    { name: 'Workshop Respec', category: 'workshop', icon: '🏭' },
    { name: 'Module Coin Cost', category: 'workshop', icon: '🏭' },
    { name: 'Module Shards Cost', category: 'workshop', icon: '🏭' },
    { name: 'Unmerge Module', category: 'workshop', icon: '🏭' },

    // Drops & Loot
    { name: 'Common Drop Chance', category: 'drops', icon: '📦' },
    { name: 'Rare Drop Chance', category: 'drops', icon: '📦' },
    { name: 'Daily Mission shards', category: 'drops', icon: '📦' },
    { name: 'Reroll Daily Mission', category: 'drops', icon: '📦' },
    { name: 'Reroll Shards', category: 'drops', icon: '📦' },
    { name: 'Shatter Shards', category: 'drops', icon: '📦' },

    // Recharge
    { name: 'Recharge Demon Mode', category: 'recharge', icon: '🔋' },
    { name: 'Recharge Missile Barrage', category: 'recharge', icon: '🔋' },
    { name: 'Recharge Nuke', category: 'recharge', icon: '🔋' },
    { name: 'Recharge Second Wind', category: 'recharge', icon: '🔋' }
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
