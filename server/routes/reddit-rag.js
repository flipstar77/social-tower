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
            const { question } = req.body;
            const limit = 3; // Top 3 results for context

            if (!question?.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Question is required'
                });
            }

            console.log(`🤖 AI question: "${question}"`);

            // 1. Search RAG for relevant content
            const { data: searchResults, error: searchError } = await supabase.supabase
                .from('reddit_rag_content')
                .select('*')
                .textSearch('content', question, {
                    type: 'websearch',
                    config: 'english'
                })
                .order('score', { ascending: false })
                .limit(limit);

            if (searchError) {
                throw new Error(`RAG search failed: ${searchError.message}`);
            }

            if (!searchResults || searchResults.length === 0) {
                return res.json({
                    success: true,
                    answer: "I couldn't find any relevant information about that. Try asking in a different way!",
                    sources: []
                });
            }

            // 2. Build context from top results
            const context = searchResults.map((result, i) =>
                `[Source ${i + 1} - ${result.title} (${result.score} upvotes)]:\n${result.content}`
            ).join('\n\n---\n\n');

            // 3. Call Grok API
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
- Be conversational and helpful`
                        },
                        {
                            role: 'user',
                            content: `Question: ${question}\n\nCommunity Sources:\n${context}\n\nProvide a helpful answer based ONLY on these sources.`
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

    return router;
}

module.exports = createRedditRAGRouter;
