const express = require('express');
const router = express.Router();

// Create and export a function that returns the router with dependencies
function createWikiRouter(wikiScraper, wikiInitialized) {

    // Wiki Search API Endpoints
    router.get('/search', (req, res) => {
        if (!wikiInitialized()) {
            return res.status(503).json({
                success: false,
                error: 'Wiki search not initialized yet. Please wait a moment and try again.'
            });
        }

        const {
            q: query,
            limit = 10,
            categories,      // Comma-separated categories
            contentType,     // 'content', 'table', 'infobox', 'all'
            minScore,        // Minimum relevance score
            sortBy           // 'relevance', 'title', 'length'
        } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required and must be at least 2 characters'
            });
        }

        try {
            // Parse search options
            const searchOptions = {
                limit: parseInt(limit) || 10
            };

            if (categories) {
                searchOptions.categories = categories.split(',').map(c => c.trim());
            }

            if (contentType && contentType !== 'all') {
                searchOptions.contentType = contentType;
            }

            if (minScore) {
                searchOptions.minScore = parseInt(minScore) || 0;
            }

            if (sortBy) {
                searchOptions.sortBy = sortBy;
            }

            const results = wikiScraper.search(query.trim(), searchOptions);

            res.json({
                success: true,
                query: query.trim(),
                options: searchOptions,
                totalResults: results.length,
                results: results.map(result => ({
                    id: result.id,
                    title: result.pageTitle,
                    url: result.pageUrl,
                    preview: result.preview,
                    score: result.relevanceScore,
                    type: result.type,
                    categories: result.categories,
                    wordCount: result.wordCount || result.content.split(/\s+/).length
                }))
            });
        } catch (error) {
            console.error('Wiki search error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during search'
            });
        }
    });

    router.get('/status', (req, res) => {
        res.json({
            success: true,
            initialized: wikiInitialized(),
            chunksAvailable: wikiScraper.searchableChunks ? wikiScraper.searchableChunks.length : 0,
            lastUpdate: new Date().toISOString()
        });
    });

    // Get available categories for filtering
    router.get('/categories', (req, res) => {
        if (!wikiInitialized()) {
            return res.status(503).json({
                success: false,
                error: 'Wiki search not initialized yet'
            });
        }

        try {
            const categories = wikiScraper.getAvailableCategories();

            res.json({
                success: true,
                categories: categories,
                totalCategories: categories.length
            });
        } catch (error) {
            console.error('Error getting categories:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get categories'
            });
        }
    });

    // Get content statistics
    router.get('/stats', (req, res) => {
        if (!wikiInitialized()) {
            return res.status(503).json({
                success: false,
                error: 'Wiki search not initialized yet'
            });
        }

        try {
            const stats = wikiScraper.getContentStats();

            res.json({
                success: true,
                ...stats
            });
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get statistics'
            });
        }
    });

    // Semantic search endpoint
    router.get('/semantic-search', (req, res) => {
        if (!wikiInitialized()) {
            return res.status(503).json({
                success: false,
                error: 'Wiki search not initialized yet'
            });
        }

        const {
            q: query,
            limit = 10,
            minSimilarity = 0.1,
            searchType = 'hybrid'  // 'semantic', 'hybrid'
        } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required and must be at least 2 characters'
            });
        }

        try {
            let results = [];

            if (searchType === 'semantic') {
                results = wikiScraper.semanticSearch(query.trim(), {
                    limit: parseInt(limit),
                    minSimilarity: parseFloat(minSimilarity)
                });
            } else if (searchType === 'hybrid') {
                results = wikiScraper.hybridSearch(query.trim(), {
                    limit: parseInt(limit)
                });
            }

            res.json({
                success: true,
                query: query.trim(),
                searchType: searchType,
                totalResults: results.length,
                results: results.map(result => ({
                    id: result.id,
                    title: result.pageTitle,
                    url: result.pageUrl,
                    preview: result.preview,
                    keywordScore: result.keywordScore || result.relevanceScore || 0,
                    semanticScore: result.semanticScore || 0,
                    hybridScore: result.hybridScore || result.semanticScore || result.relevanceScore || 0,
                    type: result.type,
                    categories: result.categories,
                    wordCount: result.wordCount || result.content.split(/\s+/).length
                }))
            });
        } catch (error) {
            console.error('Semantic search error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during semantic search'
            });
        }
    });

    // Contextual suggestions based on user stats
    router.post('/suggestions', (req, res) => {
        if (!wikiInitialized()) {
            return res.status(503).json({
                success: false,
                error: 'Wiki search not initialized yet'
            });
        }

        try {
            const { userStats, limit = 5 } = req.body;

            if (!userStats) {
                return res.status(400).json({
                    success: false,
                    error: 'User stats are required for contextual suggestions'
                });
            }

            const suggestions = generateContextualSuggestions(userStats, limit);

            res.json({
                success: true,
                suggestions: suggestions,
                totalSuggestions: suggestions.length,
                userContext: {
                    tier: userStats.tier || 0,
                    wave: userStats.wave || 0,
                    analyzedStats: Object.keys(userStats).length
                }
            });
        } catch (error) {
            console.error('Suggestions error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error generating suggestions'
            });
        }
    });

    router.post('/refresh', async (req, res) => {
        try {
            console.log('🔄 Refreshing wiki data...');

            // Check if we have a setInitialized function passed from server.js
            const setInitialized = req.app.get('setWikiInitialized');
            if (setInitialized) {
                setInitialized(false);
            }

            await wikiScraper.run();

            if (setInitialized) {
                setInitialized(true);
            }

            res.json({
                success: true,
                message: 'Wiki data refreshed successfully',
                chunksAvailable: wikiScraper.searchableChunks ? wikiScraper.searchableChunks.length : 0
            });
        } catch (error) {
            console.error('Wiki refresh error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to refresh wiki data'
            });
        }
    });

    return router;
}

