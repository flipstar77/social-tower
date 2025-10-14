/**
 * Reddit RAG API - Semantic search endpoint for chatbot
 */

const express = require('express');
const router = express.Router();
const { generateEmbedding } = require('../services/embeddings');

// Grok API configuration
const GROK_API_KEY = 'xai-F6kckg08ToIozASPhQbrMefXJyUedYOCy4CVbRpJ2108HZofhJQofLM89vrLAOdBlvv2t8ECv0sL47wz';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// RAG search endpoint
function createRedditRAGRouter(supabase) {
    /**
     * Search Reddit RAG content (Vector Semantic Search)
     * GET /api/reddit-rag/search?q=tower+defense+strategy&limit=5
     */
    router.get('/search', async (req, res) => {
        try {
            const query = req.query.q || '';
            const limit = Math.min(parseInt(req.query.limit) || 5, 20);
            const threshold = parseFloat(req.query.threshold) || 0.2;

            if (!query.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Query parameter "q" is required'
                });
            }

            console.log(`🔍 Vector search query: "${query}" (limit: ${limit})`);

            // Generate embedding for search query
            const queryEmbedding = await generateEmbedding(query);

            // Use vector similarity search
            const { data, error } = await supabase.supabase
                .rpc('search_reddit_rag_semantic', {
                    query_embedding: queryEmbedding,
                    match_threshold: threshold,
                    match_count: limit
                });

            if (error) {
                console.error('❌ Vector search error:', error.message);

                // Fallback to keyword search if vector search fails
                console.log('⚠️ Falling back to keyword search...');
                const { data: fallbackData, error: fallbackError } = await supabase.supabase
                    .from('reddit_rag_content')
                    .select('*')
                    .textSearch('content', query, {
                        type: 'websearch',
                        config: 'english'
                    })
                    .order('score', { ascending: false })
                    .limit(limit);

                if (fallbackError) {
                    return res.status(500).json({
                        success: false,
                        error: fallbackError.message
                    });
                }

                return res.json({
                    success: true,
                    query: query,
                    results: fallbackData,
                    count: fallbackData.length,
                    searchType: 'keyword'
                });
            }

            console.log(`✅ Found ${data.length} semantically similar posts`);

            res.json({
                success: true,
                query: query,
                results: data,
                count: data.length,
                searchType: 'vector'
            });

        } catch (error) {
            console.error('❌ RAG search failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * Get comments for a specific post
     * GET /api/reddit-rag/comments/:postId
     */
    router.get('/comments/:postId', async (req, res) => {
        try {
            const postId = req.params.postId;

            const { data, error } = await supabase.supabase
                .from('reddit_comments')
                .select('*')
                .eq('post_id', postId)
                .order('score', { ascending: false })
                .limit(50);

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            res.json({
                success: true,
                postId: postId,
                comments: data,
                count: data.length
            });

        } catch (error) {
            console.error('❌ Comment fetch failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * Get post by ID with comments
     * GET /api/reddit-rag/post/:postId
     */
    router.get('/post/:postId', async (req, res) => {
        try {
            const postId = req.params.postId;

            // Get post
            const { data: post, error: postError } = await supabase.supabase
                .from('reddit_posts')
                .select('*')
                .eq('reddit_id', postId)
                .single();

            if (postError) {
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }

            // Get comments
            const { data: comments, error: commentsError } = await supabase.supabase
                .from('reddit_comments')
                .select('*')
                .eq('post_id', postId)
                .order('score', { ascending: false });

            res.json({
                success: true,
                post: post,
                comments: comments || [],
                commentCount: comments?.length || 0
            });

        } catch (error) {
            console.error('❌ Post fetch failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * AI-powered answer using Grok
     * POST /api/reddit-rag/ask
     * Body: { question: "what should be my first UW?" }
     */
    router.post('/ask', async (req, res) => {
        try {
            const { question, discord_user_id } = req.body;
            const limit = 3; // Top 3 results for context

            if (!question?.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Question is required'
                });
            }

            console.log(`🤖 AI question: "${question}"`, discord_user_id ? `(user: ${discord_user_id})` : '');

            // 1. Fetch user's lab data AND calculate stats if asking about labs
            let userLabsContext = '';
            if (discord_user_id && question.toLowerCase().includes('lab')) {
                const { data: userLabs, error } = await supabase.supabase
                    .from('user_labs')
                    .select('*')
                    .eq('discord_user_id', discord_user_id)
                    .single();

                if (userLabs && !error && userLabs.labs) {
                    try {
                        // Import calculator modules
                        const { calculateAllStats, calculateLabPriorities } = require('../services/tower-calculator/roi-calculator');
                        const { CARD_MASTERY } = require('../services/tower-calculator/constants');

                        // Extract labs and card mastery
                        const labs = userLabs.labs || {};
                        const cardMastery = {
                            [CARD_MASTERY.DAMAGE]: userLabs.damage_mastery || 0,
                            [CARD_MASTERY.ATTACK_SPEED]: userLabs.attack_speed_mastery || 0,
                            [CARD_MASTERY.CRITICAL_CHANCE]: userLabs.critical_chance_mastery || 0,
                            [CARD_MASTERY.RANGE]: userLabs.range_mastery || 0,
                            [CARD_MASTERY.SUPER_TOWER]: userLabs.super_tower_mastery || 0,
                            [CARD_MASTERY.ULTIMATE_CRIT]: userLabs.ultimate_crit_mastery || 0,
                            [CARD_MASTERY.DEMON_MODE]: userLabs.demon_mode_mastery || 0
                        };

                        // Calculate current stats
                        const stats = calculateAllStats(labs, cardMastery);

                        // Calculate lab priorities for all three categories
                        const damagePriorities = calculateLabPriorities(labs, cardMastery, 'damage');
                        const healthPriorities = calculateLabPriorities(labs, cardMastery, 'health');
                        const econPriorities = calculateLabPriorities(labs, cardMastery, 'economy');

                        // Format context for AI
                        userLabsContext = `\n\n[USER'S CALCULATED STATS]:\n`;
                        userLabsContext += `eDamage (Effective Damage): ${stats.eDamage.toFixed(2)}\n`;
                        userLabsContext += `eHP (Effective Health): ${stats.eHP.toFixed(2)}\n`;
                        userLabsContext += `eEcon (Effective Economy): ${stats.eEcon.toFixed(2)}\n\n`;

                        // DAMAGE RECOMMENDATIONS
                        userLabsContext += `[TOP 5 DAMAGE LAB UPGRADES (eDamage focus)]:\n`;
                        damagePriorities.slice(0, 5).forEach((priority, index) => {
                            userLabsContext += `${index + 1}. ${priority.displayName} (Level ${priority.currentLevel} → ${priority.newLevel}): +${priority.improvementPercent.toFixed(2)}% eDamage, ROI: ${priority.roi.toFixed(2)}/hour\n`;
                        });

                        // HEALTH RECOMMENDATIONS
                        userLabsContext += `\n[TOP 5 HEALTH LAB UPGRADES (eHP focus)]:\n`;
                        healthPriorities.slice(0, 5).forEach((priority, index) => {
                            userLabsContext += `${index + 1}. ${priority.displayName} (Level ${priority.currentLevel} → ${priority.newLevel}): +${priority.improvementPercent.toFixed(2)}% eHP, ROI: ${priority.roi.toFixed(2)}/hour\n`;
                        });

                        // ECONOMY RECOMMENDATIONS
                        userLabsContext += `\n[TOP 5 ECONOMY LAB UPGRADES (eEcon focus)]:\n`;
                        econPriorities.slice(0, 5).forEach((priority, index) => {
                            userLabsContext += `${index + 1}. ${priority.displayName} (Level ${priority.currentLevel} → ${priority.newLevel}): +${priority.improvementPercent.toFixed(2)}% eEcon, ROI: ${priority.roi.toFixed(2)}/hour\n`;
                        });

                        // Add Super Tower context
                        userLabsContext += `\n[IMPORTANT CONTEXT]:\n`;
                        userLabsContext += `- Super Tower Bonus: This lab is HIGHLY efficient (33.8% per level) BUT requires card mastery to be effective.\n`;
                        userLabsContext += `- In late game (Tier 10+), projectile damage becomes negligible. Super Tower primarily boosts Ultimate Weapon (UW) damage.\n`;
                        userLabsContext += `- Card mastery (especially Super Tower mastery) directly affects UW damage multipliers.\n`;
                        userLabsContext += `- Without card mastery, Super Tower has limited impact. Recommend focusing on attack speed/crit/damage labs first.\n`;
                        userLabsContext += `- Current card mastery levels: ${JSON.stringify(cardMastery)}\n`;

                        userLabsContext += `\nUse these calculated values to provide accurate, personalized upgrade recommendations based on the user's focus (damage/health/economy).\n`;

                        console.log(`📊 Including calculated stats: eDMG=${stats.eDamage.toFixed(2)}, eHP=${stats.eHP.toFixed(2)}, eEcon=${stats.eEcon.toFixed(2)}`);
                    } catch (calcError) {
                        console.error('Error calculating stats:', calcError);
                        // Fall back to basic lab levels
                        const labLevels = Object.entries(userLabs.labs)
                            .map(([lab, level]) => `${lab}: ${level}`)
                            .join(', ');
                        userLabsContext = `\n\n[USER'S CURRENT LAB LEVELS]:\n${labLevels}\n\n`;
                    }
                }
            }

            // 2. Generate embedding for the question
            const queryEmbedding = await generateEmbedding(question);

            // 2. Search BOTH Reddit RAG and Game Knowledge Base in parallel
            const [redditResults, gameKnowledgeResults] = await Promise.all([
                // Reddit community content
                supabase.supabase.rpc('search_reddit_rag_semantic', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.2,
                    match_count: 3
                }).then(res => res.data || []).catch(() => []),

                // Official game guides (sheets)
                supabase.supabase.rpc('search_game_knowledge_semantic', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.2,
                    match_count: 3
                }).then(res => res.data || []).catch(() => [])
            ]);

            // Combine results, prioritizing game knowledge for factual questions
            const searchResults = [...gameKnowledgeResults, ...redditResults].slice(0, limit);

            if (!searchResults || searchResults.length === 0) {
                return res.json({
                    success: true,
                    answer: "I couldn't find any relevant information about that. Try asking in a different way!",
                    sources: []
                });
            }

            // 3. Build context from top results
            const context = searchResults.map((result, i) =>
                `[Source ${i + 1} - ${result.title} (${result.score || 0} upvotes, similarity: ${(result.similarity * 100).toFixed(0)}%)]:\n${result.content}`
            ).join('\n\n---\n\n');

            // 4. Call Grok API
            const grokResponse = await fetch(GROK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'grok-3',
                    temperature: 0.7,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a Tower Game expert assistant. Answer questions ONLY based on the provided community sources.

Format your answer EXACTLY like this:

## Quick Answer
[1-2 sentence direct answer to the question]

## Details
[Detailed explanation with bullet points and sections as needed]

## Related Questions
[Exactly 3 follow-up questions, one per line, starting with "-"]

Rules:
- Use ONLY information from the sources provided
- Start with Quick Answer section (brief, direct)
- Then provide Details section (comprehensive)
- End with exactly 3 related questions starting with "-"
- Use bullet points and clear formatting
- Consider upvote counts as quality indicators (higher = more trusted)
- Be conversational and helpful
- If you don't know an abbreviation, DO NOT make it up - ask for clarification instead

IMPORTANT - Common Tower Game Abbreviations:
- UW = Ultimate Weapon (NOT "Ultimate Wave" or anything else)
- SL = Spotlight (NOT "Stone of Life" or anything else)
- DW = Death Wave
- GT = Golden Tower
- BH = Black Hole
- CF = Chrono Field
- STB = Super Tower Bonus (lab)
- GTB = Golden Tower Bonus (lab)
- HW = Health Wave (workshop upgrade)
- AS = Attack Speed
- crit = Critical hit/chance
- regen = Regeneration
- AoE = Area of Effect
- DPS = Damage Per Second

IMPORTANT - Lab Tables:
- When you see lab tables with "Level | Duration | Cost | Gems", the Duration column shows CUMULATIVE TIME from level 1 to that level
- Example: "Level 90 | 14d 0h 39m" means it takes 14 days total to go from level 1 to level 90, NOT 14 days per level
- To calculate time between levels, subtract: Time(Level N) - Time(Level N-1)
- Never assume Duration is "time per level" - it's always cumulative total time`
                        },
                        {
                            role: 'user',
                            content: `Question: ${question}${userLabsContext}\n\nCommunity Sources:\n${context}\n\nProvide a helpful answer based on these sources${userLabsContext ? ' AND the user\'s current lab levels' : ''}.`
                        }
                    ]
                })
            });

            if (!grokResponse.ok) {
                const errorText = await grokResponse.text();
                throw new Error(`Grok API error: ${errorText}`);
            }

            const grokData = await grokResponse.json();
            const answer = grokData.choices[0]?.message?.content || 'No response generated';

            console.log(`✅ AI answer generated (${grokData.usage?.total_tokens} tokens)`);

            res.json({
                success: true,
                answer: answer,
                sources: searchResults.map(r => ({
                    title: r.title,
                    url: r.url,
                    score: r.score
                })),
                usage: grokData.usage
            });

        } catch (error) {
            console.error('❌ AI answer failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * Generate embeddings for all content in database
     * POST /api/reddit-rag/generate-embeddings
     */
    router.post('/generate-embeddings', async (req, res) => {
        try {
            console.log('📊 Starting batch embedding generation...');

            // Get all content without embeddings
            const { data: content, error: fetchError } = await supabase.supabase
                .from('reddit_rag_content')
                .select('id, title, content')
                .is('embedding', null);

            if (fetchError) {
                throw new Error(`Failed to fetch content: ${fetchError.message}`);
            }

            console.log(`📝 Found ${content.length} items needing embeddings`);

            let processed = 0;
            let failed = 0;

            // Process in batches of 10 to avoid rate limits
            const batchSize = 10;
            for (let i = 0; i < content.length; i += batchSize) {
                const batch = content.slice(i, i + batchSize);

                for (const item of batch) {
                    try {
                        // Generate embedding
                        const combined = `${item.title}\n\n${item.content}`;
                        const embedding = await generateEmbedding(combined);

                        // Update database
                        const { error: updateError } = await supabase.supabase
                            .from('reddit_rag_content')
                            .update({ embedding })
                            .eq('id', item.id);

                        if (updateError) {
                            console.error(`❌ Failed to update ${item.id}:`, updateError.message);
                            failed++;
                        } else {
                            processed++;
                            console.log(`✅ Processed ${processed}/${content.length}: ${item.title.substring(0, 50)}...`);
                        }

                    } catch (error) {
                        console.error(`❌ Failed to generate embedding for ${item.id}:`, error.message);
                        failed++;
                    }
                }

                // Small delay between batches to respect rate limits
                if (i + batchSize < content.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            console.log(`✅ Embedding generation complete: ${processed} processed, ${failed} failed`);

            res.json({
                success: true,
                processed,
                failed,
                total: content.length
            });

        } catch (error) {
            console.error('❌ Embedding generation failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * Get RAG stats
     * GET /api/reddit-rag/stats
     */
    router.get('/stats', async (req, res) => {
        try {
            const { count: postsCount } = await supabase.supabase
                .from('reddit_posts')
                .select('*', { count: 'exact', head: true });

            const { count: ragCount } = await supabase.supabase
                .from('reddit_rag_content')
                .select('*', { count: 'exact', head: true });

            const { count: commentsCount } = await supabase.supabase
                .from('reddit_comments')
                .select('*', { count: 'exact', head: true });

            res.json({
                success: true,
                stats: {
                    totalPosts: postsCount || 0,
                    ragIndexed: ragCount || 0,
                    totalComments: commentsCount || 0
                }
            });

        } catch (error) {
            console.error('❌ Stats fetch failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * Ask about user's run data
     * POST /api/reddit-rag/ask-runs
     * Body: { question: "which mob kills me the most?", discordUserId: "123..." }
     */
    router.post('/ask-runs', async (req, res) => {
        try {
            const { question, discordUserId } = req.body;

            if (!question?.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Question is required'
                });
            }

            if (!discordUserId) {
                return res.status(400).json({
                    success: false,
                    error: 'Discord user ID is required'
                });
            }

            console.log(`🤖 Run analytics question from ${discordUserId}: "${question}"`);

            // Fetch user's run data (last 90 days)
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const { data: runs, error } = await supabase.supabase
                .from('tower_runs')
                .select('*')
                .eq('discord_user_id', discordUserId)
                .gte('submitted_at', ninetyDaysAgo.toISOString())
                .order('submitted_at', { ascending: false })
                .limit(500); // Last 500 runs max

            if (error) {
                throw new Error(`Failed to fetch runs: ${error.message}`);
            }

            if (!runs || runs.length === 0) {
                return res.json({
                    success: true,
                    answer: "I couldn't find any run data for your account in the last 90 days. Start submitting runs to get personalized analytics!",
                    stats: {}
                });
            }

            // Calculate analytics from runs
            const analytics = calculateRunAnalytics(runs);

            // Build context for AI
            const context = `
User Run Statistics (Last ${runs.length} runs, past 90 days):

GENERAL STATS:
- Total Runs: ${analytics.totalRuns}
- Date Range: ${new Date(analytics.firstRun).toLocaleDateString()} to ${new Date(analytics.lastRun).toLocaleDateString()}
- Max Tier: ${analytics.maxTier}, Max Wave: ${analytics.maxWave}
- Average Tier: ${analytics.avgTier.toFixed(1)}, Average Wave: ${analytics.avgWave.toFixed(1)}
- Total Coins Earned: ${analytics.totalCoins}
- Average Coins per Run: ${analytics.avgCoins}

DEATH ANALYSIS:
${analytics.deathsByMob.slice(0, 10).map((d, i) => `${i + 1}. ${d.mob}: ${d.count} deaths (${d.percentage}%)`).join('\n')}

TIME ANALYSIS:
- Last 7 Days: ${analytics.runsLast7Days} runs, ${analytics.coinsLast7Days} coins
- Last 30 Days: ${analytics.runsLast30Days} runs, ${analytics.coinsLast30Days} coins
- Best Hourly Income: ${analytics.bestHourly} coins/hour (Tier ${analytics.bestHourlyTier})
- Average Hourly Income: ${analytics.avgHourly} coins/hour

DAMAGE BREAKDOWN (Top Sources):
${analytics.damageBreakdown.slice(0, 5).map((d, i) => `${i + 1}. ${d.source}: ${d.total}`).join('\n')}

RECENT PERFORMANCE (Last 10 runs):
${analytics.recentRuns.map((r, i) => `${i + 1}. T${r.tier}W${r.wave} - ${r.coins} coins - Killed by ${r.killedBy || 'Unknown'}`).join('\n')}
`;

            // Call Grok API
            const grokResponse = await fetch(GROK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'grok-3',
                    temperature: 0.5,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a Tower Game analytics assistant. Answer questions about the user's run data using the statistics provided.

Format your answer conversationally and helpfully. Use specific numbers and insights from the data. Be concise but informative.

If the question is about:
- Deaths/killed by: Use the DEATH ANALYSIS section
- Coins/earnings: Use GENERAL STATS and TIME ANALYSIS
- Time periods (last 7 days, etc): Use TIME ANALYSIS
- Performance: Use RECENT PERFORMANCE and GENERAL STATS
- Damage: Use DAMAGE BREAKDOWN

Always include relevant numbers and percentages. Make it personal and actionable.`
                        },
                        {
                            role: 'user',
                            content: `Question: ${question}\n\nUser's Run Data:\n${context}\n\nAnswer the question based on this data.`
                        }
                    ]
                })
            });

            if (!grokResponse.ok) {
                const errorText = await grokResponse.text();
                throw new Error(`Grok API error: ${errorText}`);
            }

            const grokData = await grokResponse.json();
            const answer = grokData.choices[0]?.message?.content || 'No response generated';

            console.log(`✅ Run analytics answer generated (${grokData.usage?.total_tokens} tokens)`);

            res.json({
                success: true,
                answer: answer,
                stats: {
                    runsAnalyzed: runs.length,
                    dateRange: `${new Date(analytics.firstRun).toLocaleDateString()} - ${new Date(analytics.lastRun).toLocaleDateString()}`,
                    topKiller: analytics.deathsByMob[0]?.mob || 'Unknown'
                },
                usage: grokData.usage
            });

        } catch (error) {
            console.error('❌ Run analytics failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    return router;
}

/**
 * Helper function to calculate analytics from runs
 */
function calculateRunAnalytics(runs) {
    const parseValue = (val) => {
        if (!val) return 0;
        const str = String(val);
        const suffixes = { 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'q': 1e15, 'Q': 1e18 };
        const match = str.match(/^([\d,\.]+)([A-Za-z]?)$/);
        if (!match) return parseFloat(str) || 0;
        const num = parseFloat(match[1].replace(/,/g, ''));
        return num * (suffixes[match[2]] || 1);
    };

    const formatValue = (val) => {
        if (val >= 1e15) return (val / 1e15).toFixed(2) + 'q';
        if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T';
        if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
        if (val >= 1e3) return (val / 1e3).toFixed(2) + 'K';
        return val.toFixed(0);
    };

    // Death analysis
    const deathsByMob = {};
    runs.forEach(run => {
        const mob = run.killed_by || 'Unknown';
        deathsByMob[mob] = (deathsByMob[mob] || 0) + 1;
    });
    const deathsArray = Object.entries(deathsByMob)
        .map(([mob, count]) => ({
            mob,
            count,
            percentage: ((count / runs.length) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count);

    // Time-based analysis
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const runsLast7Days = runs.filter(r => new Date(r.submitted_at) >= sevenDaysAgo).length;
    const runsLast30Days = runs.filter(r => new Date(r.submitted_at) >= thirtyDaysAgo).length;
    const coinsLast7Days = formatValue(runs.filter(r => new Date(r.submitted_at) >= sevenDaysAgo)
        .reduce((sum, r) => sum + parseValue(r.coins_earned), 0));
    const coinsLast30Days = formatValue(runs.filter(r => new Date(r.submitted_at) >= thirtyDaysAgo)
        .reduce((sum, r) => sum + parseValue(r.coins_earned), 0));

    // Hourly calculations
    const runsWithHourly = runs.map(r => ({
        ...r,
        hourly: parseValue(r.run_duration) > 0 ? parseValue(r.coins_earned) / (parseValue(r.run_duration) / 3600) : 0
    }));
    const bestHourlyRun = runsWithHourly.reduce((best, r) => r.hourly > best.hourly ? r : best, runsWithHourly[0]);

    // Damage breakdown
    const damageTypes = ['projectiles_damage', 'orb_damage', 'death_wave_damage', 'black_hole_damage',
                         'chain_lightning_damage', 'land_mine_damage', 'smart_missile_damage', 'thorn_damage'];
    const damageBreakdown = damageTypes.map(type => ({
        source: type.replace('_damage', '').replace(/_/g, ' '),
        total: formatValue(runs.reduce((sum, r) => sum + parseValue(r[type]), 0))
    })).sort((a, b) => parseValue(b.total) - parseValue(a.total));

    return {
        totalRuns: runs.length,
        maxTier: Math.max(...runs.map(r => parseInt(r.tier) || 0)),
        maxWave: Math.max(...runs.map(r => parseInt(r.wave) || 0)),
        avgTier: runs.reduce((sum, r) => sum + (parseInt(r.tier) || 0), 0) / runs.length,
        avgWave: runs.reduce((sum, r) => sum + (parseInt(r.wave) || 0), 0) / runs.length,
        totalCoins: formatValue(runs.reduce((sum, r) => sum + parseValue(r.coins_earned), 0)),
        avgCoins: formatValue(runs.reduce((sum, r) => sum + parseValue(r.coins_earned), 0) / runs.length),
        deathsByMob: deathsArray,
        firstRun: runs[runs.length - 1]?.submitted_at || new Date().toISOString(),
        lastRun: runs[0]?.submitted_at || new Date().toISOString(),
        runsLast7Days,
        runsLast30Days,
        coinsLast7Days,
        coinsLast30Days,
        bestHourly: formatValue(bestHourlyRun?.hourly || 0),
        bestHourlyTier: bestHourlyRun?.tier || 'N/A',
        avgHourly: formatValue(runsWithHourly.reduce((sum, r) => sum + r.hourly, 0) / runsWithHourly.length),
        damageBreakdown,
        recentRuns: runs.slice(0, 10).map(r => ({
            tier: r.tier,
            wave: r.wave,
            coins: formatValue(parseValue(r.coins_earned)),
            killedBy: r.killed_by
        }))
    };
}

module.exports = createRedditRAGRouter;
