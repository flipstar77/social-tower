/**
 * Tournament Automation Service
 * Handles automated scraping, run matching, and bracket difficulty analysis
 */

const cron = require('node-cron');
const TowerLolScraper = require('./tower-lol-scraper');

class TournamentAutomationService {
    constructor(supabase) {
        this.supabase = supabase;
        this.scraper = new TowerLolScraper(supabase);
        this.isRunning = false;
        this.lastScrapeDate = null;
    }

    /**
     * Start automated tournament scraping
     * Runs every 3 days at 2 AM (after tournaments typically end)
     */
    startScheduledScraping() {
        console.log('🤖 Starting automated tournament scraping service...');

        // Run every 3 days at 2 AM
        cron.schedule('0 2 */3 * *', async () => {
            console.log('⏰ Scheduled tournament scrape triggered');
            await this.runFullTournamentAnalysis();
        });

        console.log('✅ Tournament scraper scheduled (every 3 days at 2 AM)');
    }

    /**
     * Full tournament analysis workflow:
     * 1. Scrape latest tournament data from thetower.lol
     * 2. Match with player runs in database
     * 3. Calculate bracket difficulty for all players
     * 4. Send notifications
     */
    async runFullTournamentAnalysis() {
        if (this.isRunning) {
            console.log('⚠️ Tournament analysis already running, skipping...');
            return;
        }

        this.isRunning = true;
        console.log('\n🏆 Starting Full Tournament Analysis\n');

        try {
            const tournamentDate = new Date();
            const leagues = ['Legend', 'Champion', 'Platinum', 'Gold', 'Silver', 'Copper'];

            // Step 1: Scrape tournament data for all leagues
            console.log('📊 Step 1: Scraping tournament data from thetower.lol...');
            const allBrackets = [];

            for (const league of leagues) {
                console.log(`   Scraping ${league} league...`);

                // TODO: Implement actual Playwright scraping
                // For now, this is a placeholder
                const brackets = await this.scrapeTournamentData(league);

                if (brackets.length > 0) {
                    allBrackets.push(...brackets.map(b => ({ ...b, league })));
                    console.log(`   ✅ ${league}: ${brackets.length} brackets scraped`);
                }
            }

            console.log(`✅ Total brackets scraped: ${allBrackets.length}\n`);

            // Step 2: Match tournament runs with player data
            console.log('🔍 Step 2: Matching tournament runs with player data...');
            const matchedRuns = await this.matchTournamentRuns(tournamentDate);
            console.log(`✅ Matched ${matchedRuns.length} tournament runs\n`);

            // Step 3: Calculate bracket difficulty for matched players
            console.log('📈 Step 3: Calculating bracket difficulty for all players...');
            const analysisResults = await this.calculateBracketDifficulties(matchedRuns, allBrackets);
            console.log(`✅ Analyzed ${analysisResults.length} players\n`);

            // Step 4: Store analysis results
            console.log('💾 Step 4: Storing analysis results...');
            await this.storeAnalysisResults(analysisResults);
            console.log('✅ Results stored\n');

            // Step 5: Send notifications (optional)
            console.log('📢 Step 5: Sending notifications...');
            await this.sendBracketNotifications(analysisResults);
            console.log('✅ Notifications sent\n');

            this.lastScrapeDate = tournamentDate;
            console.log('🎉 Tournament analysis complete!\n');

            return {
                success: true,
                bracketsScraped: allBrackets.length,
                runsMatched: matchedRuns.length,
                playersAnalyzed: analysisResults.length,
                timestamp: tournamentDate
            };

        } catch (error) {
            console.error('❌ Tournament analysis failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Scrape tournament data for a specific league
     * TODO: Implement actual Playwright scraping
     */
    async scrapeTournamentData(league) {
        // Placeholder - will be replaced with Playwright scraper
        console.log(`   ⚠️ Playwright scraping not yet implemented for ${league}`);
        return [];
    }

    /**
     * Match tournament runs from tower_runs table
     * Finds runs submitted during the tournament period (last 3-4 days)
     */
    async matchTournamentRuns(tournamentDate) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured');
            return [];
        }

        try {
            // Get runs from the last 4 days (tournament period)
            const fourDaysAgo = new Date(tournamentDate);
            fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

            const { data: runs, error } = await this.supabase.supabase
                .from('tower_runs')
                .select('*')
                .gte('submitted_at', fourDaysAgo.toISOString())
                .lte('submitted_at', tournamentDate.toISOString())
                .order('submitted_at', { ascending: false });

            if (error) {
                console.error('   ❌ Error fetching runs:', error.message);
                return [];
            }

            console.log(`   Found ${runs.length} runs during tournament period`);

            // Group runs by player (discord_user_id)
            const runsByPlayer = {};
            runs.forEach(run => {
                const userId = run.discord_user_id;
                if (!runsByPlayer[userId]) {
                    runsByPlayer[userId] = [];
                }
                runsByPlayer[userId].push(run);
            });

            // For each player, find their best run during tournament
            const tournamentRuns = [];
            Object.entries(runsByPlayer).forEach(([userId, playerRuns]) => {
                // Find highest wave run
                const bestRun = playerRuns.reduce((best, run) => {
                    const runWave = parseInt(run.wave) || 0;
                    const bestWave = parseInt(best.wave) || 0;
                    return runWave > bestWave ? run : best;
                }, playerRuns[0]);

                tournamentRuns.push({
                    discordUserId: userId,
                    wave: parseInt(bestRun.wave) || 0,
                    tier: parseInt(bestRun.tier) || 0,
                    coins: bestRun.coins_earned,
                    submittedAt: bestRun.submitted_at,
                    runId: bestRun.id
                });
            });

            return tournamentRuns;

        } catch (error) {
            console.error('   ❌ Error matching tournament runs:', error.message);
            return [];
        }
    }

    /**
     * Calculate bracket difficulty for all matched players
     */
    async calculateBracketDifficulties(tournamentRuns, allBrackets) {
        const results = [];

        // Group brackets by league
        const bracketsByLeague = {};
        allBrackets.forEach(bracket => {
            if (!bracketsByLeague[bracket.league]) {
                bracketsByLeague[bracket.league] = [];
            }
            bracketsByLeague[bracket.league].push(bracket);
        });

        for (const run of tournamentRuns) {
            // Determine league based on tier/wave
            const league = this.determineLeague(run.tier, run.wave);
            const leagueBrackets = bracketsByLeague[league] || [];

            if (leagueBrackets.length === 0) {
                console.log(`   ⚠️ No brackets found for ${league} league, skipping player`);
                continue;
            }

            // Calculate difficulty using existing algorithm
            const analysis = this.scraper.calculateBracketDifficulty(
                run.discordUserId,
                run.wave,
                leagueBrackets
            );

            results.push({
                discordUserId: run.discordUserId,
                runId: run.runId,
                league,
                wave: run.wave,
                tier: run.tier,
                ...analysis
            });
        }

        return results;
    }

    /**
     * Determine player's league based on tier/wave
     * This is a heuristic - adjust based on actual league thresholds
     */
    determineLeague(tier, wave) {
        if (wave >= 5000) return 'Legend';
        if (wave >= 2500) return 'Champion';
        if (wave >= 2000) return 'Platinum';
        if (wave >= 1500) return 'Gold';
        if (wave >= 500) return 'Silver';
        return 'Copper';
    }

    /**
     * Store bracket difficulty analysis results
     */
    async storeAnalysisResults(results) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured');
            return;
        }

