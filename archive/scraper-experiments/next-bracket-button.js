/**
 * NEXT BRACKET BUTTON SCRAPER
 * Just click the "Next Bracket" button at the bottom
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

async function scrapeWithNextButton() {
    console.log('🔘 NEXT BRACKET BUTTON SCRAPER');
    console.log('📊 Click "Next Bracket" button repeatedly\n');

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
        let noNewDataCount = 0;

        // Try up to 100 brackets
        for (let i = 0; i < 100; i++) {
            console.log(`\n[${i + 1}] Scraping current bracket...`);

            // Get current bracket ID from page
            const bracketId = await page.evaluate(() => {
                // Look for "Selected" text followed by bracket ID
                const text = document.body.innerText;

                // Try pattern: "Selected XXXXXXXXXXXXXXXX"
                let match = text.match(/Selected[:\s]+([A-F0-9]{16})/i);
                if (match) return match[1].toUpperCase();

                // Try getting from the middle combobox (Select Bracket dropdown)
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    const comboText = comboboxes[1].textContent?.trim();
                    match = comboText?.match(/\b([A-F0-9]{16})\b/i);
                    if (match) return match[1].toUpperCase();
                }

                return null;
            });

            if (!bracketId) {
                console.log('  ⚠️  No bracket ID found');
                noNewDataCount++;
                if (noNewDataCount >= 3) break;
            } else if (seenBracketIds.has(bracketId)) {
                console.log(`  🔄 Already scraped ${bracketId} - loop detected`);
                break;
            } else {
                console.log(`  📋 Bracket: ${bracketId}`);
                seenBracketIds.add(bracketId);
                noNewDataCount = 0;

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

            // Click "Next Bracket" button
            console.log('  🔘 Clicking "Next Bracket" button...');
            const clicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const nextBtn = buttons.find(b => {
                    const text = b.textContent?.trim();
                    return text && (text.includes('Next Bracket') || text === 'Next');
                });

                if (nextBtn) {
                    console.log('Found button:', nextBtn.textContent);
                    nextBtn.click();
                    return true;
                }

                console.log('Next Bracket button not found. Available buttons:',
                    buttons.map(b => b.textContent?.trim()).filter(t => t));
                return false;
            });

            if (!clicked) {
                console.log('  ❌ Next Bracket button not found - stopping');
                break;
            }

            console.log('  ⏳ Waiting 10 seconds for next bracket to load...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Wait for table
            await page.waitForFunction(() => {
                return document.querySelectorAll('table tbody tr').length >= 30;
            }, { timeout: 15000 }).catch(() => {
                console.log('  ⚠️  Timeout waiting for table');
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 Progress: ${seenBracketIds.size} unique brackets`);
            }
        }

        // RESULTS
        console.log('\n\n' + '='.repeat(60));
        console.log('FINAL RESULTS');
        console.log('='.repeat(60));
        console.log(`Unique Brackets: ${seenBracketIds.size}`);

        if (targetPlayerBracket) {
            console.log(`\n🎯 Target player found in bracket: ${targetPlayerBracket.bracketId}`);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    } finally {
        console.log('\n⏳ Waiting before close...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await browser.close();
    }
}

scrapeWithNextButton()
    .then(() => {
        console.log('\n🎉 DONE!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal:', error);
        process.exit(1);
    });
