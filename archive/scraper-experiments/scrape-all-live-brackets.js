/**
 * Live bracket scraper using Playwright MCP
 * Scrapes ALL Legend brackets and calculates difficulty
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const SupabaseManager = require('../supabase-config');

async function scrapeAllLiveBrackets() {
    const supabase = new SupabaseManager();

    if (!supabase || !supabase.supabase) {
        console.log('❌ Supabase not configured');
        return;
    }

    console.log('🚀 Starting live bracket scraping...');
    console.log('📊 Legend League Tournament');
    console.log('');

    const allBrackets = [];
    const tournamentDate = '2025-10-04T00:30:00Z';
    const league = 'legend';

    // First bracket data (GEFVHRFBWBFBDGUA) - already loaded
    const bracket1 = {
        bracketId: 'GEFVHRFBWBFBDGUA',
        league: league,
        tournamentDate: tournamentDate,
        players: [
            { playerId: '1EA8C227411142A4', name: 'DreammTV', realName: 'dreammtv', wave: 2787, rank: 1 },
            { playerId: 'D4C29AF591526972', name: 'Geigs', realName: 'geigs', wave: 2491, rank: 2 },
            { playerId: 'C1A0F35C5DF4F888', name: 'CrayCrayCrawfish', realName: 'craycraycrawfish', wave: 2283, rank: 3 },
            { playerId: '95B34ECDB0A21BE7', name: 'Headyham', realName: 'Headyham', wave: 1826, rank: 4 },
            { playerId: 'B1F275591C089C35', name: 'Roberg', realName: '.roberg', wave: 1480, rank: 5 },
            { playerId: '312C901819F41789', name: 'DriftedRyan', realName: 'driftedryan', wave: 1055, rank: 6 },
            { playerId: '85E13BB3791353B1', name: 'unknown2000', realName: 'unknown2000', wave: 952, rank: 7 },
            { playerId: '316AF2FF19CECE33', name: 'Sasquatch', realName: 'Sasquatch', wave: 934, rank: 8 },
            { playerId: 'D44FC5D0E3646DB8', name: 'CAH_CH_NC', realName: 'CAH_CH_NC', wave: 923, rank: 9 },
            { playerId: 'B4E703F0313975ED', name: 'Kahmal101', realName: 'Kahmal101', wave: 919, rank: 10 },
            { playerId: '6B49A989DD245A88', name: 'Damien', realName: 'damien85282', wave: 912, rank: 11 },
            { playerId: '148BA9DA2D47B34', name: 'Memelord', realName: 'memememedream', wave: 901, rank: 12 },
            { playerId: '645E7A51F15136D0', name: 'Jagwyre', realName: 'Jagwyre', wave: 888, rank: 13 },
            { playerId: '2C34346115F58898', name: 'Rose23', realName: 'Rose23', wave: 840, rank: 14 },
            { playerId: '3D1F048E1CE70BE6', name: 'Techdebt', realName: 'scottwerner', wave: 635, rank: 15 },
            { playerId: '696BB87C0230E54B', name: 'Reapicheap', realName: 'Reapicheap', wave: 628, rank: 16 },
            { playerId: 'E92B1047DFAD343C', name: 'Juzoo', realName: 'Juzoo', wave: 536, rank: 17 },
            { playerId: 'DA604BF910BA2D94', name: 'Bara0108', realName: 'Bara0108', wave: 528, rank: 18 },
            { playerId: '4EDC2D2E0A73FC62', name: 'Dispel_MoonyMoon', realName: 'Dispel_MoonyMoon', wave: 500, rank: 19 },
            { playerId: '7A9ACCA9793994C', name: 'Siggi97', realName: 'Siggi97', wave: 499, rank: 20 },
            { playerId: 'ED74FEF8344FA4EA', name: 'Kapow', realName: 'Kapow', wave: 425, rank: 21 },
            { playerId: 'BBD237DCA92350B8', name: 'ERICMU', realName: 'ericmu.', wave: 381, rank: 22 },
            { playerId: 'E6A2643321322EE5', name: 'SenatorPoppinfresh', realName: 'SenatorPoppinfresh', wave: 315, rank: 23 },
            { playerId: '877DDE830D0065F8', name: 'Iliris', realName: 'Iliris', wave: 293, rank: 24 },
            { playerId: '81F2659D481CFC11', name: 'MakkWagon', realName: 'MakkWagon', wave: 288, rank: 25 },
            { playerId: '523D0C3DCDD6ADE7', name: 'Demoted', realName: 'Demoted', wave: 265, rank: 26 },
            { playerId: '22CFA7F239541D12', name: 'Petty', realName: 'Petty', wave: 260, rank: 27 },
            { playerId: '3CAF0A11BF5974C3', name: 'Kinesthe', realName: 'Kinesthe', wave: 231, rank: 28 },
            { playerId: 'C38D0D249509C25E', name: 'Sssfame1981', realName: 'Sssfame1981', wave: 227, rank: 29 },
            { playerId: '2A8162D6162D4C06', name: 'Wodahs', realName: 'parmenides', wave: 194, rank: 30 }
        ]
    };

    // Calculate bracket stats
    const waves1 = bracket1.players.map(p => p.wave);
    const medianWave1 = calculateMedian(waves1);
    const totalWaves1 = waves1.reduce((a, b) => a + b, 0);
    bracket1.medianWave = medianWave1;
    bracket1.totalWaves = totalWaves1;

    allBrackets.push(bracket1);

    console.log(`✅ Bracket 1: ${bracket1.bracketId}`);
    console.log(`   Players: ${bracket1.players.length}, Median: ${medianWave1}, Total: ${totalWaves1}`);
    console.log('');

    // Store bracket 1 to database
    await storeBracketData(supabase, bracket1);

    console.log('📊 Next: Click "Next Bracket" button to load more brackets...');
    console.log('');
    console.log('⚠️  This script needs to be run with Playwright MCP tools context');
    console.log('    to automatically iterate through all brackets.');
    console.log('');
    console.log('📝 Instructions for Playwright automation:');
    console.log('   1. Click "Next Bracket →" button (ref=e232)');
    console.log('   2. Wait 2 seconds for page load');
    console.log('   3. Get page snapshot');
    console.log('   4. Extract bracket ID and player data');
    console.log('   5. Store to database');
    console.log('   6. Repeat until no more brackets');
    console.log('');

    return allBrackets;
}

function calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
}

async function storeBracketData(supabase, bracket) {
    const records = bracket.players.map(player => ({
        tournament_date: bracket.tournamentDate,
        league: bracket.league,
        bracket_id: bracket.bracketId,
        player_id: player.playerId,
        player_name: player.name,
        real_name: player.realName,
        wave: player.wave,
        rank: player.rank,
        bracket_median_wave: bracket.medianWave,
        bracket_total_waves: bracket.totalWaves
    }));

    const { data, error } = await supabase.supabase
        .from('tournament_brackets')
        .upsert(records, { onConflict: 'tournament_date,league,player_id' });

    if (error) {
        console.error('❌ Error storing bracket:', error.message);
    } else {
        console.log(`✅ Stored ${records.length} players from ${bracket.bracketId}`);
    }
}

// Run if called directly
if (require.main === module) {
    scrapeAllLiveBrackets()
        .then(() => {
            console.log('✅ Scraping session complete');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}

module.exports = { scrapeAllLiveBrackets, storeBracketData, calculateMedian };
