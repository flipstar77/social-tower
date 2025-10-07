/**
 * FINAL SCRAPER - Click dropdown, extract IDs, loop through
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
    console.log('🚀 FINAL SCRAPER');
    console.log('📊 Click dropdown, extract ALL bracket IDs, loop through\n');

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

        // Wait for table to fully load
        console.log('⏳ Waiting for table...');
        await page.waitForSelector('table tbody tr', { timeout: 40000 });

        // Wait for brackets to populate
        await page.waitForFunction(() => {
            return document.querySelectorAll('table tbody tr').length >= 30;
        }, { timeout: 30000 });

        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Page loaded!\n');

        // STEP 1: Click the "Select Bracket" dropdown to open it
        console.log('📋 Opening bracket dropdown...');

        const dropdownOpened = await page.evaluate(() => {
            // Find dropdown with "Select Bracket" text
            const divs = Array.from(document.querySelectorAll('div'));
            const dropdown = divs.find(d => {
                const text = d.textContent || '';
                return text.includes('Select Bracket') && d.getAttribute('role') !== null;
            });

            if (dropdown) {
                dropdown.click();
                return true;
            }

            // Alternative: click any element with a combobox role
            const combobox = document.querySelector('[role="combobox"]');
            if (combobox) {
                combobox.click();
                return true;
            }

            return false;
        });

        if (!dropdownOpened) {
            console.log('❌ Could not open dropdown!');
            await page.screenshot({ path: 'd:/social tower/debug-no-dropdown.png' });
            return;
        }

        console.log('✅ Dropdown opened');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // STEP 2: Extract all bracket IDs from the opened dropdown
        const allBracketIds = await page.evaluate(() => {
            // Look for listbox options (Streamlit dropdown)
            const options = document.querySelectorAll('[role="option"]');
            const ids = Array.from(options)
                .map(opt => opt.textContent?.trim())
                .filter(text => text && text.match(/^[A-Z0-9]{16}$/));

            if (ids.length > 0) return ids;

            // Fallback: search for any 16-char IDs in visible text
            const bodyText = document.body.innerText;
            const matches = bodyText.match(/\b[A-Z0-9]{16}\b/g);
            return matches ? [...new Set(matches)] : [];
        });

        if (allBracketIds.length === 0) {
            console.log('❌ No bracket IDs found!');
            await page.screenshot({ path: 'd:/social tower/debug-no-ids.png' });
            return;
        }

        console.log(`✅ Found ${allBracketIds.length} brackets!`);
        console.log(`   Sample: ${allBracketIds.slice(0, 3).join(', ')}...\n`);

        // Close dropdown
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 500));

        const allBrackets = [];
        let targetPlayerBracket = null;

        // STEP 3: Loop through each bracket
        for (let i = 0; i < Math.min(allBracketIds.length, 200); i++) {
            const bracketId = allBracketIds[i];
            console.log(`\n[${i + 1}/${allBracketIds.length}] ${bracketId}`);

            // Click dropdown again
            await page.evaluate(() => {
                const combobox = document.querySelector('[role="combobox"]');
                if (combobox) combobox.click();
            });
            await new Promise(resolve => setTimeout(resolve, 800));

            // Select this bracket ID
            const selected = await page.evaluate((targetId) => {
                const options = document.querySelectorAll('[role="option"]');
                for (const opt of options) {
                    if (opt.textContent?.includes(targetId)) {
                        opt.click();
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
                targetPlayerBracket = { bracketId, player: targetPlayer, medianWave };
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

            allBrackets.push({ bracketId, players, medianWave });

            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${allBracketIds.length}`);
            }
        }

        // RESULTS
        console.log('\n\n' + '='.repeat(60));
        console.log('FINAL RESULTS');
        console.log('='.repeat(60));
        console.log(`Scraped: ${allBrackets.length} brackets`);

        if (targetPlayerBracket) {
            const { player } = targetPlayerBracket;
            console.log(`\n🎯 YOUR STATS:`);
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

            console.log(`\n📈 ACROSS ALL ${allBrackets.length} BRACKETS:`);
            console.log(`   Average Rank: #${avgRank.toFixed(1)}`);
            console.log(`   Best: #${bestRank} | Worst: #${worstRank}`);
            console.log(`   Difficulty: ${difficulty.toFixed(1)}/100`);
            console.log(`   Better in: ${better} | Worse in: ${worse}`);

            if (difficulty < 40) {
                console.log(`\n💪 HARD BRACKET - UNLUCKY!`);
            } else if (difficulty > 60) {
                console.log(`\n🍀 EASY BRACKET - LUCKY!`);
            } else {
                console.log(`\n😐 AVERAGE BRACKET`);
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
