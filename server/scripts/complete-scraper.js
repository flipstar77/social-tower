/**
 * COMPLETE SCRAPER - Scroll dropdown to get ALL brackets
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
    console.log('🎯 COMPLETE SCRAPER - Get ALL brackets by scrolling dropdown');

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
            timeout: 90000
        });

        console.log('⏳ Waiting for table...');
        await page.waitForFunction(() => {
            return document.querySelectorAll('table tbody tr').length >= 30;
        }, { timeout: 40000 });

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Open dropdown
        console.log('📋 Opening "Select Bracket" dropdown...');
        await page.evaluate(() => {
            const comboboxes = document.querySelectorAll('[role="combobox"]');
            if (comboboxes.length >= 2) {
                comboboxes[1].click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Scroll dropdown to load ALL options
        console.log('📜 Scrolling dropdown to load all bracket IDs...');
        const allBracketIds = await page.evaluate(() => {
            const listbox = document.querySelector('[role="listbox"]');
            if (!listbox) {
                console.log('❌ No listbox found');
                return [];
            }

            const ids = new Set();
            let previousCount = 0;
            let noChangeCount = 0;

            // Scroll repeatedly until no new IDs appear
            for (let i = 0; i < 50; i++) {
                // Get current IDs
                const items = listbox.querySelectorAll('li, [role="option"]');
                items.forEach(item => {
                    const text = item.textContent?.trim();
                    if (text && /^[A-F0-9]{16}$/i.test(text)) {
                        ids.add(text.toUpperCase());
                    }
                });

                console.log(`Scroll ${i + 1}: Found ${ids.size} total IDs`);

                // If no change for 3 scrolls, we're done
                if (ids.size === previousCount) {
                    noChangeCount++;
                    if (noChangeCount >= 3) {
                        console.log('No new IDs for 3 scrolls, stopping');
                        break;
                    }
                } else {
                    noChangeCount = 0;
                }

                previousCount = ids.size;

                // Scroll down
                listbox.scrollTop = listbox.scrollHeight;
            }

            return Array.from(ids);
        });

        console.log(`✅ Found ${allBracketIds.length} total bracket IDs!`);
        if (allBracketIds.length > 0) {
            console.log(`   First 10: ${allBracketIds.slice(0, 10).join(', ')}`);
        }

        // Close dropdown
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const allBrackets = [];
        let targetPlayerBracket = null;

        // Scrape each bracket
        for (let i = 0; i < allBracketIds.length; i++) {
            const bracketId = allBracketIds[i];
            console.log(`\n[${i + 1}/${allBracketIds.length}] ${bracketId}`);

            // Open dropdown
            await page.evaluate(() => {
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    comboboxes[1].click();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Click bracket option
            const selected = await page.evaluate((targetId) => {
                const items = document.querySelectorAll('li, [role="option"]');
                for (const item of items) {
                    const text = item.textContent?.trim();
                    if (text && text.toUpperCase() === targetId.toUpperCase()) {
                        item.click();
                        return true;
                    }
                }
                return false;
            }, bracketId);

            if (!selected) {
                console.log('  ⚠️  Could not select, trying to scroll to it...');

                // Try scrolling to it first
                const scrolledAndSelected = await page.evaluate((targetId) => {
                    const listbox = document.querySelector('[role="listbox"]');
                    if (!listbox) return false;

                    // Scroll through looking for it
                    for (let i = 0; i < 20; i++) {
                        const items = listbox.querySelectorAll('li, [role="option"]');
                        for (const item of items) {
                            const text = item.textContent?.trim();
                            if (text && text.toUpperCase() === targetId.toUpperCase()) {
                                item.scrollIntoView({ block: 'center' });
                                item.click();
                                return true;
                            }
                        }
                        listbox.scrollTop += 200;
                    }
                    return false;
                }, bracketId);

                if (!scrolledAndSelected) {
                    console.log('  ❌ Could not find bracket in dropdown');
                    await page.keyboard.press('Escape');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
            }

            console.log('  ⏳ Waiting for table update...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            await page.waitForFunction(() => {
                return document.querySelectorAll('table tbody tr').length >= 30;
            }, { timeout: 10000 }).catch(() => {});

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Extract players
            const { players } = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                const playerData = [];

                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        const playerId = cells[1]?.textContent?.trim();
                        const wave = parseInt(cells[4]?.textContent?.trim());

                        if (playerId && wave >= 0) {
                            playerData.push({
                                playerId,
                                name: cells[2]?.textContent?.trim() || 'Unknown',
                                realName: cells[3]?.textContent?.trim() || 'Unknown',
                                wave,
                                rank: index + 1
                            });
                        }
                    }
                });

                return { players: playerData };
            });

            if (players.length < 20) {
                console.log(`  ⚠️  Only ${players.length} players found`);
                continue;
            }

            console.log(`  ✅ ${players.length} players`);

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
                console.log(`  🎯 FOUND YOUR PLAYER! ${targetPlayer.realName} - #${targetPlayer.rank}, ${targetPlayer.wave} waves`);
                targetPlayerBracket = { bracketId, player: targetPlayer };
            }

            // Store
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

            await supabase.supabase
                .from('tournament_brackets')
                .upsert(records, { onConflict: 'tournament_date,league,player_id' });

            console.log(`  💾 Stored`);
            allBrackets.push({ bracketId, players });

            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${allBracketIds.length} brackets`);
            }
        }

        // RESULTS
        console.log('\n\n' + '='.repeat(60));
        console.log('FINAL RESULTS');
        console.log('='.repeat(60));
        console.log(`Total Brackets: ${allBrackets.length}`);
        console.log(`Total Players: ${allBrackets.length * 30}`);

        if (targetPlayerBracket) {
            const { player } = targetPlayerBracket;
            console.log(`\n🎯 YOUR PLAYER: ${player.realName} (${player.name})`);
            console.log(`   Actual Rank: #${player.rank}/30`);
            console.log(`   Waves: ${player.wave}`);

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

            console.log(`\n📈 WHAT IF YOU WERE IN EVERY BRACKET:`);
            console.log(`   Average Rank: #${avgRank.toFixed(1)}/30`);
            console.log(`   Best Possible: #${bestRank}/30`);
            console.log(`   Worst Possible: #${worstRank}/30`);
            console.log(`\n🎲 BRACKET LUCK:`);
            console.log(`   Better brackets: ${better} (${(better/allBrackets.length*100).toFixed(1)}%)`);
            console.log(`   Worse brackets: ${worse} (${(worse/allBrackets.length*100).toFixed(1)}%)`);
            console.log(`   Same rank: ${same}`);
            console.log(`\n🎯 Difficulty Score: ${difficulty.toFixed(1)}/100`);

            if (difficulty < 40) {
                console.log(`\n💪 UNLUCKY! You got a HARD bracket.`);
                console.log(`   You would rank BETTER in ${worse} out of ${allBrackets.length} brackets.`);
            } else if (difficulty > 60) {
                console.log(`\n🍀 LUCKY! You got an EASY bracket.`);
                console.log(`   You would rank WORSE in ${worse} out of ${allBrackets.length} brackets.`);
            } else {
                console.log(`\n😐 AVERAGE - Your bracket was typical.`);
            }

            // Store analysis
            await supabase.supabase
                .from('bracket_difficulty_analysis')
                .upsert({
                    tournament_date: TOURNAMENT_DATE,
                    league: LEAGUE,
                    player_id: TARGET_PLAYER,
                    actual_rank: player.rank,
                    wave: player.wave,
                    total_brackets: allBrackets.length,
                    average_rank: parseFloat(avgRank.toFixed(2)),
                    best_rank: bestRank,
                    worst_rank: worstRank,
                    brackets_would_do_better: better,
                    brackets_would_do_worse: worse,
                    difficulty_score: parseFloat(difficulty.toFixed(2))
                }, { onConflict: 'tournament_date,league,player_id' });

            console.log('\n💾 Analysis saved to database');
        } else {
            console.log(`\n⚠️  Player ${TARGET_PLAYER} not found in any bracket`);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        await page.screenshot({ path: 'd:/social tower/debug-error.png' });
    } finally {
        console.log('\n⏳ Waiting before close...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await browser.close();
    }
}

scrapeAllBrackets()
    .then(() => {
        console.log('\n🎉 DONE!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal:', error);
        process.exit(1);
    });
