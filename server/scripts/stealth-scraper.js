/**
 * FULLY AUTOMATED Tournament Bracket Scraper with STEALTH
 * Uses regular Chrome with stealth plugin - NO DETECTION!
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const SupabaseManager = require('../supabase-config');

puppeteer.use(StealthPlugin());

const supabase = new SupabaseManager();
const TOURNAMENT_DATE = '2025-10-04T00:30:00Z';
const LEAGUE = 'legend';
const TARGET_PLAYER = '188EAC641A3EBC7A';

async function scrapeAllBrackets() {
    console.log('🚀 FULLY AUTOMATED BRACKET SCRAPER (STEALTH MODE)');
    console.log('📊 Scraping ALL Legend League brackets...');
    console.log('⏰ This will take 5-10 minutes - NO APPROVAL NEEDED!\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        // Navigate to bracket view
        console.log('🌐 Loading thetower.lol...');
        await page.goto('https://thetower.lol/livebracketview', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for Streamlit to fully load the table
        console.log('⏳ Waiting for Streamlit to render table...');
        await page.waitForSelector('table tbody tr', { timeout: 30000 });

        // Wait for ALL 30 rows to load
        await page.waitForFunction(() => {
            const rows = document.querySelectorAll('table tbody tr');
            return rows.length >= 30;
        }, { timeout: 30000 });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Extra stabilization

        console.log('✅ Page loaded with 30+ rows!\n');

        const allBrackets = [];
        const seenBracketIds = new Set();
        let bracketCount = 0;
        let targetPlayerBracket = null;

        while (true) {
            bracketCount++;
            console.log(`\n📦 Scraping Bracket #${bracketCount}...`);

            // Extract bracket ID
            const bracketId = await page.evaluate(() => {
                // Look for the bracket dropdown/combobox
                const bodyText = document.body.innerText;
                const match = bodyText.match(/Selected\s+([A-Z0-9]{16})/);
                if (match) return match[1];

                // Fallback: search all text for 16-char ID pattern
                const match2 = bodyText.match(/([A-Z0-9]{16})/);
                return match2 ? match2[1] : null;
            });

            if (!bracketId) {
                console.log('⚠️  Could not extract bracket ID');
                console.log('   Taking screenshot for debugging...');
                await page.screenshot({ path: `debug-bracket-${bracketCount}.png` });
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            console.log(`   Bracket ID: ${bracketId}`);

            // Check if we've looped back
            if (seenBracketIds.has(bracketId)) {
                console.log('✅ LOOP DETECTED - All brackets scraped!');
                break;
            }

            seenBracketIds.add(bracketId);

            // Extract all 30 players from table
            const { players, debug } = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                const playerData = [];
                const debugInfo = { totalRows: rows.length, firstRowCells: 0 };

                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td');

                    if (index === 0) {
                        debugInfo.firstRowCells = cells.length;
                    }

                    // Table has 6 columns: rank, player_id, name, real_name, wave, datetime
                    if (cells.length >= 5) {
                        const rank = cells[0]?.textContent?.trim();
                        const playerId = cells[1]?.textContent?.trim();
                        const name = cells[2]?.textContent?.trim();
                        const realName = cells[3]?.textContent?.trim();
                        const waveText = cells[4]?.textContent?.trim();
                        const wave = parseInt(waveText);

                        // Relax validation - just check if player ID exists and wave is a number
                        if (playerId && wave >= 0) {
                            playerData.push({
                                playerId,
                                name: name || 'Unknown',
                                realName: realName || 'Unknown',
                                wave,
                                rank: parseInt(rank) || (index + 1)
                            });
                        }
                    }
                });

                return { players: playerData, debug: debugInfo };
            });

            console.log(`   Found ${players.length} players (table has ${debug.totalRows} rows, ${debug.firstRowCells} cells)`);

            if (players.length === 0) {
                console.log('   ⚠️  No players extracted - table may not be loaded');
                await page.screenshot({ path: `debug-empty-${bracketCount}.png` });
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            // Calculate stats
            const waves = players.map(p => p.wave);
            const medianWave = calculateMedian(waves);
            const totalWaves = waves.reduce((a, b) => a + b, 0);

            console.log(`   📊 Median: ${medianWave}, Total: ${totalWaves}`);

            // Check for target player
            const targetPlayer = players.find(p => p.playerId === TARGET_PLAYER);
            if (targetPlayer) {
                console.log(`   🎯 FOUND TARGET: ${targetPlayer.realName} (Rank #${targetPlayer.rank}, Wave ${targetPlayer.wave})`);
                targetPlayerBracket = {
                    bracketId,
                    player: targetPlayer,
                    medianWave,
                    totalWaves
                };
            }

            // Store to database
            const records = players.map(player => ({
                tournament_date: TOURNAMENT_DATE,
                league: LEAGUE,
                bracket_id: bracketId,
                player_id: player.playerId,
                player_name: player.name,
                real_name: player.realName,
                wave: player.wave,
                rank: player.rank,
                bracket_median_wave: medianWave,
                bracket_total_waves: totalWaves
            }));

            const { error } = await supabase.supabase
                .from('tournament_brackets')
                .upsert(records, { onConflict: 'tournament_date,league,player_id' });

            if (error) {
                console.log(`   ❌ DB Error: ${error.message}`);
            } else {
                console.log(`   💾 Stored to database`);
            }

            allBrackets.push({
                bracketId,
                players,
                medianWave,
                totalWaves
            });

            // Click "Next Bracket" button
            console.log('   ➡️  Clicking Next Bracket...');
            try {
                const currentBracketId = bracketId;

                // Find and click the Next Bracket button
                const buttonClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const nextButton = buttons.find(btn => btn.textContent.includes('Next Bracket'));
                    if (nextButton) {
                        nextButton.click();
                        return true;
                    }
                    return false;
                });

                if (!buttonClicked) {
                    console.log('   ❌ Could not find Next Bracket button');
                    break;
                }

                // Wait for bracket ID to CHANGE (key fix - wait for Streamlit to update)
                console.log('   ⏳ Waiting for new bracket to load...');
                try {
                    await page.waitForFunction((oldBracketId) => {
                        const bodyText = document.body.innerText;
                        const match = bodyText.match(/Selected\s+([A-Z0-9]{16})/);
                        return match && match[1] !== oldBracketId;
                    }, { timeout: 10000 }, currentBracketId);
                } catch (timeout) {
                    console.log('   ⚠️  Bracket ID did not change - may have reached end or button did not work');
                }

                // Wait for table to have 30 rows again
                await page.waitForFunction(() => {
                    const rows = document.querySelectorAll('table tbody tr');
                    return rows.length >= 30;
                }, { timeout: 15000 });

                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (e) {
                console.log('   ❌ Error during navigation:', e.message);
                break;
            }

            // Safety limit
            if (bracketCount >= 200) {
                console.log('⚠️  Safety limit (200 brackets)');
                break;
            }
        }

        // Final results
        console.log('\n\n' + '='.repeat(60));
        console.log('📊 FINAL RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Brackets scraped: ${allBrackets.length}`);
        console.log(`📁 Players stored: ${allBrackets.length * 30}`);
        console.log(`🔢 Bracket IDs: ${Array.from(seenBracketIds).join(', ')}`);

        if (targetPlayerBracket) {
            console.log('\n' + '='.repeat(60));
            console.log('🎯 TARGET PLAYER ANALYSIS');
            console.log('='.repeat(60));
            const { player, medianWave, bracketId } = targetPlayerBracket;
            console.log(`Player: ${player.realName} (${player.name})`);
            console.log(`Bracket: ${bracketId}`);
            console.log(`Rank: #${player.rank} / 30`);
            console.log(`Wave: ${player.wave}`);
            console.log(`Bracket Median: ${medianWave}`);
            console.log(`vs Median: ${player.wave - medianWave} waves`);

            // Calculate difficulty
            console.log('\n📈 BRACKET DIFFICULTY...');
            let betterRanks = 0;
            let worseRanks = 0;

            allBrackets.forEach(bracket => {
                const playersAbove = bracket.players.filter(p => p.wave > player.wave).length;
                const hypotheticalRank = playersAbove + 1;

                if (hypotheticalRank < player.rank) betterRanks++;
                if (hypotheticalRank > player.rank) worseRanks++;
            });

            const difficultyScore = (worseRanks / allBrackets.length) * 100;
            let difficultyLabel = '';
            if (difficultyScore >= 80) difficultyLabel = 'Very Easy';
            else if (difficultyScore >= 60) difficultyLabel = 'Easy';
            else if (difficultyScore >= 40) difficultyLabel = 'Medium';
            else if (difficultyScore >= 20) difficultyLabel = 'Hard';
            else difficultyLabel = 'Very Hard';

            console.log(`\n🎲 DIFFICULTY: ${difficultyScore.toFixed(1)}/100 (${difficultyLabel})`);
            console.log(`   Better in: ${betterRanks} brackets`);
            console.log(`   Worse in: ${worseRanks} brackets`);

            if (difficultyScore < 50) {
                console.log(`\n💪 UNLUCKY! Your bracket was harder than average.`);
            } else {
                console.log(`\n🍀 LUCKY! Your bracket was easier than average.`);
            }

            // Store analysis
            await supabase.supabase.from('bracket_difficulty_analysis').insert({
                discord_user_id: 'PLACEHOLDER_' + TARGET_PLAYER,
                league: LEAGUE,
                wave: player.wave,
                difficulty_score: difficultyScore,
                difficulty_label: difficultyLabel,
                actual_rank: player.rank,
                total_brackets_analyzed: allBrackets.length,
                analyzed_at: new Date().toISOString()
            });

            console.log('💾 Analysis saved');
        } else {
            console.log(`\n⚠️  Target player ${TARGET_PLAYER} not found`);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        console.log('\n✅ Browser closed');
    }
}

function calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
}

// Run immediately
scrapeAllBrackets()
    .then(() => {
        console.log('\n🎉 SCRAPING COMPLETE!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
