/**
 * Guides API - Manage custom game guides for RAG
 */

const express = require('express');

function createGuidesRouter(supabase) {
    const router = express.Router();

    /**
     * Add a guide to the RAG system
     * POST /api/guides
     * Body: { title, content, author, source_url, tags }
     */
    router.post('/', async (req, res) => {
        try {
            const { title, content, author, source_url, tags } = req.body;

            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    error: 'Title and content are required'
                });
            }

            // Generate a simple ID from title
            const guideId = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            // Store in reddit_rag_content table (or create a separate guides table)
            const { data, error } = await supabase.supabase
                .from('reddit_rag_content')
                .upsert({
                    reddit_id: `guide_${guideId}`,
                    content: `${title}\n\n${content}`,
                    title: title,
                    flair: 'Guide',
                    score: 1000, // High score for guides
                    url: source_url || null,
                    created_at: new Date(),
                    indexed_at: new Date()
                }, { onConflict: 'reddit_id' });

            if (error) {
                console.error('❌ Error adding guide:', error.message);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            console.log(`✅ Added guide: ${title}`);

            res.json({
                success: true,
                guide_id: guideId,
                message: 'Guide added successfully'
            });

        } catch (error) {
            console.error('❌ Guide creation failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * Get all guides
     * GET /api/guides
     */
    router.get('/', async (req, res) => {
        try {
            const { data, error } = await supabase.supabase
                .from('reddit_rag_content')
                .select('*')
                .like('reddit_id', 'guide_%')
                .order('score', { ascending: false });

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            res.json({
                success: true,
                guides: data,
                count: data.length
            });

        } catch (error) {
            console.error('❌ Guide fetch failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * Delete a guide
     * DELETE /api/guides/:guideId
     */
    router.delete('/:guideId', async (req, res) => {
        try {
            const guideId = req.params.guideId;

            const { error } = await supabase.supabase
                .from('reddit_rag_content')
                .delete()
                .eq('reddit_id', `guide_${guideId}`);

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            res.json({
                success: true,
                message: 'Guide deleted successfully'
            });

        } catch (error) {
            console.error('❌ Guide deletion failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    return router;
}

module.exports = createGuidesRouter;
