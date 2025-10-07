/**
 * REAL Playwright scraper - Scrapes ALL Legend league brackets from thetower.lol
 * This uses Playwright MCP tools to actually navigate the website
 *
 * Usage: Run this script manually or via automation service
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const SupabaseManager = require('../supabase-config');

// NOTE: This script is designed to be called from a context where Playwright MCP tools are available
// For standalone execution, you would need to initialize Playwright separately

async function scrapeAllBracketsWithPlaywright(playwr ightTools) {
    console.log('🌐 Starting REAL Playwright bracket scraper...\n');

    const supabase = new SupabaseManager();
    const tournamentDate = new Date().toISOString();
    const league = 'legend';

    const allBrackets = [];
    let bracketCount = 0;

    try {
        console.log('1️⃣ Navigating to Live Bracket view...');
        await playwrightTools.navigate('https://thetower.lol/livebracketview');
        await playwrightTools.wait(5);

        console.log('2️⃣ Selecting Legend league...');
        // Click Legend radio button
        await playwrightTools.click('Legend radio', 'e888'); // ref from snapshot
        await playwrightTools.wait(3);

        console.log('3️⃣ Starting bracket iteration...\n');

        let hasMoreBrackets = true;
        let consecutiveErrors = 0;

        while (hasMoreBrackets && consecutiveErrors < 3) {
            try {
                // Get current page snapshot
                const snapshot = await playwrightTools.snapshot();

                // Extract bracket ID from snapshot
                const bracketId = extractBracketId(snapshot);

                if (!bracketId) {
                    console.log('⚠️ Could not find bracket ID, stopping...');
                    break;
                }

                console.log(`📦 Scraping bracket ${bracketCount + 1}: ${bracketId}`);

                // Parse table data from snapshot
                const players = parseTableFromSnapshot(snapshot);

                if (players.length === 0) {
                    console.log('⚠️ No players found in bracket');
                    consecutiveErrors++;
                } else {
                    console.log(`   ✅ Found ${players.length} players`);

                    // Calculate bracket stats
                    const waves = players.map(p => p.wave);
                    const sortedWaves = [...waves].sort((a, b) => a - b);
                    const medianWave = sortedWaves[Math.floor(sortedWaves.length / 2)];
                    const totalWaves = waves.reduce((sum, w) => sum + w, 0);

                    allBrackets.push({
                        bracketId,
                        league,
                        tournamentDate,
                        players,
                        medianWave,
                        totalWaves
                    });

                    bracketCount++;
                    consecutiveErrors = 0;

                    // Store bracket data immediately
                    await storeBracketData(supabase, {
                        bracketId,
                        league,
                        tournamentDate,
                        players,
                        medianWave,
                        totalWaves
                    });
                }

                // Click "Next Bracket" button
                console.log('   ⏭️ Moving to next bracket...');
                await playwrightTools.click('Next Bracket button', 'e1015');
                await playwrightTools.wait(2);

                // Check if we've looped back to the first bracket
                const newSnapshot = await playwrightTools.snapshot();
                const newBracketId = extractBracketId(newSnapshot);

                if (newBracketId === allBrackets[0]?.bracketId) {
                    console.log('🔄 Looped back to first bracket, stopping...');
                    hasMoreBrackets = false;
                }

            } catch (err) {
                console.error(`❌ Error scraping bracket: ${err.message}`);
                consecutiveErrors++;
            }
        }

        console.log(`\n✅ Scraping complete! Collected ${bracketCount} brackets\n`);

        // Now calculate difficulty for all players who participated
        console.log('🎯 Calculating bracket difficulty for all players...\n');

        // Get unique players across all brackets
        const allPlayers = new Set();
        allBrackets.forEach(bracket => {
            bracket.players.forEach(player => {
                allPlayers.add(player.playerId);
            });
        });

        console.log(`👥 Found ${allPlayers.size} unique players\n`);

        // For each player, calculate their bracket difficulty
        let analysisCount = 0;

        for (const playerId of allPlayers) {
            // Find which bracket this player was in
            let playerBracket = null;
            let playerData = null;

            for (const bracket of allBrackets) {
                const found = bracket.players.find(p => p.playerId === playerId);
                if (found) {
                    playerBracket = bracket;
                    playerData = found;
                    break;
                }
            }

            if (!playerData) continue;

            // Calculate how they'd rank in all other brackets
            const rankings = allBrackets.map(bracket => {
                const playersAbove = bracket.players.filter(p => p.wave > playerData.wave).length;
                return {
                    bracketId: bracket.bracketId,
                    hypotheticalRank: playersAbove + 1
                };
            });

            const allRanks = rankings.map(r => r.hypotheticalRank);
            const bestRank = Math.min(...allRanks);
            const worstRank = Math.max(...allRanks);
            const avgRank = allRanks.reduce((a, b) => a + b, 0) / allRanks.length;

            // Calculate difficulty score
            const bracketsWouldDoWorse = rankings.filter(r => r.hypotheticalRank > playerData.rank).length;
            const difficultyScore = (bracketsWouldDoWorse / allBrackets.length) * 100;

            let difficultyLabel;
            if (difficultyScore >= 80) difficultyLabel = 'Very Easy';
            else if (difficultyScore >= 60) difficultyLabel = 'Easy';
            else if (difficultyScore >= 40) difficultyLabel = 'Medium';
            else if (difficultyScore >= 20) difficultyLabel = 'Hard';
            else difficultyLabel = 'Very Hard';

            // Store analysis
            await storePlayerAnalysis(supabase, {
                playerId,
                league,
                wave: playerData.wave,
                actualRank: playerData.rank,
                difficultyScore,
                difficultyLabel,
                bestRank,
                worstRank,
                avgRank,
                totalBrackets: allBrackets.length
            });

            analysisCount++;

            if (analysisCount % 10 === 0) {
                console.log(`   Analyzed ${analysisCount} / ${allPlayers.size} players...`);
            }
        }

        console.log(`\n✅ Analysis complete! Processed ${analysisCount} players\n`);

        return {
            bracketsScraped: bracketCount,
            playersAnalyzed: analysisCount,
            tournamentDate,
            league
        };

    } catch (err) {
        console.error('❌ Fatal scraping error:', err.message);
        throw err;
    }
}

// Helper: Extract bracket ID from snapshot
function extractBracketId(snapshot) {
    try {
        // Look for the bracket selector combobox
        const snapshotStr = JSON.stringify(snapshot);
        const match = snapshotStr.match(/"Selected\s+([A-Z0-9]{16})/);
        return match ? match[1] : null;
    } catch (err) {
        return null;
    }
}

// Helper: Parse table data from snapshot
function parseTableFromSnapshot(snapshot) {
    const players = [];

    try {
        // Find table structure in snapshot
        function findTable(obj) {
            if (!obj) return null;

            if (obj.table && Array.isArray(obj.table)) {
                return obj.table;
            }

            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    const result = findTable(obj[key]);
                    if (result) return result;
                }
            }

            return null;
        }

        const table = findTable(snapshot);
        if (!table) return players;

        // Find rowgroups
        const rowgroups = table[0]?.rowgroup;
        if (!rowgroups || rowgroups.length < 2) return players;

        // Skip header rowgroup, process data rows
        const dataRows = rowgroups[1]?.row || [];

        for (const row of dataRows) {
            if (!row.cell || row.cell.length < 6) continue;

            try {
                const rank = parseInt(row.cell[0]);
                const playerId = row.cell[1];
                const name = row.cell[2];
                const realName = row.cell[3];
                const wave = parseInt(row.cell[4]);

                if (playerId && wave) {
                    players.push({ playerId, name, realName, wave, rank });
                }
            } catch (err) {
                // Skip malformed rows
            }
        }
    } catch (err) {
        console.error('Error parsing table:', err.message);
    }

    return players;
}

// Helper: Store bracket data to database
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

    const { error } = await supabase.supabase
        .from('tournament_brackets')
        .upsert(records, {
            onConflict: 'tournament_date,league,player_id'
        });

    if (error && !error.message.includes('duplicate')) {
        console.error('   ⚠️ Storage warning:', error.message);
    }
}

// Helper: Store player analysis to database
async function storePlayerAnalysis(supabase, analysis) {
    const record = {
        discord_user_id: 'PENDING_' + analysis.playerId, // Will be matched with Discord users later
        league: analysis.league,
        wave: analysis.wave,
        difficulty_score: parseFloat(analysis.difficultyScore.toFixed(2)),
        difficulty_label: analysis.difficultyLabel,
        actual_rank: analysis.actualRank,
        best_possible_rank: analysis.bestRank,
        worst_possible_rank: analysis.worstRank,
        average_rank: parseFloat(analysis.avgRank.toFixed(2)),
        total_brackets_analyzed: analysis.totalBrackets
    };

    await supabase.supabase
        .from('bracket_difficulty_analysis')
        .upsert(record, {
            onConflict: 'discord_user_id,wave'
        });
}

// Export for use in automation service
module.exports = { scrapeAllBracketsWithPlaywright };

// For standalone testing
if (require.main === module) {
    console.log('⚠️  This script requires Playwright MCP tools to be available.');
    console.log('   It should be called from the tournament automation service.');
    console.log('   See: server/services/tournament-automation-service.js\n');
}
