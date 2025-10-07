/**
 * LABEL-BASED SCRAPER
 * Find "Select Bracket" dropdown by looking for the label text
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

async function scrapeByLabel() {
    console.log('🏷️  LABEL-BASED SCRAPER');
    console.log('📊 Find "Select Bracket" dropdown by label\n');

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

        // Find the correct dropdown by looking for "Select Bracket" label
        console.log('🔍 Finding "Select Bracket" dropdown...');
        const dropdownInfo = await page.evaluate(() => {
            // Find all text nodes containing "Select Bracket"
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.includes('Select Bracket')) {
                    // Found the label, now find the associated combobox
                    let element = node.parentElement;
                    for (let i = 0; i < 5; i++) {
                        const combobox = element.querySelector('[role="combobox"]');
                        if (combobox) {
                            // Get the index of this combobox among all comboboxes
                            const allComboboxes = Array.from(document.querySelectorAll('[role="combobox"]'));
                            const index = allComboboxes.indexOf(combobox);
                            return {
                                found: true,
                                index,
                                text: combobox.textContent?.trim()
                            };
                        }
                        element = element.parentElement;
                        if (!element) break;
                    }
                }
            }
            return { found: false };
        });

        if (!dropdownInfo.found) {
            console.log('❌ Could not find "Select Bracket" dropdown');
            return;
        }

        console.log(`✅ Found dropdown at index: ${dropdownInfo.index}`);
        console.log(`   Current value: ${dropdownInfo.text}\n`);

        const DROPDOWN_INDEX = dropdownInfo.index;

        // Get all bracket IDs
        console.log('📋 Opening dropdown to get bracket IDs...');
        await page.evaluate((idx) => {
            const comboboxes = document.querySelectorAll('[role="combobox"]');
            if (comboboxes[idx]) {
                comboboxes[idx].click();
            }
        }, DROPDOWN_INDEX);

        await new Promise(resolve => setTimeout(resolve, 3000));

        const allBracketIds = await page.evaluate(() => {
            const items = document.querySelectorAll('li, [role="option"]');
            const ids = [];
            items.forEach(item => {
                const text = item.textContent?.trim();
                if (text && /^[A-F0-9]{16}$/i.test(text)) {
                    ids.push(text.toUpperCase());
                }
            });
            return [...new Set(ids)];
        });

        console.log(`✅ Found ${allBracketIds.length} bracket IDs`);
        if (allBracketIds.length > 0) {
            console.log(`   First 5: ${allBracketIds.slice(0, 5).join(', ')}\n`);
        }

        // Close dropdown
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const allBrackets = [];
        let targetPlayerBracket = null;

        // Scrape each bracket
        const limit = Math.min(allBracketIds.length, 100);
        for (let i = 0; i < limit; i++) {
            const bracketId = allBracketIds[i];
            console.log(`[${i + 1}/${limit}] ${bracketId}`);

            // Open dropdown
            await page.evaluate((idx) => {
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes[idx]) {
                    comboboxes[idx].click();
                }
            }, DROPDOWN_INDEX);
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
                console.log('  ⚠️  Could not select');
                await page.keyboard.press('Escape');
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
            }

            console.log('  ⏳ Waiting...');
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
                console.log(`  ⚠️  Only ${players.length} players`);
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

            console.log(`  💾 Stored\n`);
            allBrackets.push({ bracketId, players });

            if ((i + 1) % 10 === 0) {
                console.log(`📊 Progress: ${i + 1}/${limit}\n`);
            }
        }

        // RESULTS
        console.log('\n' + '='.repeat(60));
        console.log('RESULTS');
        console.log('='.repeat(60));
        console.log(`Brackets: ${allBrackets.length}`);

        if (targetPlayerBracket) {
            console.log(`\n🎯 Target found!`);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    } finally {
        console.log('\n⏳ Waiting before close...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await browser.close();
    }
}

scrapeByLabel()
    .then(() => {
        console.log('\n🎉 DONE!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal:', error);
        process.exit(1);
    });
