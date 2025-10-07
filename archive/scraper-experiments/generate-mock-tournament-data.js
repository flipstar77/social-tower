/**
 * Generate mock tournament data for testing bracket difficulty analyzer
 * This creates realistic tournament data so we can demo the feature
 *
 * Usage: node scripts/generate-mock-tournament-data.js
 */

const SupabaseManager = require('../supabase-config');

// Realistic player names and wave distributions
const PLAYER_NAMES = [
    'Skye', 'RonMV', 'silverbullet', 'Teaj', 'TeapotMaster', 'Saudade', '_jaegermaster_',
    'Greeny', 'ImmortalCorrupter', 'overbuzzy', 'BirdsArentReal', 'unhappy', 'Petty',
    'fiy', 'you', 'm3nac3_mlrc', 'mperorL', 'kohlenberg.jk', 'naran8766', 'gibleis',
    'MAYUKI', 'lord_alamo', 'Nex', '.ugurdemirel', 'jaimecbk', '_tokarev', 'martingale3072',
    'Lurchhole', 'joshT008', 'SprayNPray', 'johncarter54', 'veets', 'pvvsl', 'Fimo',
    'twempo', 'Overlord', 'Halsberg', 'JEGB', 'Haz', 'meatwad', 'Assassin4587',
    'villora', 'heheh', 'Nuffle', 'jason', 'Putin', 'Andrey', 'M75T', 'BeauK604'
];

/**
 * Generate realistic wave counts based on league
 */
function generateWaves(league, rank, bracketDifficulty) {
    const baseWaves = {
        'Legend': { min: 4500, max: 6500, topPlayer: 6000 },
        'Champion': { min: 1700, max: 2300, topPlayer: 2100 },
        'Platinum': { min: 2000, max: 3000, topPlayer: 2700 },
        'Gold': { min: 1800, max: 2900, topPlayer: 2600 },
        'Silver': { min: 400, max: 800, topPlayer: 700 },
        'Copper': { min: 600, max: 2500, topPlayer: 2200 }
    };

    const config = baseWaves[league] || baseWaves['Legend'];

    // Difficulty modifier affects wave distribution
    // Easy bracket = lower waves needed to win
    // Hard bracket = higher waves needed to compete
    const difficultyMod = (bracketDifficulty - 50) / 100; // -0.5 to +0.5

    // Top players get higher waves
    const rankPenalty = (rank - 1) * 0.08; // 8% drop per rank
    const baseWave = config.topPlayer * (1 - rankPenalty);

    // Add difficulty modifier
    const adjustedWave = baseWave * (1 + difficultyMod * 0.3);

    // Add some randomness
    const variance = adjustedWave * 0.05;
    const finalWave = Math.floor(adjustedWave + (Math.random() - 0.5) * variance);

    return Math.max(config.min, Math.min(config.max, finalWave));
}

/**
 * Generate random player ID
 */
function generatePlayerId() {
    const chars = '0123456789ABCDEF';
    let id = '';
    for (let i = 0; i < 16; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

/**
 * Generate random bracket ID
 */
function generateBracketId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < 16; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

/**
 * Generate mock tournament data for a league
 */
async function generateMockTournament(league, numBrackets = 50) {
    console.log(`🎲 Generating mock tournament for ${league} league...`);
    console.log(`   Creating ${numBrackets} brackets with 30 players each\n`);

    const supabase = new SupabaseManager();
    if (!supabase || !supabase.supabase) {
        console.error('❌ Supabase not configured');
        return;
    }

    const tournamentDate = new Date();
    const records = [];

    // Your player ID (we'll insert you into one bracket)
    const yourPlayerId = '188EAC641A3EBC7A';
    let yourInserted = false;

    for (let bracketNum = 0; bracketNum < numBrackets; bracketNum++) {
        const bracketId = generateBracketId();
        const bracketDifficulty = Math.random() * 100; // 0-100, affects wave distribution

        const players = [];

        // Generate 30 players per bracket
        for (let rank = 1; rank <= 30; rank++) {
            const isYou = !yourInserted && bracketNum === Math.floor(numBrackets / 2) && rank === 4;

            const playerId = isYou ? yourPlayerId : generatePlayerId();
            const playerName = isYou ? 'YourName' : PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
            const wave = generateWaves(league, rank, bracketDifficulty);

            players.push({
                playerId,
                playerName,
                wave,
                rank
            });

            if (isYou) yourInserted = true;
        }

        // Sort by wave (highest first)
        players.sort((a, b) => b.wave - a.wave);

        // Recalculate ranks after sorting
        players.forEach((player, index) => {
            player.rank = index + 1;
        });

        // Calculate bracket stats
        const waves = players.map(p => p.wave);
        const medianWave = waves.sort((a, b) => a - b)[Math.floor(waves.length / 2)];
        const totalWaves = waves.reduce((a, b) => a + b, 0);

        // Create database records
        players.forEach(player => {
            records.push({
                tournament_date: tournamentDate.toISOString(),
                league: league.toLowerCase(),
                bracket_id: bracketId,
                player_id: player.playerId,
                player_name: player.playerName,
                real_name: player.playerName.toLowerCase(),
                wave: player.wave,
                rank: player.rank,
                relic: null,
                bracket_median_wave: medianWave,
                bracket_total_waves: totalWaves
            });
        });

        if ((bracketNum + 1) % 10 === 0) {
            console.log(`   ✅ Generated ${bracketNum + 1}/${numBrackets} brackets...`);
        }
    }

    console.log(`\n💾 Inserting ${records.length} records into database...`);

    // Insert in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const { error } = await supabase.supabase
            .from('tournament_brackets')
            .insert(batch);

        if (error) {
            console.error(`❌ Error inserting batch:`, error.message);
        } else {
            console.log(`   ✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)`);
        }
    }

    console.log('\n✅ Mock tournament data generated!');
    console.log(`   League: ${league}`);
    console.log(`   Brackets: ${numBrackets}`);
    console.log(`   Total players: ${records.length}`);
    console.log(`   Your player ID: ${yourPlayerId} ${yourInserted ? '(inserted)' : '(not inserted - try again)'}`);
}

// Main execution
async function main() {
    const league = process.argv[2] || 'Legend';
    const numBrackets = parseInt(process.argv[3]) || 50;

    console.log('🎮 Mock Tournament Data Generator\n');
    console.log('=' .repeat(60));

    await generateMockTournament(league, numBrackets);

    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('1. Run the demo script:');
    console.log(`   node scripts/scrape-tournament-demo.js ${league}`);
    console.log('\n2. Or visit the web interface:');
    console.log('   http://localhost:6078/bracket-difficulty.html');
    console.log('\n3. Or use the API:');
    console.log(`   GET /api/tournament-brackets/difficulty/188EAC641A3EBC7A?league=${league}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    });
