/**
 * DROPDOWN APPROACH - Most Reliable!
 * Extract all bracket IDs from dropdown, then loop through them
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
    console.log('🚀 DROPDOWN SCRAPER - Most Reliable!');
    console.log('📊 Extracting ALL bracket IDs from dropdown\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        console.log('🌐 Loading page...');
        await page.goto('https://thetower.lol/livebracketview', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for dropdown to load
        await new Promise(resolve => setTimeout(resolve, 5000));

        // STEP 1: Extract ALL bracket IDs from dropdown
        console.log('📋 Extracting bracket IDs from dropdown...');

        const allBracketIds = await page.evaluate(() => {
            // Find the dropdown - it's a Streamlit selectbox
            const selects = document.querySelectorAll('select');
            for (const select of selects) {
                const options = Array.from(select.options);
                // Look for options with 16-character IDs
                const bracketIds = options
                    .map(opt => opt.value || opt.textContent)
                    .filter(val => val && val.match(/^[A-Z0-9]{16}$/));

                if (bracketIds.length > 0) {
                    return bracketIds;
                }
            }

            // Alternative: look in the page text for all bracket IDs
            const bodyText = document.body.innerText;
            const matches = bodyText.match(/[A-Z0-9]{16}/g);
            if (matches) {
                // Deduplicate
                return [...new Set(matches)];
            }

            return [];
        });

        if (allBracketIds.length === 0) {
            console.log('❌ Could not find any bracket IDs in dropdown!');
            console.log('Taking screenshot for debugging...');
            await page.screenshot({ path: 'd:/social tower/debug-dropdown.png' });
            return;
        }

        console.log(`✅ Found ${allBracketIds.length} bracket IDs!`);
        console.log(`   First 5: ${allBracketIds.slice(0, 5).join(', ')}`);
        console.log('');

        const allBrackets = [];
        let targetPlayerBracket = null;

        // STEP 2: Loop through each bracket ID
        for (let i = 0; i < allBracketIds.length; i++) {
            const bracketId = allBracketIds[i];
            console.log(`\n📦 [${i + 1}/${allBracketIds.length}] ${bracketId}`);

            // Select this bracket from dropdown
            try {
                await page.evaluate((targetId) => {
                    const selects = document.querySelectorAll('select');
                    for (const select of selects) {
                        const option = Array.from(select.options).find(
                            opt => (opt.value === targetId || opt.textContent.includes(targetId))
                        );
                        if (option) {
                            select.value = option.value;
                            // Trigger change event for Streamlit
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                        }
                    }
                    return false;
                }, bracketId);

                // Wait for table to update
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Wait for 30 rows
                await page.waitForFunction(() => {
                    const rows = document.querySelectorAll('table tbody tr');
                    return rows.length >= 25; // At least 25 rows
                }, { timeout: 10000 });

            } catch (e) {
                console.log(`   ⚠️  Could not load bracket: ${e.message}`);
                continue;
            }

            // Extract players
            const { players } = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                const playerData = [];

                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        const playerId = cells[1]?.textContent?.trim();
                        const name = cells[2]?.textContent?.trim();
                        const realName = cells[3]?.textContent?.trim();
                        const wave = parseInt(cells[4]?.textContent?.trim());

                        if (playerId && wave >= 0) {
                            playerData.push({
                                playerId,
                                name: name || 'Unknown',
                                realName: realName || 'Unknown',
                                wave,
                                rank: index + 1
                            });
                        }
                    }
                });

                return { players: playerData };
            });

            if (players.length < 20) {
                console.log(`   ⚠️  Only ${players.length} players, skipping`);
                continue;
            }

            console.log(`   ✅ ${players.length} players`);

            // Stats
            const waves = players.map(p => p.wave);
            const sorted = [...waves].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const medianWave = sorted.length % 2 === 0
                ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
                : sorted[mid];
            const totalWaves = waves.reduce((a, b) => a + b, 0);

            // Check for target player
            const targetPlayer = players.find(p => p.playerId === TARGET_PLAYER);
            if (targetPlayer) {
                console.log(`   🎯 FOUND TARGET! ${targetPlayer.realName} - Rank #${targetPlayer.rank}, Wave ${targetPlayer.wave}`);
                targetPlayerBracket = { bracketId, player: targetPlayer, medianWave };
            }

            // Store to DB
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

            if (!error) {
                console.log(`   💾 Stored`);
            }

            allBrackets.push({ bracketId, players, medianWave });

            // Progress update every 10 brackets
            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${allBracketIds.length} brackets scraped`);
            }
        }

        // FINAL RESULTS
        console.log('\n\n' + '='.repeat(60));
        console.log('📊 FINAL RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Scraped: ${allBrackets.length} brackets`);
        console.log(`📁 Players: ${allBrackets.length * 30}`);

        if (targetPlayerBracket) {
            const { player } = targetPlayerBracket;
            console.log(`\n🎯 YOUR PLAYER: ${player.realName}`);
            console.log(`   Actual Rank: #${player.rank}/30`);
            console.log(`   Wave: ${player.wave}`);

            // Calculate difficulty
            let better = 0, worse = 0, same = 0;
            const ranks = [];

            allBrackets.forEach(bracket => {
                const above = bracket.players.filter(p => p.wave > player.wave).length;
                const hypothetical = above + 1;
                ranks.push(hypothetical);

                if (hypothetical < player.rank) better++;
                else if (hypothetical > player.rank) worse++;
                else same++;
            });

            const avgRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
            const bestRank = Math.min(...ranks);
            const worstRank = Math.max(...ranks);
            const difficulty = (worse / allBrackets.length) * 100;

            console.log(`\n📈 BRACKET DIFFICULTY ANALYSIS:`);
            console.log(`   Difficulty Score: ${difficulty.toFixed(1)}/100`);
            console.log(`   Average Rank (across all brackets): #${avgRank.toFixed(1)}`);
            console.log(`   Best Possible Rank: #${bestRank}`);
            console.log(`   Worst Possible Rank: #${worstRank}`);
            console.log(`   Would rank BETTER in: ${better} brackets`);
            console.log(`   Would rank WORSE in: ${worse} brackets`);
            console.log(`   Would rank SAME in: ${same} brackets`);

            if (difficulty < 20) {
                console.log(`\n💪 VERY HARD BRACKET - You got VERY UNLUCKY!`);
            } else if (difficulty < 40) {
                console.log(`\n💪 HARD BRACKET - You got unlucky!`);
            } else if (difficulty < 60) {
                console.log(`\n😐 MEDIUM BRACKET - Average luck`);
            } else if (difficulty < 80) {
                console.log(`\n🍀 EASY BRACKET - You got lucky!`);
            } else {
                console.log(`\n🍀 VERY EASY BRACKET - You got VERY LUCKY!`);
            }

            // Store analysis
            await supabase.supabase.from('bracket_difficulty_analysis').upsert({
                discord_user_id: 'PLACEHOLDER_' + TARGET_PLAYER,
                league: LEAGUE,
                wave: player.wave,
                difficulty_score: difficulty,
                actual_rank: player.rank,
                best_possible_rank: bestRank,
                worst_possible_rank: worstRank,
                average_rank: avgRank,
                total_brackets_analyzed: allBrackets.length,
                analyzed_at: new Date().toISOString()
            }, { onConflict: 'discord_user_id,league' });
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        console.log('\n✅ Browser closed');
    }
}

scrapeAllBrackets()
    .then(() => {
        console.log('\n🎉 COMPLETE!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal:', error);
        process.exit(1);
    });
