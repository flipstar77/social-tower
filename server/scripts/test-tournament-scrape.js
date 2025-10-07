/**
 * Test script to scrape tournament data from thetower.lol
 * Uses the Live Results page to get all players and their brackets
 */

const SupabaseManager = require('../supabase-config');

// Parse table data from snapshot
function parseTableData(snapshot) {
    const players = [];

    // Find the table rowgroup with data
    function findTableRows(obj, path = []) {
        if (!obj || typeof obj !== 'object') return null;

        // Look for table structure
        if (obj.rowgroup && Array.isArray(obj.rowgroup)) {
            return obj.rowgroup;
        }

        // Recursively search
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                for (let i = 0; i < obj[key].length; i++) {
                    const result = findTableRows(obj[key][i], [...path, key, i]);
                    if (result) return result;
                }
            } else if (typeof obj[key] === 'object') {
                const result = findTableRows(obj[key], [...path, key]);
                if (result) return result;
            }
        }

        return null;
    }

    // Extract rows from snapshot
    const rowgroups = findTableRows(snapshot);

    if (!rowgroups || rowgroups.length < 2) {
        console.log('⚠️ Could not find table data in snapshot');
        return players;
    }

    // Skip first rowgroup (headers), process data rows
    const dataRows = rowgroups[1].row || [];

    for (const row of dataRows) {
        if (!row.cell || row.cell.length < 6) continue;

        try {
            const rank = parseInt(row.cell[0]);
            const playerId = row.cell[1].link?.[0]?.link?.[0]?.['/url']?.split('player=')[1] || row.cell[1];
            const name = row.cell[2];
            const realName = row.cell[3].link?.[0] || row.cell[3];
            const wave = parseInt(row.cell[4]) || 0;
            const datetime = row.cell[5];

            if (playerId && wave) {
                players.push({
                    rank,
                    playerId,
                    name,
                    realName,
                    wave,
                    datetime
                });
            }
        } catch (err) {
            console.log('⚠️ Error parsing row:', err.message);
        }
    }

    return players;
}

// Main scraping function
async function scrapeTournamentData() {
    console.log('🎯 Starting tournament data scrape...\n');

    const supabase = new SupabaseManager();

    // For now, use the example data structure we saw
    // This would normally come from Playwright browser navigation

    // Example: Your bracket data (Silver league, bracket started 2025-10-04)
    const exampleBracket = {
        bracketId: 'EXAMPLE_BRACKET_001',
        league: 'silver',
        tournamentDate: '2025-10-04T01:00:00Z',
        players: [
            {
                playerId: '215FD28FC52D8C91',
                name: 'ExiledFarmer',
                realName: 'nomadic_one',
                wave: 4018,
                rank: 1
            },
            {
                playerId: '2CD4D68FD3994F68',
                name: 'DragnAcolyte',
                realName: 'dragnacolyte',
                wave: 2429,
                rank: 2
            },
            {
                playerId: 'A16CA7F64E3B55D6',
                name: 'Silvers',
                realName: 'smb55',
                wave: 2313,
                rank: 3
            },
            {
                playerId: '188EAC641A3EBC7A',
                name: 'TowerOfTobi',
                realName: 'mrflipstar',
                wave: 544,
                rank: 17
            }
            // ... other 26 players
        ]
    };

    console.log(`📊 Example Bracket: ${exampleBracket.bracketId}`);
    console.log(`   League: ${exampleBracket.league}`);
    console.log(`   Tournament Date: ${exampleBracket.tournamentDate}`);
    console.log(`   Players: ${exampleBracket.players.length}\n`);

    // Calculate bracket stats
    const waves = exampleBracket.players.map(p => p.wave);
    const medianWave = waves.sort((a, b) => a - b)[Math.floor(waves.length / 2)];
    const totalWaves = waves.reduce((sum, w) => sum + w, 0);

    console.log(`📈 Bracket Stats:`);
    console.log(`   Median Wave: ${medianWave}`);
    console.log(`   Total Waves: ${totalWaves}`);
    console.log(`   Average Wave: ${Math.round(totalWaves / waves.length)}\n`);

    // Store to database
    console.log('💾 Storing bracket data to Supabase...');

    const records = exampleBracket.players.map(player => ({
        tournament_date: exampleBracket.tournamentDate,
        league: exampleBracket.league,
        bracket_id: exampleBracket.bracketId,
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
                onConflict: 'tournament_date,league,player_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('❌ Error storing data:', error.message);
            return;
        }

        console.log(`✅ Stored ${records.length} player records to database`);

        // Now find your player and calculate bracket difficulty
        console.log('\n🎯 Analyzing bracket difficulty for player 188EAC641A3EBC7A...');

        const yourPlayer = exampleBracket.players.find(p => p.playerId === '188EAC641A3EBC7A');

        if (yourPlayer) {
            console.log(`\n👤 Your Performance:`);
            console.log(`   Name: ${yourPlayer.realName}`);
            console.log(`   Rank: #${yourPlayer.rank}`);
            console.log(`   Wave: ${yourPlayer.wave}`);

            // In a real scenario, we would compare across all brackets
            // For now, just show the concept
            console.log(`\n💡 Bracket Difficulty Analysis:`);
            console.log(`   Your bracket median: ${medianWave}`);
            console.log(`   Your wave vs median: ${yourPlayer.wave > medianWave ? 'Above' : 'Below'} average`);
            console.log(`\n   To get full difficulty score, we need data from multiple brackets.`);
            console.log(`   The scraper will collect all brackets from the same league and tournament.`);
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }

    console.log('\n✅ Test scrape complete!');
}

// Run the script
scrapeTournamentData().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
