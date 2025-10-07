/**
 * SLOW & STEADY SCRAPER
 * Much longer waits to prevent premature closing
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
    console.log('🐌 SLOW & STEADY SCRAPER');
    console.log('📊 Extra long waits to let Streamlit fully render\n');

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

        console.log('⏳ Waiting for table with 30 rows (40 seconds timeout)...');
        await page.waitForFunction(() => {
            const rows = document.querySelectorAll('table tbody tr');
            return rows.length >= 30;
        }, { timeout: 40000 });

        console.log('✅ Table loaded! Waiting 5 more seconds for Streamlit to settle...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Find and click "Select Bracket" dropdown
        console.log('📋 Clicking "Select Bracket" dropdown...');
        const dropdownFound = await page.evaluate(() => {
            const comboboxes = document.querySelectorAll('[role="combobox"]');
            if (comboboxes.length >= 2) {
                console.log('Found', comboboxes.length, 'comboboxes, clicking the 2nd one');
                comboboxes[1].click();
                return true;
            }
            return false;
        });

        if (!dropdownFound) {
            console.log('❌ Could not find Select Bracket dropdown');
            return;
        }

        console.log('✅ Dropdown clicked! Waiting 3 seconds for dropdown to open...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extract bracket IDs from dropdown
        const allBracketIds = await page.evaluate(() => {
            const listItems = document.querySelectorAll('li, [role="option"], [data-baseweb="menu-item"]');
            const ids = [];

            for (const item of listItems) {
                const text = item.textContent?.trim();
                if (text && /^[A-Z0-9]{16}$/.test(text)) {
                    ids.push(text);
                }
            }

            if (ids.length > 0) {
                console.log('Found', ids.length, 'bracket IDs in dropdown');
                return ids;
            }

            // Fallback
            const allText = document.body.innerText;
            const matches = allText.match(/\b[A-Z0-9]{16}\b/g);
            if (matches) {
                const unique = [...new Set(matches)];
                console.log('Found', unique.length, 'unique IDs in page text');
                return unique;
            }

            return [];
        });

        if (allBracketIds.length === 0) {
            console.log('❌ No bracket IDs found');
            return;
        }

        console.log(`✅ Found ${allBracketIds.length} bracket IDs!`);
        console.log(`   All IDs: ${allBracketIds.join(', ')}\n`);

        // Close dropdown first
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const allBrackets = [];
        let targetPlayerBracket = null;

        // Scrape each bracket
        const limit = Math.min(allBracketIds.length, 50);
        for (let i = 0; i < limit; i++) {
            const bracketId = allBracketIds[i];
            console.log(`\n[${i + 1}/${limit}] ${bracketId}`);

            // Click dropdown again
            console.log('  📋 Opening dropdown...');
            await page.evaluate(() => {
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    comboboxes[1].click();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

            // Find and click the bracket option
            console.log(`  🖱️  Clicking bracket ${bracketId}...`);
            const selected = await page.evaluate((targetId) => {
                const items = document.querySelectorAll('li, [role="option"], [data-baseweb="menu-item"]');
                for (const item of items) {
                    const text = item.textContent?.trim();
                    if (text === targetId) {
                        console.log('Found and clicking:', text);
                        item.click();
                        return true;
                    }
                }
                return false;
            }, bracketId);

            if (!selected) {
                console.log('  ⚠️  Could not click bracket option');
                continue;
            }

            console.log('  ⏳ Waiting 5 seconds for table to update...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 full seconds

            // Wait for table to have 30 rows again
            console.log('  ⏳ Waiting for 30 rows...');
            await page.waitForFunction(() => {
                return document.querySelectorAll('table tbody tr').length >= 30;
            }, { timeout: 10000 }).catch(() => {
                console.log('  ⚠️  Timeout waiting for 30 rows');
            });

            await new Promise(resolve => setTimeout(resolve, 2000)); // Extra 2 seconds

            // Extract players from table
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

            console.log(`  ✅ ${players.length} players extracted`);

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

            await supabase.supabase
                .from('tournament_brackets')
                .upsert(records, { onConflict: 'tournament_date,league,player_id' });

            console.log(`  💾 Stored to database`);
            allBrackets.push({ bracketId, players });

            if ((i + 1) % 5 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${limit} brackets scraped`);
            }
        }

        // RESULTS
        console.log('\n\n' + '='.repeat(60));
        console.log('RESULTS');
        console.log('='.repeat(60));
        console.log(`Scraped: ${allBrackets.length} brackets`);

        if (targetPlayerBracket) {
            const { player } = targetPlayerBracket;
            console.log(`\n🎯 YOUR PLAYER: ${player.realName}`);
            console.log(`   Rank: #${player.rank}/30`);
            console.log(`   Wave: ${player.wave}`);

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

            console.log(`\n📈 ACROSS ${allBrackets.length} BRACKETS:`);
            console.log(`   Average Rank: #${avgRank.toFixed(1)}`);
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
        await page.screenshot({ path: 'd:/social tower/debug-error.png' });
    } finally {
        console.log('\n⏳ Waiting 5 seconds before closing browser...');
        await new Promise(resolve => setTimeout(resolve, 5000));
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
