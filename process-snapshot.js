/**
 * Process a snapshot file and store to database
 */
require('dotenv').config({ path: __dirname + '/server/.env' });
const fs = require('fs');
const SupabaseManager = require('./server/supabase-config.js');
const { calculateMedian } = require('./server/scripts/scrape-all-live-brackets.js');

async function processSnapshot(snapshotText) {
    // Extract bracket ID
    const bracketMatch = snapshotText.match(/combobox "Selected ([A-Z0-9]+)\./);
    if (!bracketMatch) {
        console.error('❌ Could not find bracket ID');
        return null;
    }
    const bracketId = bracketMatch[1];

    // Extract all player rows
    const players = [];
    const lines = snapshotText.split('\n');

    for (const line of lines) {
        const rowMatch = line.match(/row "(\d+) ([A-F0-9]+) ([^\s]+) ([^\s]+) (\d+) 2025-10-\d+ \d+:\d+:\d+"/);
        if (rowMatch) {
            const [_, rank, playerId, name, realName, wave] = rowMatch;
            players.push({
                rank: parseInt(rank),
                playerId: playerId,
                name: name,
                realName: realName,
                wave: parseInt(wave)
            });
        }
    }

    if (players.length === 0) {
        console.error('❌ No players found in snapshot');
        return null;
    }

    console.log(`✅ Extracted bracket ${bracketId} with ${players.length} players`);

    // Calculate stats
    const waves = players.map(p => p.wave);
    const medianWave = calculateMedian(waves);
    const totalWaves = waves.reduce((a, b) => a + b, 0);

    const bracket = {
        bracketId,
        league: 'legend',
        tournamentDate: '2025-10-04T00:30:00Z',
        players,
        medianWave,
        totalWaves
    };

    return bracket;
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
        return false;
    } else {
        console.log(`✅ Stored ${records.length} players from ${bracket.bracketId} (Median: ${bracket.medianWave}, Total: ${bracket.totalWaves})`);
        return true;
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Usage: node process-snapshot.js <snapshot-file>');
        process.exit(1);
    }

    const snapshotFile = args[0];
    const snapshotText = fs.readFileSync(snapshotFile, 'utf8');

    processSnapshot(snapshotText)
        .then(async (bracket) => {
            if (!bracket) {
                process.exit(1);
            }

            // Store to database
            const supabase = new SupabaseManager();
            if (!supabase.supabase) {
                console.error('❌ Database not configured');
                process.exit(1);
            }

            const success = await storeBracketData(supabase, bracket);

            // Output bracket ID for tracking
            console.log('BRACKET_ID:', bracket.bracketId);
            console.log('PLAYER_COUNT:', bracket.players.length);
            console.log('MEDIAN_WAVE:', bracket.medianWave);

            // Check if target player is in this bracket
            const targetPlayer = bracket.players.find(p => p.playerId === '188EAC641A3EBC7A');
            if (targetPlayer) {
                console.log('🎯 TARGET_PLAYER_FOUND:', targetPlayer.rank);
            }

            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}

module.exports = { processSnapshot, storeBracketData };
