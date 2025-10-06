/**
 * Reddit RAG API - Semantic search endpoint for chatbot
 */

const express = require('express');
const router = express.Router();

// RAG search endpoint
function createRedditRAGRouter(supabase) {
    /**
     * Search Reddit RAG content
     * GET /api/reddit-rag/search?q=tower+defense+strategy&limit=5
     */
    router.get('/search', async (req, res) => {
        try {
            const query = req.query.q || '';
            const limit = Math.min(parseInt(req.query.limit) || 5, 20);

            if (!query.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Query parameter "q" is required'
                });
            }

            console.log(`🔍 RAG search query: "${query}" (limit: ${limit})`);

            // Use PostgreSQL full-text search
            const { data, error } = await supabase.supabase
                .from('reddit_rag_content')
                .select('*')
                .textSearch('content', query, {
                    type: 'websearch',
                    config: 'english'
                })
                .order('score', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ RAG search error:', error.message);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            console.log(`✅ Found ${data.length} relevant posts`);

            res.json({
                success: true,
                query: query,
                results: data,
                count: data.length
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

    return router;
}

module.exports = createRedditRAGRouter;