        try {
            const records = results.map(r => ({
                discord_user_id: r.discordUserId,
                run_id: r.runId,
                league: r.league.toLowerCase(),
                wave: r.wave,
                difficulty_score: parseFloat(r.difficultyScore),
                difficulty_label: r.difficultyLabel,
                actual_rank: r.actualRank,
                best_possible_rank: r.bestPossibleRank,
                worst_possible_rank: r.worstPossibleRank,
                average_rank: parseFloat(r.averageRank),
                total_brackets_analyzed: r.totalBracketsAnalyzed,
                percentile_vs_winners: parseFloat(r.percentileBetterThanWinners),
                analyzed_at: new Date().toISOString()
            }));

            // Create table if not exists
            // This will be part of the schema
            const { error } = await this.supabase.supabase
                .from('bracket_difficulty_analysis')
                .insert(records);

            if (error) {
                console.error('   ❌ Error storing analysis:', error.message);
            } else {
                console.log(`   ✅ Stored ${records.length} analysis results`);
            }

        } catch (error) {
            console.error('   ❌ Error storing analysis results:', error.message);
        }
    }

    /**
     * Send Discord notifications about bracket difficulty
     * (Optional - can notify players about their bracket luck)
     */
    async sendBracketNotifications(results) {
        // Group by difficulty to prioritize interesting cases
        const veryHard = results.filter(r => parseFloat(r.difficultyScore) < 20);
        const veryEasy = results.filter(r => parseFloat(r.difficultyScore) > 80);

        console.log(`   📊 Difficulty distribution:`);
        console.log(`      Very Hard (<20): ${veryHard.length} players`);
        console.log(`      Very Easy (>80): ${veryEasy.length} players`);
        console.log(`      Medium: ${results.length - veryHard.length - veryEasy.length} players`);

        // TODO: Implement Discord webhook notifications
        // For very hard/easy cases, could send congratulations or sympathy messages
    }

    /**
     * Get bracket difficulty for a specific run
     */
    async getBracketDifficultyForRun(runId) {
        if (!this.supabase || !this.supabase.supabase) {
            return null;
        }

        try {
            const { data, error } = await this.supabase.supabase
                .from('bracket_difficulty_analysis')
                .select('*')
                .eq('run_id', runId)
                .single();

            if (error || !data) {
                return null;
            }

            return data;

        } catch (error) {
            console.error('❌ Error fetching bracket difficulty:', error.message);
            return null;
        }
    }

    /**
     * Get status of tournament automation service
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastScrapeDate: this.lastScrapeDate,
            scheduledScraping: true,
            schedule: 'Every 3 days at 2 AM'
        };
    }
}

module.exports = TournamentAutomationService;
