/**
 * Scrape ALL Legend league brackets from thetower.lol
 * This will collect data to calculate bracket difficulty for player 188EAC641A3EBC7A
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const SupabaseManager = require('../supabase-config');

async function scrapeLegendBrackets() {
    console.log('🏆 Starting Legend League Tournament Scrape...\n');

    const supabase = new SupabaseManager();

    // Tournament info from live data
    const tournamentDate = '2025-10-04T01:00:00Z';
    const league = 'legend';

    console.log(`📅 Tournament Date: ${tournamentDate}`);
    console.log(`🎖️  League: ${league.toUpperCase()}\n`);

    // Your bracket data (from the browser scrape)
    const yourBracketId = 'BRACKET_LEGEND_17_544';  // We'll use a unique ID based on your position
    const yourBracket = {
        bracketId: yourBracketId,
        league: league,
        tournamentDate: tournamentDate,
        players: [
            { playerId: '215FD28FC52D8C91', name: 'ExiledFarmer', realName: 'nomadic_one', wave: 4018, rank: 1 },
            { playerId: '2CD4D68FD3994F68', name: 'DragnAcolyte', realName: 'dragnacolyte', wave: 2429, rank: 2 },
            { playerId: 'A16CA7F64E3B55D6', name: 'Silvers', realName: 'smb55', wave: 2313, rank: 3 },
            { playerId: '51C1CB681E0A58B2', name: 'CoreyTae', realName: 'coreytae', wave: 1455, rank: 4 },
            { playerId: '73C6AA450C71C41A', name: 'szx', realName: 'szx', wave: 1351, rank: 5 },
            { playerId: '247DBA0A2A41DD8C', name: 'ogeretsu', realName: 'ogeretsu', wave: 903, rank: 6 },
            { playerId: '96CA020CF6050BDD', name: 'ElectedCreature', realName: 'ElectedCreature', wave: 826, rank: 7 },
            { playerId: '845B236F1B40EF9', name: 'oorein', realName: 'oorein', wave: 812, rank: 8 },
            { playerId: 'EA7D662EA42E5543', name: 'Drath', realName: 'Drath', wave: 772, rank: 9 },
            { playerId: 'AB3F6FCBECEE6B60', name: 'Amadis', realName: 'Amadis', wave: 766, rank: 10 },
            { playerId: '695F0EA397928D0C', name: 'Croninc7', realName: 'Croninc7', wave: 738, rank: 11 },
            { playerId: '4C7AF422287F0173', name: 'HereComeDatBoi', realName: 'ostboi', wave: 728, rank: 12 },
            { playerId: 'F17E39096DAAC65F', name: 'AllHailMe', realName: 'allhailme', wave: 675, rank: 13 },
            { playerId: 'DB52117FA6F6ECBF', name: 'Linze', realName: '_linze', wave: 659, rank: 14 },
            { playerId: '12BA6B8B34CFC58B', name: 'IchabodCranium', realName: 'IchabodCranium', wave: 626, rank: 15 },
            { playerId: 'EF9839BFCB418A71', name: 'bibou', realName: 'bibou', wave: 582, rank: 16 },
            { playerId: '188EAC641A3EBC7A', name: 'TowerOfTobi', realName: 'mrflipstar', wave: 544, rank: 17 }, // YOU
            { playerId: '8FC5091D6012E15', name: 'Herrboarder', realName: 'Herrboarder', wave: 535, rank: 18 },
            { playerId: 'FADF16ECE1EA8206', name: 'altema', realName: 'altema', wave: 523, rank: 19 },
            { playerId: '75A5E2F726BA859A', name: 'qntum23', realName: 'qntum23', wave: 516, rank: 20 },
            { playerId: 'A29AB3179716CE27', name: 'rbuchmeier', realName: 'mariomarine', wave: 485, rank: 21 },
            { playerId: '467318625945C3CC', name: 'mjz', realName: 'mjz', wave: 480, rank: 22 },
            { playerId: '29B33EDEF75A75BA', name: 'sou', realName: 'sou', wave: 473, rank: 23 },
            { playerId: '578FB52587EBF970', name: 'Radiance', realName: '.radiance', wave: 439, rank: 24 },
            { playerId: '1325494AB7AC6D06', name: 'AshyLary', realName: 'hinklem3', wave: 435, rank: 25 },
            { playerId: 'ADDCD5757402C493', name: 'deadeye', realName: 'deadeye', wave: 349, rank: 26 },
            { playerId: '378EBDBCE4BB3487', name: 'JokerQuy', realName: 'jokerquy', wave: 305, rank: 27 },
            { playerId: 'AC573BA51488DC76', name: 'ItIsMe', realName: 'ItIsMe', wave: 243, rank: 28 },
            { playerId: '5DBDB58AB4C0272', name: 'MoT3rror', realName: 'mot3rror', wave: 214, rank: 29 },
            { playerId: '5E16C5D467F04D13', name: 'drippp', realName: 'drippp', wave: 213, rank: 30 }
        ]
    };

    // Calculate bracket stats
    const waves = yourBracket.players.map(p => p.wave);
    const sortedWaves = [...waves].sort((a, b) => a - b);
    const medianWave = sortedWaves[Math.floor(sortedWaves.length / 2)];
    const totalWaves = waves.reduce((sum, w) => sum + w, 0);
    const avgWave = Math.round(totalWaves / waves.length);

    console.log(`📊 Your Bracket Stats:`);
    console.log(`   Bracket ID: ${yourBracketId}`);
    console.log(`   Players: ${yourBracket.players.length}`);
    console.log(`   Median Wave: ${medianWave}`);
    console.log(`   Average Wave: ${avgWave}`);
    console.log(`   Total Waves: ${totalWaves.toLocaleString()}`);
    console.log(`   Top Wave: ${Math.max(...waves).toLocaleString()}`);
    console.log(`   Bottom Wave: ${Math.min(...waves).toLocaleString()}\n`);

    // Find your performance
    const yourPlayer = yourBracket.players.find(p => p.playerId === '188EAC641A3EBC7A');

    console.log(`👤 YOUR PERFORMANCE:`);
    console.log(`   Player: ${yourPlayer.realName} (${yourPlayer.name})`);
    console.log(`   Rank: #${yourPlayer.rank} / 30`);
    console.log(`   Wave: ${yourPlayer.wave.toLocaleString()}`);
    console.log(`   vs Median: ${yourPlayer.wave > medianWave ? `+${yourPlayer.wave - medianWave}` : medianWave - yourPlayer.wave} waves ${yourPlayer.wave > medianWave ? 'above' : 'below'}`);
    console.log(`   vs Average: ${yourPlayer.wave > avgWave ? `+${yourPlayer.wave - avgWave}` : avgWave - yourPlayer.wave} waves ${yourPlayer.wave > avgWave ? 'above' : 'below'}\n`);

    // Store to database
    console.log('💾 Storing tournament data to Supabase...');

    const records = yourBracket.players.map(player => ({
        tournament_date: yourBracket.tournamentDate,
        league: yourBracket.league,
        bracket_id: yourBracket.bracketId,
        player_id: player.playerId,
        player_name: player.name,
        real_name: player.realName,
        wave: player.wave,
        rank: player.rank,
        bracket_median_wave: medianWave,
        bracket_total_waves: totalWaves
    }));

    try {
        const { data, error } = await supabase.supabase
            .from('tournament_brackets')
            .upsert(records, {
                onConflict: 'tournament_date,league,player_id'
            });

        if (error) {
            console.error('❌ Database error:', error.message);
            return;
        }

        console.log(`✅ Stored ${records.length} player records\n`);

        // Now calculate bracket difficulty (simplified - would compare across multiple brackets)
        console.log('🎯 BRACKET DIFFICULTY ANALYSIS:');
        console.log(`   To calculate full difficulty, we need to scrape ALL Legend brackets.`);
        console.log(`   For now, showing analysis within your bracket:\n`);

        // How many players had higher waves than you?
        const playersAbove = yourBracket.players.filter(p => p.wave > yourPlayer.wave).length;
        const playersBelow = yourBracket.players.filter(p => p.wave < yourPlayer.wave).length;

        console.log(`   Players with higher waves: ${playersAbove}`);
        console.log(`   Players with lower waves: ${playersBelow}`);
        console.log(`   Your percentile in bracket: ${Math.round((playersBelow / 30) * 100)}th percentile\n`);

        console.log(`💡 NEXT STEPS:`);
        console.log(`   1. Scrape ALL Legend league brackets (not just yours)`);
        console.log(`   2. For each bracket, simulate where you would rank with wave ${yourPlayer.wave}`);
        console.log(`   3. Calculate difficulty score: % of brackets where you'd do worse\n`);

        console.log(`   Example: If you'd rank worse in 70% of other brackets,`);
        console.log(`            your difficulty score = 70 (easier bracket, got lucky!)\n`);

        // Store simplified analysis result
        console.log('💾 Storing bracket difficulty analysis...');

        const analysisRecord = {
            discord_user_id: 'YOUR_DISCORD_ID', // Would come from tower_runs table
            run_id: null, // Would link to specific run
            league: league,
            wave: yourPlayer.wave,
            difficulty_score: null, // Need multiple brackets to calculate
            difficulty_label: 'Pending', // Need multiple brackets
            actual_rank: yourPlayer.rank,
            best_possible_rank: yourPlayer.rank, // Would calculate from all brackets
            worst_possible_rank: yourPlayer.rank, // Would calculate from all brackets
            average_rank: yourPlayer.rank, // Would calculate from all brackets
            total_brackets_analyzed: 1, // Only have 1 bracket so far
            percentile_vs_winners: null // Need multiple brackets
        };

        const { data: analysisData, error: analysisError } = await supabase.supabase
            .from('bracket_difficulty_analysis')
            .insert(analysisRecord);

        if (analysisError && !analysisError.message.includes('unique')) {
            console.error('❌ Analysis storage error:', analysisError.message);
        } else {
            console.log('✅ Stored preliminary analysis record\n');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        console.error(err.stack);
    }

    console.log('✅ Script complete!');
    console.log('\n🚀 To get full bracket difficulty:');
    console.log('   Run this scraper for ALL brackets in the tournament');
    console.log('   The automation service will do this automatically every 3 days\n');
}

// Run it
scrapeLegendBrackets().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
