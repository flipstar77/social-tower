/**
 * KEYBOARD NAVIGATION SCRAPER
 * Uses arrow keys to navigate dropdown instead of clicking
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
    console.log('🚀 KEYBOARD NAVIGATION SCRAPER');
    console.log('📊 Uses arrow keys to navigate dropdown\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        console.log('🌐 Loading...');
        await page.goto('https://thetower.lol/livebracketview', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        console.log('⏳ Waiting for 30 rows...');
        await page.waitForFunction(() => {
            return document.querySelectorAll('table tbody tr').length >= 30;
        }, { timeout: 40000 });

        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Loaded!\n');

        const allBrackets = [];
        let targetPlayerBracket = null;

        // Start with first bracket (already loaded)
        for (let bracketNum = 0; bracketNum < 100; bracketNum++) {
            console.log(`\n[${bracketNum + 1}] Scraping current bracket...`);

            // Get current bracket ID
            const bracketId = await page.evaluate(() => {
                // Find the selected value in the Select Bracket dropdown
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    const text = comboboxes[1].textContent?.trim();
                    const match = text?.match(/([A-Z0-9]{16})/);
                    return match ? match[1] : null;
                }
                return null;
            });

            if (!bracketId) {
                console.log('  ⚠️  No bracket ID');
                break;
            }

            console.log(`  ID: ${bracketId}`);

            // Check if we've seen this before (looped)
            const alreadySeen = allBrackets.find(b => b.bracketId === bracketId);
            if (alreadySeen) {
                console.log('  ✅ LOOP DETECTED - Already scraped this one!');
                break;
            }

            // Extract players from current bracket
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
                console.log(`  ⚠️  Only ${players.length} players`);
                break;
            }

            console.log(`  ✅ ${players.length} players`);

            // Calculate stats
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
                console.log(`  🎯 FOUND! ${targetPlayer.realName} - #${targetPlayer.rank}, ${targetPlayer.wave} waves`);
                targetPlayerBracket = { bracketId, player: targetPlayer };
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

            await supabase.supabase
                .from('tournament_brackets')
                .upsert(records, { onConflict: 'tournament_date,league,player_id' });

            console.log(`  💾 Stored`);
            allBrackets.push({ bracketId, players });

            // Navigate to NEXT bracket using keyboard
            console.log('  ➡️  Navigating to next bracket...');

            // Click the Select Bracket dropdown to focus it
            await page.evaluate(() => {
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    comboboxes[1].click();
                }
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Press DOWN arrow to select next bracket
            await page.keyboard.press('ArrowDown');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Press ENTER to confirm selection
            await page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Wait for table to update
            await page.waitForFunction(() => {
                const rows = document.querySelectorAll('table tbody tr');
                return rows.length >= 25;
            }, { timeout: 10000 }).catch(() => {
                console.log('  ⚠️  Table did not reload');
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            if ((bracketNum + 1) % 10 === 0) {
                console.log(`\n📊 Progress: ${bracketNum + 1} brackets scraped`);
            }
        }

        // RESULTS
        console.log('\n\n' + '='.repeat(60));
        console.log('FINAL RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Scraped: ${allBrackets.length} brackets`);
        console.log(`📁 Players: ${allBrackets.length * 30}`);

        if (targetPlayerBracket) {
            const { player } = targetPlayerBracket;
            console.log(`\n🎯 YOUR PLAYER: ${player.realName}`);
            console.log(`   Actual Rank: #${player.rank}/30`);
            console.log(`   Wave: ${player.wave}`);

            // Calculate difficulty
            let better = 0, worse = 0;
            const ranks = [];

            allBrackets.forEach(bracket => {
                const above = bracket.players.filter(p => p.wave > player.wave).length;
                const hypothetical = above + 1;
                ranks.push(hypothetical);
                if (hypothetical < player.rank) better++;
                if (hypothetical > player.rank) worse++;
            });

            const avgRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
            const bestRank = Math.min(...ranks);
            const worstRank = Math.max(...ranks);
            const difficulty = (worse / allBrackets.length) * 100;

            console.log(`\n📈 WITH ${player.wave} WAVES ACROSS ${allBrackets.length} BRACKETS:`);
            console.log(`   Average Rank: #${avgRank.toFixed(1)}`);
            console.log(`   Best Possible: #${bestRank}`);
            console.log(`   Worst Possible: #${worstRank}`);
            console.log(`   Difficulty Score: ${difficulty.toFixed(1)}/100`);
            console.log(`   Better in: ${better} | Worse in: ${worse}`);

            if (difficulty < 30) {
                console.log(`\n💪 VERY HARD BRACKET - Got VERY UNLUCKY!`);
            } else if (difficulty < 45) {
                console.log(`\n💪 HARD BRACKET - Got unlucky`);
            } else if (difficulty < 55) {
                console.log(`\n😐 AVERAGE BRACKET - Normal luck`);
            } else if (difficulty < 70) {
                console.log(`\n🍀 EASY BRACKET - Got lucky`);
            } else {
                console.log(`\n🍀 VERY EASY BRACKET - Got VERY LUCKY!`);
            }
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        await page.screenshot({ path: 'd:/social tower/error.png' });
    } finally {
        await new Promise(resolve => setTimeout(resolve, 2000));
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
