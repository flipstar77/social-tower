-- Create semantic search function for game knowledge base
-- Similar to search_reddit_rag_semantic but for official game guides

CREATE OR REPLACE FUNCTION search_game_knowledge_semantic(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.2,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id bigint,
    doc_type text,
    doc_title text,
    section_title text,
    content text,
    title text,  -- Alias for compatibility with reddit_rag format
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        game_knowledge_base.id,
        game_knowledge_base.doc_type,
        game_knowledge_base.doc_title,
        game_knowledge_base.section_title,
        game_knowledge_base.content,
        game_knowledge_base.section_title as title,  -- Use section_title as title
        1 - (game_knowledge_base.embedding <=> query_embedding) as similarity
    FROM game_knowledge_base
    WHERE 1 - (game_knowledge_base.embedding <=> query_embedding) > match_threshold
    ORDER BY game_knowledge_base.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_game_knowledge_semantic TO authenticated;
GRANT EXECUTE ON FUNCTION search_game_knowledge_semantic TO anon;
GRANT EXECUTE ON FUNCTION search_game_knowledge_semantic TO service_role;

COMMENT ON FUNCTION search_game_knowledge_semantic IS 'Semantic vector search for game knowledge base (labs, calculator, modules guides)';
