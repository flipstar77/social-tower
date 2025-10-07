/**
 * KEYBOARD NAVIGATION SCRAPER
 * Open dropdown → Arrow Down → Enter → Scrape → Repeat
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

async function scrapeWithKeyboard() {
    console.log('⌨️  KEYBOARD NAVIGATION SCRAPER');
    console.log('📊 Arrow Down through dropdown options\n');

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

        console.log('⏳ Waiting for initial table...');
        await page.waitForFunction(() => {
            return document.querySelectorAll('table tbody tr').length >= 30;
        }, { timeout: 40000 });

        await new Promise(resolve => setTimeout(resolve, 5000));

        const allBrackets = [];
        let targetPlayerBracket = null;
        const seenBracketIds = new Set();
        let sameCount = 0;

        // Try up to 100 iterations (should be enough to go through all brackets)
        for (let i = 0; i < 100; i++) {
            console.log(`\n[${i + 1}] Getting current bracket...`);

            // Get current bracket ID
            const bracketId = await page.evaluate(() => {
                // Try to find bracket ID in the selected combobox
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    const text = comboboxes[1].textContent?.trim();
                    const match = text?.match(/\b[A-F0-9]{16}\b/i);
                    if (match) return match[0].toUpperCase();
                }

                // Fallback: look for "Selected: XXXXX"
                const bodyText = document.body.innerText;
                const match = bodyText.match(/Selected[:\s]+([A-F0-9]{16})/i);
                if (match) return match[1].toUpperCase();

                return null;
            });

            if (!bracketId) {
                console.log('  ⚠️  No bracket ID found');
            } else if (seenBracketIds.has(bracketId)) {
                console.log(`  🔄 Already scraped ${bracketId}`);
                sameCount++;
                if (sameCount >= 5) {
                    console.log('\n✅ Loop detected (5 repeats), stopping');
                    break;
                }
            } else {
                console.log(`  📋 Bracket: ${bracketId}`);
                seenBracketIds.add(bracketId);
                sameCount = 0;

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
                    console.log(`  ⚠️  Only ${players.length} players`);
                } else {
                    console.log(`  ✅ ${players.length} players`);

                    // Stats
                    const waves = players.map(p => p.wave);
                    const sorted = [...waves].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    const medianWave = sorted.length % 2 === 0
                        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
                        : sorted[mid];
                    const totalWaves = waves.reduce((a, b) => a + b, 0);

                    // Check for target
                    const targetPlayer = players.find(p => p.playerId === TARGET_PLAYER);
                    if (targetPlayer) {
                        console.log(`  🎯 FOUND! ${targetPlayer.realName} - #${targetPlayer.rank}, ${targetPlayer.wave} waves`);
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
                }
            }

            // Navigate to next bracket using keyboard
            console.log('  ⌨️  Opening dropdown...');

            // Click the Select Bracket dropdown
            await page.evaluate(() => {
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    comboboxes[1].click();
                }
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Press Arrow Down to highlight next option
            console.log('  ⬇️  Arrow Down');
            await page.keyboard.press('ArrowDown');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Press Enter to select
            console.log('  ✅ Enter');
            await page.keyboard.press('Enter');

            console.log('  ⏳ Waiting 5 seconds for table update...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Wait for table
            await page.waitForFunction(() => {
                return document.querySelectorAll('table tbody tr').length >= 30;
            }, { timeout: 10000 }).catch(() => {});

            await new Promise(resolve => setTimeout(resolve, 2000));

            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 Progress: ${seenBracketIds.size} unique brackets scraped`);
            }
        }

        // RESULTS
        console.log('\n\n' + '='.repeat(60));
        console.log('FINAL RESULTS');
        console.log('='.repeat(60));
        console.log(`Unique Brackets: ${seenBracketIds.size}`);
        console.log(`Total Players: ${seenBracketIds.size * 30}`);

        if (targetPlayerBracket) {
            const { player } = targetPlayerBracket;
            console.log(`\n🎯 YOUR PLAYER: ${player.realName} (${player.name})`);
            console.log(`   Rank: #${player.rank}/30`);
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

            console.log(`\n📈 ACROSS ${allBrackets.length} BRACKETS:`);
            console.log(`   Average Rank: #${avgRank.toFixed(1)}/30`);
            console.log(`   Best: #${bestRank} | Worst: #${worstRank}`);
            console.log(`   Difficulty: ${difficulty.toFixed(1)}/100`);

            if (difficulty < 40) {
                console.log(`\n💪 UNLUCKY BRACKET!`);
            } else if (difficulty > 60) {
                console.log(`\n🍀 LUCKY BRACKET!`);
            } else {
                console.log(`\n😐 AVERAGE`);
            }
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    } finally {
        console.log('\n⏳ Waiting before close...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await browser.close();
    }
}

scrapeWithKeyboard()
    .then(() => {
        console.log('\n🎉 DONE!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal:', error);
        process.exit(1);
    });
