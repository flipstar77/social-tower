/**
 * CORRECT DROPDOWN SCRAPER
 * Targets the "Select Bracket" dropdown specifically (middle one with bracket IDs)
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
    console.log('🚀 CORRECT DROPDOWN SCRAPER');
    console.log('📊 Targeting "Select Bracket" dropdown specifically\n');

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

        console.log('⏳ Waiting for table with 30 rows...');
        await page.waitForFunction(() => {
            const rows = document.querySelectorAll('table tbody tr');
            return rows.length >= 30;
        }, { timeout: 40000 });

        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Page loaded!\n');

        // Find and click the CORRECT dropdown - "Select Bracket" (the middle one)
        console.log('📋 Looking for "Select Bracket" dropdown...');

        const dropdownFound = await page.evaluate(() => {
            // Look for text that says "Select Bracket" near a clickable element
            const labels = Array.from(document.querySelectorAll('p, label, span, div'));
            const selectBracketLabel = labels.find(el => {
                const text = el.textContent?.trim();
                return text === 'Select Bracket';
            });

            if (selectBracketLabel) {
                // Find the nearest clickable element (likely right below the label)
                const parent = selectBracketLabel.closest('div');
                if (parent) {
                    const clickable = parent.querySelector('[role="button"], [role="combobox"], button, select');
                    if (clickable) {
                        console.log('Found Select Bracket dropdown');
                        clickable.click();
                        return true;
                    }
                }
            }

            // Fallback: look for any combobox that's not the first one
            const comboboxes = document.querySelectorAll('[role="combobox"]');
            if (comboboxes.length >= 2) {
                console.log('Found', comboboxes.length, 'comboboxes, clicking the 2nd one');
                comboboxes[1].click(); // The SECOND combobox should be "Select Bracket"
                return true;
            }

            return false;
        });

        if (!dropdownFound) {
            console.log('❌ Could not find Select Bracket dropdown');
            await page.screenshot({ path: 'd:/social tower/debug-no-select-bracket.png' });
            return;
        }

        console.log('✅ Dropdown clicked!');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Take screenshot of opened dropdown
        await page.screenshot({ path: 'd:/social tower/dropdown-opened.png' });
        console.log('📸 Screenshot saved: dropdown-opened.png');

        // Extract bracket IDs from the opened dropdown
        const allBracketIds = await page.evaluate(() => {
            // Streamlit dropdown options appear as list items
            const listItems = document.querySelectorAll('li, [role="option"], [data-baseweb="menu-item"]');
            const ids = [];

            for (const item of listItems) {
                const text = item.textContent?.trim();
                // Bracket IDs are exactly 16 uppercase alphanumeric characters
                if (text && /^[A-Z0-9]{16}$/.test(text)) {
                    ids.push(text);
                }
            }

            if (ids.length > 0) {
                console.log('Found', ids.length, 'bracket IDs in dropdown');
                return ids;
            }

            // Fallback: get all visible text and extract IDs
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
        console.log(`   First 5: ${allBracketIds.slice(0, 5).join(', ')}\n`);

        // Close dropdown
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 500));

        const allBrackets = [];
        let targetPlayerBracket = null;

        // Loop through each bracket
        const limit = Math.min(allBracketIds.length, 100); // Limit to 100 for now
        for (let i = 0; i < limit; i++) {
            const bracketId = allBracketIds[i];
            console.log(`\n[${i + 1}/${limit}] ${bracketId}`);

            // Click dropdown again (find the 2nd combobox)
            await page.evaluate(() => {
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    comboboxes[1].click();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 800));

            // Select this bracket
            const selected = await page.evaluate((targetId) => {
                const items = document.querySelectorAll('li, [role="option"], [data-baseweb="menu-item"]');
                for (const item of items) {
                    if (item.textContent?.trim() === targetId) {
                        item.click();
                        return true;
                    }
                }
                return false;
            }, bracketId);

            if (!selected) {
                console.log('  ⚠️  Could not select');
                continue;
            }

            // Wait for table to update
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
                console.log(`  ⚠️  Only ${players.length} players`);
                continue;
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

            // Check for target
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

            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${limit}`);
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
