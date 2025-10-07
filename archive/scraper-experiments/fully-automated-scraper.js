/**
 * FULLY AUTOMATED Tournament Bracket Scraper
 * NO USER APPROVAL REQUIRED - Runs completely autonomously
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const { chromium } = require('playwright');
const SupabaseManager = require('../supabase-config');

const supabase = new SupabaseManager();
const TOURNAMENT_DATE = '2025-10-04T00:30:00Z';
const LEAGUE = 'legend';
const TARGET_PLAYER = '188EAC641A3EBC7A';

async function scrapeAllBrackets() {
    console.log('🚀 FULLY AUTOMATED BRACKET SCRAPER');
    console.log('📊 Scraping ALL Legend League brackets...');
    console.log('⏰ This will take 5-10 minutes - NO APPROVAL NEEDED!\n');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate to bracket view
        console.log('🌐 Loading thetower.lol...');
        await page.goto('https://thetower.lol/livebracketview', { waitUntil: 'networkidle' });

        // Wait for the table to actually load (Streamlit is slow)
        console.log('⏳ Waiting for table to load...');
        await page.waitForSelector('table tbody tr', { timeout: 30000 });
        await page.waitForTimeout(2000);

        console.log('✅ Page loaded with table\n');

        const allBrackets = [];
        const seenBracketIds = new Set();
        let bracketCount = 0;
        let targetPlayerBracket = null;

        while (true) {
            bracketCount++;
            console.log(`\n📦 Scraping Bracket #${bracketCount}...`);

            // Extract bracket ID from dropdown (try multiple selectors for Streamlit)
            const bracketId = await page.evaluate(() => {
                // Try multiple ways to find the bracket ID
                let text = '';

                // Method 1: Look for combobox with "Selected" text
                const comboboxes = document.querySelectorAll('[role="combobox"]');
                for (const box of comboboxes) {
                    const boxText = box.textContent || box.innerText || '';
                    if (boxText.includes('Selected') || boxText.match(/[A-Z0-9]{16}/)) {
                        text = boxText;
                        break;
                    }
                }

                // Method 2: Look for any element with the pattern
                if (!text) {
                    const allText = document.body.innerText;
                    const match = allText.match(/Selected\s+([A-Z0-9]{16})/);
                    if (match) return match[1];
                }

                // Extract ID from text
                const match = text.match(/([A-Z0-9]{16})/);
                return match ? match[1] : null;
            });

            if (!bracketId) {
                console.log('⚠️  Could not extract bracket ID, retrying...');
                await page.waitForTimeout(2000);
                continue;
            }

            console.log(`   Bracket ID: ${bracketId}`);

            // Check if we've looped back to start
            if (seenBracketIds.has(bracketId)) {
                console.log('✅ LOOP DETECTED - All brackets scraped!');
                break;
            }

            seenBracketIds.add(bracketId);

            // Extract all 30 players from table
            const players = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                const playerData = [];

                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 6) {
                        const playerId = cells[1]?.textContent?.trim();
                        const name = cells[2]?.textContent?.trim();
                        const realName = cells[3]?.textContent?.trim();
                        const wave = parseInt(cells[4]?.textContent?.trim());
                        const rank = index + 1;

                        if (playerId && playerId.length === 16 && !isNaN(wave)) {
                            playerData.push({
                                playerId,
                                name,
                                realName,
                                wave,
                                rank
                            });
                        }
                    }
                });

                return playerData;
            });

            if (players.length !== 30) {
                console.log(`   ⚠️  Warning: Found ${players.length} players (expected 30)`);
            } else {
                console.log(`   ✅ Extracted ${players.length} players`);
            }

            // Calculate bracket stats
            const waves = players.map(p => p.wave);
            const medianWave = calculateMedian(waves);
            const totalWaves = waves.reduce((a, b) => a + b, 0);

            console.log(`   📊 Median: ${medianWave}, Total: ${totalWaves}`);

            // Check if target player is in this bracket
            const targetPlayer = players.find(p => p.playerId === TARGET_PLAYER);
            if (targetPlayer) {
                console.log(`   🎯 FOUND TARGET PLAYER: ${targetPlayer.realName} (Rank #${targetPlayer.rank}, Wave ${targetPlayer.wave})`);
                targetPlayerBracket = {
                    bracketId,
                    player: targetPlayer,
                    medianWave,
                    totalWaves
                };
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

            const { error } = await supabase.supabase
                .from('tournament_brackets')
                .upsert(records, { onConflict: 'tournament_date,league,player_id' });

            if (error) {
                console.log(`   ❌ Database error: ${error.message}`);
            } else {
                console.log(`   💾 Stored to database`);
            }

            allBrackets.push({
                bracketId,
                players,
                medianWave,
                totalWaves
            });

            // Click "Next Bracket" button
            try {
                await page.click('button:has-text("Next Bracket →")');
                console.log('   ➡️  Clicking next bracket...');
                await page.waitForTimeout(2000);
            } catch (e) {
                console.log('   ❌ Could not click next bracket button');
                break;
            }

            // Safety: Stop after 200 brackets (shouldn't happen)
            if (bracketCount >= 200) {
                console.log('⚠️  Safety limit reached (200 brackets)');
                break;
            }
        }

        console.log('\n\n' + '='.repeat(60));
        console.log('📊 FINAL RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Total brackets scraped: ${allBrackets.length}`);
        console.log(`📁 Total players stored: ${allBrackets.length * 30}`);
        console.log(`🔢 Bracket IDs: ${Array.from(seenBracketIds).join(', ')}`);

        if (targetPlayerBracket) {
            console.log('\n' + '='.repeat(60));
            console.log('🎯 TARGET PLAYER ANALYSIS');
            console.log('='.repeat(60));
            const { player, medianWave, bracketId } = targetPlayerBracket;
            console.log(`Player: ${player.realName} (${player.name})`);
            console.log(`Bracket: ${bracketId}`);
            console.log(`Rank: #${player.rank} / 30`);
            console.log(`Wave: ${player.wave}`);
            console.log(`Bracket Median: ${medianWave}`);
            console.log(`Difference from Median: ${player.wave - medianWave} waves`);

            // Calculate difficulty
            console.log('\n📈 BRACKET DIFFICULTY ANALYSIS...');
            let betterRanks = 0;
            let worseRanks = 0;

            allBrackets.forEach(bracket => {
                const playersAbove = bracket.players.filter(p => p.wave > player.wave).length;
                const hypotheticalRank = playersAbove + 1;

                if (hypotheticalRank < player.rank) betterRanks++;
                if (hypotheticalRank > player.rank) worseRanks++;
            });

            const difficultyScore = (worseRanks / allBrackets.length) * 100;
            let difficultyLabel = '';
            if (difficultyScore >= 80) difficultyLabel = 'Very Easy';
            else if (difficultyScore >= 60) difficultyLabel = 'Easy';
            else if (difficultyScore >= 40) difficultyLabel = 'Medium';
            else if (difficultyScore >= 20) difficultyLabel = 'Hard';
            else difficultyLabel = 'Very Hard';

            console.log(`\n🎲 DIFFICULTY SCORE: ${difficultyScore.toFixed(1)}/100`);
            console.log(`   Label: ${difficultyLabel}`);
            console.log(`   Would do better in: ${betterRanks} brackets`);
            console.log(`   Would do worse in: ${worseRanks} brackets`);

            if (difficultyScore < 50) {
                console.log(`\n💪 You got UNLUCKY! Your bracket was harder than average.`);
            } else {
                console.log(`\n🍀 You got LUCKY! Your bracket was easier than average.`);
            }

            // Store analysis to database
            await supabase.supabase.from('bracket_difficulty_analysis').insert({
                discord_user_id: 'PLACEHOLDER_' + TARGET_PLAYER,
                league: LEAGUE,
                wave: player.wave,
                difficulty_score: difficultyScore,
                difficulty_label: difficultyLabel,
                actual_rank: player.rank,
                total_brackets_analyzed: allBrackets.length,
                analyzed_at: new Date().toISOString()
            });

            console.log('💾 Analysis stored to database');
        } else {
            console.log(`\n⚠️  Target player ${TARGET_PLAYER} not found in any bracket`);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        console.log('\n✅ Browser closed');
    }
}

function calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
}

// Run immediately
scrapeAllBrackets()
    .then(() => {
        console.log('\n🎉 SCRAPING COMPLETE!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
