/**
 * WORKING Tournament Bracket Scraper
 * Uses REAL MOUSE CLICKS with coordinates
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
    console.log('🚀 WORKING BRACKET SCRAPER');
    console.log('📊 Using REAL mouse clicks on coordinates\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        slowMo: 50 // Slow down to see what's happening
    });

    const page = await browser.newPage();

    try {
        console.log('🌐 Loading thetower.lol...');
        await page.goto('https://thetower.lol/livebracketview', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for table to fully load
        console.log('⏳ Waiting for 30 rows...');
        await page.waitForFunction(() => {
            const rows = document.querySelectorAll('table tbody tr');
            return rows.length >= 30;
        }, { timeout: 30000 });

        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Page loaded!\n');

        const allBrackets = [];
        const seenBracketIds = new Set();
        let bracketCount = 0;
        let targetPlayerBracket = null;

        while (true) {
            bracketCount++;
            console.log(`\n📦 Bracket #${bracketCount}...`);

            // Extract bracket ID
            const bracketId = await page.evaluate(() => {
                const bodyText = document.body.innerText;
                const match = bodyText.match(/Selected\s+([A-Z0-9]{16})/);
                return match ? match[1] : null;
            });

            if (!bracketId) {
                console.log('❌ No bracket ID');
                break;
            }

            console.log(`   ID: ${bracketId}`);

            if (seenBracketIds.has(bracketId)) {
                console.log('✅ LOOP DETECTED!');
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
                        const rank = cells[0]?.textContent?.trim();
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
                                rank: parseInt(rank) || (index + 1)
                            });
                        }
                    }
                });

                return { players: playerData };
            });

            console.log(`   Players: ${players.length}`);

            if (players.length < 20) {
                console.log('   ⚠️  Too few players, skipping');
                break;
            }

            // Calculate stats
            const waves = players.map(p => p.wave);
            const sorted = [...waves].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const medianWave = sorted.length % 2 === 0
                ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
                : sorted[mid];
            const totalWaves = waves.reduce((a, b) => a + b, 0);

            console.log(`   Median: ${medianWave}, Total: ${totalWaves}`);

            // Check for target
            const targetPlayer = players.find(p => p.playerId === TARGET_PLAYER);
            if (targetPlayer) {
                console.log(`   🎯 FOUND: ${targetPlayer.realName} - Rank #${targetPlayer.rank}, Wave ${targetPlayer.wave}`);
                targetPlayerBracket = { bracketId, player: targetPlayer, medianWave, totalWaves };
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

            if (error) {
                console.log(`   ❌ DB: ${error.message}`);
            } else {
                console.log(`   ✅ Stored`);
            }

            allBrackets.push({ bracketId, players, medianWave, totalWaves });

            // REAL MOUSE CLICK using coordinates
            console.log('   🖱️  Finding Next Bracket button...');

            const buttonBox = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const nextButton = buttons.find(btn => btn.textContent.includes('Next Bracket'));
                if (nextButton) {
                    const rect = nextButton.getBoundingClientRect();
                    return {
                        x: rect.x + rect.width / 2,
                        y: rect.y + rect.height / 2,
                        found: true
                    };
                }
                return { found: false };
            });

            if (!buttonBox.found) {
                console.log('   ❌ Button not found');
                break;
            }

            console.log(`   Clicking at (${Math.round(buttonBox.x)}, ${Math.round(buttonBox.y)})`);

            const currentBracketId = bracketId;

            // ACTUAL MOUSE CLICK
            await page.mouse.click(buttonBox.x, buttonBox.y);

            console.log('   ⏳ Waiting for new bracket...');

            // Wait for bracket ID to change
            try {
                await page.waitForFunction((oldId) => {
                    const text = document.body.innerText;
                    const match = text.match(/Selected\s+([A-Z0-9]{16})/);
                    return match && match[1] !== oldId;
                }, { timeout: 15000 }, currentBracketId);
            } catch (e) {
                console.log('   ⚠️  Bracket did not change after click');
            }

            // Wait for 30 rows
            await page.waitForFunction(() => {
                const rows = document.querySelectorAll('table tbody tr');
                return rows.length >= 30;
            }, { timeout: 15000 });

            await new Promise(resolve => setTimeout(resolve, 1500));

            if (bracketCount >= 200) {
                console.log('⚠️  Safety limit');
                break;
            }
        }

        // RESULTS
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESULTS');
        console.log('='.repeat(60));
        console.log(`Brackets: ${allBrackets.length}`);
        console.log(`Players: ${allBrackets.length * 30}`);

        if (targetPlayerBracket) {
            const { player } = targetPlayerBracket;
            console.log(`\n🎯 FOUND YOUR PLAYER!`);
            console.log(`Name: ${player.realName}`);
            console.log(`Rank: #${player.rank}/30`);
            console.log(`Wave: ${player.wave}`);

            // Calculate difficulty
            let better = 0, worse = 0;
            allBrackets.forEach(bracket => {
                const above = bracket.players.filter(p => p.wave > player.wave).length;
                const hypothetical = above + 1;
                if (hypothetical < player.rank) better++;
                if (hypothetical > player.rank) worse++;
            });

            const difficulty = (worse / allBrackets.length) * 100;
            console.log(`\n🎲 DIFFICULTY: ${difficulty.toFixed(1)}/100`);
            console.log(`Would rank better in: ${better} brackets`);
            console.log(`Would rank worse in: ${worse} brackets`);

            if (difficulty < 50) {
                console.log(`\n💪 UNLUCKY BRACKET!`);
            } else {
                console.log(`\n🍀 LUCKY BRACKET!`);
            }
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
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
