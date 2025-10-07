const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scraper for thetower.lol tournament data
 * Fetches bracket results and calculates difficulty scores
 */
class TowerLolScraper {
    constructor(supabase) {
        this.supabase = supabase;
        this.baseUrl = 'https://thetower.lol';
        this.isRunning = false;
    }

    /**
     * Fetch all bracket data for a specific league
     * @param {string} league - 'Legend', 'Champion', 'Platinum', 'Gold', 'Silver', 'Copper'
     * @returns {Promise<Array>} Array of bracket data
     */
    async fetchLeagueBrackets(league = 'Legend') {
        try {
            console.log(`📊 Fetching ${league} league brackets from thetower.lol...`);

            // The site uses Streamlit which makes dynamic requests
            // We'll need to analyze the network requests to find the actual API endpoint
            // For now, let's try to scrape the live results page

            const url = `${this.baseUrl}/liveresults`;
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            // Streamlit apps load data dynamically via WebSocket/API calls
            // We may need to reverse engineer their API or use Playwright
            console.log('⚠️ Note: thetower.lol uses Streamlit - may require browser automation');

            return [];
        } catch (error) {
            console.error('❌ Failed to fetch league brackets:', error.message);
            return [];
        }
    }

    /**
     * Search for a player's bracket by player ID
     * @param {string} playerId - Player's unique ID (e.g., '188EAC641A3EBC7A')
     * @returns {Promise<Object>} Player's bracket data
     */
    async findPlayerBracket(playerId) {
        try {
            console.log(`🔍 Searching for player ${playerId}...`);

            // The site has a player search endpoint
            // We can use the player stats page to find their current bracket
            const url = `${this.baseUrl}/player?player=${playerId}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            });

            // Parse the response to extract bracket information
            // This will require analyzing the Streamlit response structure
            console.log('✅ Player page loaded');

            return {
                playerId,
                found: false,
                message: 'Streamlit scraping requires browser automation'
            };
        } catch (error) {
            console.error(`❌ Failed to find player ${playerId}:`, error.message);
            return null;
        }
    }

    /**
     * Scrape all brackets using Playwright (browser automation)
     * This is the proper way to scrape Streamlit apps
     * @param {string} league - League to scrape
     * @returns {Promise<Array>} All brackets data
     */
    async scrapeBracketsWithBrowser(league = 'Legend') {
        console.log(`🌐 Starting browser-based scrape for ${league} league...`);
        console.log('⚠️ This requires Playwright MCP integration');

        // We'll implement this using the Playwright MCP tools available
        // For now, return empty array as placeholder
        return [];
    }

    /**
     * Calculate bracket difficulty score for a player
     * @param {string} playerId - Player's ID
     * @param {number} playerWave - Player's wave count in their bracket
     * @param {Array} allBrackets - All brackets in the same league
     * @returns {Object} Difficulty analysis
     */
    calculateBracketDifficulty(playerId, playerWave, allBrackets) {
        if (!allBrackets || allBrackets.length === 0) {
            return {
                error: 'No bracket data available'
            };
        }

        console.log(`📊 Calculating bracket difficulty for ${playerId} (${playerWave} waves)...`);

        // Calculate where this player would rank in each bracket
        const rankings = allBrackets.map(bracket => {
            // Count how many players in this bracket have more waves than our player
            const playersAbove = bracket.players.filter(p => p.wave > playerWave).length;
            const rank = playersAbove + 1;

            return {
                bracketId: bracket.bracketId,
                hypotheticalRank: rank,
                medianWave: bracket.medianWave,
                totalWaves: bracket.totalWaves,
                winnerWave: bracket.players[0]?.wave || 0
            };
        });

        // Sort by hypothetical rank
        rankings.sort((a, b) => a.hypotheticalRank - b.hypotheticalRank);

        // Calculate statistics
        const avgRank = rankings.reduce((sum, r) => sum + r.hypotheticalRank, 0) / rankings.length;
        const bestRank = rankings[0].hypotheticalRank;
        const worstRank = rankings[rankings.length - 1].hypotheticalRank;

        // Count distribution
        const rankDistribution = {};
        rankings.forEach(r => {
            const rank = r.hypotheticalRank;
            rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
        });

        // Calculate difficulty percentile (0-100, higher = harder bracket)
        // Find player's actual bracket and compare
        const actualBracket = allBrackets.find(b =>
            b.players.some(p => p.playerId === playerId)
        );

        let actualRank = 1;
        if (actualBracket) {
            actualRank = actualBracket.players.findIndex(p => p.playerId === playerId) + 1;
        }

        // Difficulty score: how many brackets would player do worse in
        const bracketsWouldDoWorse = rankings.filter(r => r.hypotheticalRank > actualRank).length;
        const difficultyPercentile = (bracketsWouldDoWorse / rankings.length) * 100;

        return {
            playerId,
            playerWave,
            actualRank,
            actualBracketId: actualBracket?.bracketId,
            totalBracketsAnalyzed: allBrackets.length,

            // Summary stats
            bestPossibleRank: bestRank,
            worstPossibleRank: worstRank,
            averageRank: avgRank.toFixed(1),

            // Difficulty score (0-100, higher = harder)
            difficultyScore: difficultyPercentile.toFixed(1),
            difficultyLabel: this.getDifficultyLabel(difficultyPercentile),

            // Distribution
            rankDistribution,

            // Top/Bottom brackets
            easiestBrackets: rankings.slice(0, 5),
            hardestBrackets: rankings.slice(-5).reverse(),

            // Percentile comparisons
            percentileBetterThanWinners: this.calculatePercentile(
                playerWave,
                allBrackets.map(b => b.players[0]?.wave || 0)
            )
        };
    }

    /**
     * Get difficulty label from percentile
     */
    getDifficultyLabel(percentile) {
        if (percentile >= 80) return 'Very Easy';
        if (percentile >= 60) return 'Easy';
        if (percentile >= 40) return 'Medium';
        if (percentile >= 20) return 'Hard';
        return 'Very Hard';
    }

    /**
     * Calculate percentile of a value in a dataset
     */
    calculatePercentile(value, dataset) {
        const sorted = [...dataset].sort((a, b) => a - b);
        const below = sorted.filter(v => v < value).length;
        return ((below / sorted.length) * 100).toFixed(1);
    }

    /**
     * Store tournament data in Supabase
     * @param {Array} brackets - Array of bracket data
     * @param {string} league - League name
     * @param {Date} tournamentDate - Tournament date
     */
    async storeTournamentData(brackets, league, tournamentDate) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured, skipping storage');
            return;
        }

        try {
            console.log(`💾 Storing ${brackets.length} brackets for ${league} league...`);

            const records = [];

            brackets.forEach(bracket => {
                bracket.players.forEach(player => {
                    records.push({
                        tournament_date: tournamentDate.toISOString(),
                        league: league.toLowerCase(),
                        bracket_id: bracket.bracketId,
                        player_id: player.playerId,
                        player_name: player.name,
                        real_name: player.realName,
                        wave: player.wave,
                        rank: player.rank,
                        relic: player.relic || null,
                        bracket_median_wave: bracket.medianWave,
                        bracket_total_waves: bracket.totalWaves
                    });
                });
            });

            // Batch insert
            const BATCH_SIZE = 500;
            for (let i = 0; i < records.length; i += BATCH_SIZE) {
                const batch = records.slice(i, i + BATCH_SIZE);

                const { error } = await this.supabase.supabase
                    .from('tournament_brackets')
                    .insert(batch);

                if (error) {
                    console.error(`❌ Error storing batch ${i / BATCH_SIZE + 1}:`, error.message);
                } else {
                    console.log(`   ✅ Stored ${batch.length} records (batch ${i / BATCH_SIZE + 1})`);
                }
            }

            console.log(`✅ Stored ${records.length} total records`);
        } catch (error) {
            console.error('❌ Failed to store tournament data:', error.message);
        }
    }

    /**
     * Get latest tournament data for a league from database
     * @param {string} league - League name
     * @returns {Promise<Array>} Bracket data
     */
    async getLatestTournamentData(league) {
        if (!this.supabase || !this.supabase.supabase) {
            return [];
        }

        try {
            // Get the most recent tournament date for this league
            const { data: latestData, error: dateError } = await this.supabase.supabase
                .from('tournament_brackets')
                .select('tournament_date')
                .eq('league', league.toLowerCase())
                .order('tournament_date', { ascending: false })
                .limit(1);

            if (dateError || !latestData || latestData.length === 0) {
                return [];
            }

            const tournamentDate = latestData[0].tournament_date;

            // Fetch all data for this tournament
            const { data, error } = await this.supabase.supabase
                .from('tournament_brackets')
                .select('*')
                .eq('league', league.toLowerCase())
                .eq('tournament_date', tournamentDate);

            if (error) {
                console.error('❌ Error fetching tournament data:', error.message);
                return [];
            }

            // Group by bracket
            const bracketsMap = {};
            data.forEach(record => {
                if (!bracketsMap[record.bracket_id]) {
                    bracketsMap[record.bracket_id] = {
                        bracketId: record.bracket_id,
                        medianWave: record.bracket_median_wave,
                        totalWaves: record.bracket_total_waves,
                        players: []
                    };
                }

                bracketsMap[record.bracket_id].players.push({
                    playerId: record.player_id,
                    name: record.player_name,
                    realName: record.real_name,
                    wave: record.wave,
                    rank: record.rank,
                    relic: record.relic
                });
            });

            // Sort players in each bracket by rank
            Object.values(bracketsMap).forEach(bracket => {
                bracket.players.sort((a, b) => a.rank - b.rank);
            });

            return Object.values(bracketsMap);
        } catch (error) {
            console.error('❌ Failed to get tournament data:', error.message);
            return [];
        }
    }
}

module.exports = TowerLolScraper;