// Generate contextual suggestions based on user stats
function generateContextualSuggestions(userStats, limit) {
    const suggestions = [];
    const tier = userStats.tier || 0;
    const wave = userStats.wave || 0;

    // Tier-based suggestions
    if (tier <= 5) {
        suggestions.push({
            type: 'progression',
            priority: 'high',
            title: 'Beginner Guide',
            reason: `At tier ${tier}, focus on fundamental mechanics`,
            query: 'beginner guide',
            category: 'Guides'
        });

        suggestions.push({
            type: 'upgrade',
            priority: 'high',
            title: 'Workshop Upgrades',
            reason: 'Essential permanent upgrades for early game',
            query: 'workshop upgrades',
            category: 'Workshop'
        });
    } else if (tier <= 10) {
        suggestions.push({
            type: 'progression',
            priority: 'high',
            title: 'Card System',
            reason: 'Cards become crucial for mid-tier progression',
            query: 'cards',
            category: 'Card'
        });

        suggestions.push({
            type: 'upgrade',
            priority: 'medium',
            title: 'Lab Research',
            reason: 'Labs unlock around tier 5-10 for specialized upgrades',
            query: 'lab research',
            category: 'Lab'
        });
    } else if (tier <= 15) {
        suggestions.push({
            type: 'strategy',
            priority: 'high',
            title: 'Ultimate Weapons',
            reason: 'High-tier players should focus on ultimate weapon optimization',
            query: 'ultimate weapons',
            category: 'Workshop'
        });

        suggestions.push({
            type: 'optimization',
            priority: 'medium',
            title: 'Advanced Lab Research',
            reason: 'Advanced labs crucial for higher tier performance',
            query: 'lab upgrades damage',
            category: 'Lab'
        });
    } else {
        suggestions.push({
            type: 'endgame',
            priority: 'high',
            title: 'Elite Enemy Strategies',
            reason: 'Elite enemies become major factor at tier 15+',
            query: 'elite enemies',
            category: 'Guides'
        });

        suggestions.push({
            type: 'optimization',
            priority: 'high',
            title: 'Damage Optimization',
            reason: 'Damage scaling becomes critical at high tiers',
            query: 'damage per meter',
            category: 'Workshop'
        });
    }

    // Performance-based suggestions
    if (userStats.damage_dealt && userStats.damage_taken) {
        const damageRatio = parseFloat(userStats.damage_dealt) / parseFloat(userStats.damage_taken);

        if (damageRatio < 100) {
            suggestions.push({
                type: 'improvement',
                priority: 'high',
                title: 'Defense Optimization',
                reason: 'Your damage-to-damage-taken ratio suggests defense improvements needed',
                query: 'defense upgrades',
                category: 'Workshop'
            });
        } else if (damageRatio > 10000) {
            suggestions.push({
                type: 'optimization',
                priority: 'medium',
                title: 'Attack Efficiency',
                reason: 'Strong defense achieved - focus on attack optimization',
                query: 'attack upgrades',
                category: 'Workshop'
            });
        }
    }

    // Resource-based suggestions
    if (userStats.coins_earned) {
        const coins = parseFloat(userStats.coins_earned) || 0;
        if (coins < 1000000) { // Less than 1M coins
            suggestions.push({
                type: 'resource',
                priority: 'medium',
                title: 'Coin Generation Guide',
                reason: 'Improve coin generation for faster progression',
                query: 'coins per wave',
                category: 'Workshop'
            });
        }
    }

    // Bot-related suggestions
    if (userStats.golden_bot_coins_earned || userStats.flame_bot_damage) {
        suggestions.push({
            type: 'optimization',
            priority: 'medium',
            title: 'Bot Optimization',
            reason: 'You\'re using bots - optimize their effectiveness',
            query: 'bot research',
            category: 'Lab'
        });
    }

    // Module suggestions based on shards
    if (userStats.cannon_shards || userStats.armor_shards || userStats.generator_shards || userStats.core_shards) {
        suggestions.push({
            type: 'equipment',
            priority: 'medium',
            title: 'Module Optimization',
            reason: 'You\'re collecting module shards - learn module strategies',
            query: 'modules',
            category: 'Workshop'
        });
    }

    // Sort by priority and limit results
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return suggestions
        .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
        .slice(0, limit);
}

module.exports = createWikiRouter;