/**
 * Playwright-based scraper for thetower.lol tournament data
 * Uses MCP Playwright tools to scrape Streamlit app data
 */

class TowerLolPlaywrightScraper {
    constructor(supabase, playwrithtTools) {
        this.supabase = supabase;
        this.playwright = playwrithtTools;
        this.baseUrl = 'https://thetower.lol';
    }

    /**
     * Scrape all brackets for a specific league using Playwright
     * @param {string} league - League name ('Legend', 'Champion', 'Platinum', 'Gold', 'Silver', 'Copper')
     * @returns {Promise<Array>} Array of bracket data with all players
     */
    async scrapeLeagueBrackets(league = 'Legend') {
        console.log(`🌐 Starting Playwright scrape for ${league} league...`);

        try {
            // Navigate to Live Results page
            await this.playwright.navigate(`${this.baseUrl}/liveresults`);
            console.log('✅ Navigated to Live Results page');

            // Wait for page to load
            await this.playwright.wait(3);

            // Select the league radio button
            const leagueRadioRef = await this.findLeagueRadio(league);
            if (leagueRadioRef) {
                await this.playwright.click(league, leagueRadioRef);
                await this.playwright.wait(2);
                console.log(`✅ Selected ${league} league`);
            }

            // Get page snapshot to analyze structure
            const snapshot = await this.playwright.snapshot();

            // Parse the snapshot to extract player data
            const players = this.parseResultsFromSnapshot(snapshot);

            if (players.length === 0) {
                console.log('⚠️ No players found in results');
                return [];
            }

            console.log(`✅ Found ${players.length} players in ${league} league`);

            // Now we need to get bracket IDs by navigating to Live Bracket view
            await this.playwright.navigate(`${this.baseUrl}/livebracketview`);
            await this.playwright.wait(3);

            // Select the same league
            if (leagueRadioRef) {
                await this.playwright.click(league, leagueRadioRef);
                await this.playwright.wait(2);
            }

            // Get all available brackets by clicking bracket selector
            const brackets = await this.getAllBrackets(league, players);

            return brackets;

        } catch (error) {
            console.error('❌ Playwright scraping failed:', error.message);
            return [];
        }
    }

    /**
     * Find the radio button ref for a specific league
     */
    findLeagueRadio(league) {
        // Map league names to likely radio button patterns
        // This would need to be extracted from actual snapshot
        const leagueMap = {
            'Legend': 'e109',
            'Champion': 'e115',
            'Platinum': 'e121',
            'Gold': 'e127',
            'Silver': 'e133',
            'Copper': 'e139'
        };
        return leagueMap[league];
    }

    /**
     * Parse player data from Live Results snapshot
     */
    parseResultsFromSnapshot(snapshot) {
        const players = [];

        // The snapshot contains structured data
        // We need to find the table rows with player data
        // This is a simplified parser - actual implementation would parse YAML structure

        console.log('📊 Parsing player data from snapshot...');

        // TODO: Implement proper YAML snapshot parsing
        // For now, return empty array as placeholder

        return players;
    }

    /**
     * Get all brackets by iterating through bracket selector
     */
    async getAllBrackets(league, allPlayers) {
        const brackets = [];

        console.log('🔍 Fetching all bracket data...');

        // Click on bracket dropdown to see all options
        // Parse bracket IDs from dropdown
        // For each bracket:
        //   - Select it
        //   - Get player data
        //   - Calculate stats (median, total)

        // This is a placeholder structure
        return brackets;
    }

    /**
     * Simple demonstration scraper that gets data from one visible bracket
     */
    async scrapeCurrentBracket(league = 'Legend') {
        console.log(`🎯 Scraping current ${league} bracket (demo mode)...`);

        try {
            // Navigate to bracket view
            await this.playwright.navigate(`${this.baseUrl}/livebracketview`);
            console.log('✅ Navigated to bracket view');

            // Wait for page load
            await this.playwright.wait(4);

            // Get snapshot
            const snapshot = await this.playwright.snapshot();
            console.log('✅ Got page snapshot');

            // Parse the current visible bracket
            const bracketData = this.parseCurrentBracketFromSnapshot(snapshot);

            if (!bracketData) {
                console.log('⚠️ Could not parse bracket data');
                return null;
            }

            console.log(`✅ Parsed bracket: ${bracketData.bracketId}`);
            console.log(`   ${bracketData.players.length} players found`);

            return bracketData;

        } catch (error) {
            console.error('❌ Failed to scrape current bracket:', error.message);
            return null;
        }
    }

    /**
     * Parse current visible bracket from snapshot
     * This extracts data from the YAML snapshot structure
     */
    parseCurrentBracketFromSnapshot(snapshot) {
        try {
            // The snapshot is a YAML-like structure
            // We need to find the table with player data

            // Look for the bracket ID in the snapshot
            let bracketId = null;
            let players = [];

            // Parse YAML snapshot (simplified - would need proper parser)
            const snapshotStr = JSON.stringify(snapshot);

            // Extract bracket ID from button or display text
            const bracketMatch = snapshotStr.match(/bracket[_\s]*(?:of|id|ID)?[:\s]*([A-Z0-9]{16})/i);
            if (bracketMatch) {
                bracketId = bracketMatch[1];
            }

            // Look for table rows with player data
            // Format: player_id, name, real_name, wave, datetime
            // This would parse the actual table structure from snapshot

            if (!bracketId) {
                console.log('⚠️ Could not find bracket ID in snapshot');
                return null;
            }

            // Calculate bracket stats
            const waves = players.map(p => p.wave);
            const medianWave = this.calculateMedian(waves);
            const totalWaves = waves.reduce((a, b) => a + b, 0);

            return {
                bracketId,
                players,
                medianWave,
                totalWaves,
                league: 'Legend' // Would be passed as parameter
            };

        } catch (error) {
            console.error('❌ Failed to parse bracket:', error.message);
            return null;
        }
    }

    /**
     * Calculate median of an array
     */
    calculateMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Store scraped tournament data to database
     */
    async storeTournamentData(brackets, league, tournamentDate) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured');
            return;
        }

        try {
            console.log(`💾 Storing ${brackets.length} brackets to database...`);

            const records = [];

            brackets.forEach(bracket => {
                bracket.players.forEach((player, index) => {
                    records.push({
                        tournament_date: tournamentDate.toISOString(),
                        league: league.toLowerCase(),
                        bracket_id: bracket.bracketId,
                        player_id: player.playerId,
                        player_name: player.name,
                        real_name: player.realName,
                        wave: player.wave,
                        rank: index + 1, // 1-indexed rank
                        relic: player.relic || null,
                        bracket_median_wave: bracket.medianWave,
                        bracket_total_waves: bracket.totalWaves
                    });
                });
            });

            console.log(`   Total records to insert: ${records.length}`);

            // Batch insert
            const BATCH_SIZE = 500;
            for (let i = 0; i < records.length; i += BATCH_SIZE) {
                const batch = records.slice(i, i + BATCH_SIZE);

                const { error } = await this.supabase.supabase
                    .from('tournament_brackets')
                    .insert(batch);

                if (error) {
                    console.error(`❌ Error storing batch:`, error.message);
                } else {
                    console.log(`   ✅ Stored ${batch.length} records`);
                }

                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log('✅ Tournament data stored successfully');

        } catch (error) {
            console.error('❌ Failed to store tournament data:', error.message);
        }
    }
}

module.exports = TowerLolPlaywrightScraper;
