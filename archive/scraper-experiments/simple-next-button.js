/**
 * SIMPLE NEXT BUTTON SCRAPER
 * Just click Next Bracket and wait 10 seconds. That's it.
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
    console.log('🚀 SIMPLE NEXT BUTTON SCRAPER');
    console.log('📊 Click Next Bracket → Wait 10 seconds → Repeat\n');

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

        console.log('⏳ Waiting for table...');
        await page.waitForFunction(() => {
            return document.querySelectorAll('table tbody tr').length >= 30;
        }, { timeout: 40000 });

        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Loaded!\n');

        const allBrackets = [];
        const seenBracketIds = new Set();
        let targetPlayerBracket = null;

        for (let i = 0; i < 200; i++) {
            console.log(`\n[${i + 1}] Scraping...`);

            // Get bracket ID
            const bracketId = await page.evaluate(() => {
                const text = document.body.innerText;
                // Look for "Selected BRACKETID" or just find any 16-char ID
                const match = text.match(/Selected\s+([A-Z0-9]{16})/);
                if (match) return match[1];

                // Fallback: look in the Select Bracket dropdown text
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                if (comboboxes.length >= 2) {
                    const dropdownText = comboboxes[1].textContent;
                    const m = dropdownText?.match(/([A-Z0-9]{16})/);
                    if (m) return m[1];
                }

                return null;
            });

            if (!bracketId) {
                console.log('  ⚠️  No bracket ID found');
                continue;
            }

            console.log(`  ID: ${bracketId}`);

            if (seenBracketIds.has(bracketId)) {
                console.log('  ✅ LOOP! Already saw this bracket');
                break;
            }

            seenBracketIds.add(bracketId);

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

            console.log(`  Players: ${players.length}`);

            if (players.length < 20) {
                console.log('  ⚠️  Too few players, stopping');
                break;
            }

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
                console.log(`  🎯 FOUND! ${targetPlayer.realName}`);
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

            console.log(`  ✅ Stored`);
            allBrackets.push({ bracketId, players });

            // SIMPLE: Just click Next Bracket and wait 10 seconds
            console.log('  ➡️  Clicking Next Bracket...');

            const buttonClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const nextBtn = buttons.find(b => b.textContent?.includes('Next Bracket'));
                if (nextBtn) {
                    nextBtn.click();
                    return true;
                }
                return false;
            });

            if (!buttonClicked) {
                console.log('  ❌ Button not found');
                break;
            }

            console.log('  ⏳ Waiting 10 seconds for next bracket...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 ${i + 1} brackets done`);
            }
        }

        // RESULTS
        console.log('\n\n' + '='.repeat(60));
        console.log('RESULTS');
        console.log('='.repeat(60));
        console.log(`Brackets: ${allBrackets.length}`);

        if (targetPlayerBracket) {
            const { player } = targetPlayerBracket;
            console.log(`\n🎯 ${player.realName} - #${player.rank}, ${player.wave} waves`);

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
            const difficulty = (worse / allBrackets.length) * 100;

            console.log(`\nAVERAGE RANK WITH ${player.wave} WAVES: #${avgRank.toFixed(1)}`);
            console.log(`Best: #${Math.min(...ranks)} | Worst: #${Math.max(...ranks)}`);
            console.log(`Difficulty: ${difficulty.toFixed(1)}/100`);

            if (difficulty < 40) {
                console.log(`\n💪 UNLUCKY BRACKET!`);
            } else if (difficulty > 60) {
                console.log(`\n🍀 LUCKY BRACKET!`);
            }
        }

    } catch (error) {
        console.error('\n❌', error.message);
    } finally {
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
