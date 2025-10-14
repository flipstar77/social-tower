-- Game Knowledge Base Table for RAG (Vector Search)
-- Stores processed sheet documentation with embeddings for semantic search

CREATE TABLE IF NOT EXISTS game_knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    doc_type TEXT NOT NULL,  -- 'labs_guide', 'calculator_guide', 'modules_guide'
    doc_title TEXT NOT NULL,  -- Document title
    section_title TEXT NOT NULL,  -- Section/chunk title
    content TEXT NOT NULL,  -- Full content of the chunk
    embedding vector(1536),  -- OpenAI text-embedding-3-small dimensions
    chunk_index INTEGER NOT NULL,  -- Position in document
    total_chunks INTEGER NOT NULL,  -- Total chunks in document
    indexed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint to prevent duplicates
    UNIQUE(doc_type, doc_title, chunk_index)
);

-- Index for fast lookups by document type
CREATE INDEX IF NOT EXISTS idx_game_knowledge_doc_type ON game_knowledge_base(doc_type);

-- Index for fast lookups by document title
CREATE INDEX IF NOT EXISTS idx_game_knowledge_doc_title ON game_knowledge_base(doc_title);

-- Vector similarity search index (cosine distance)
CREATE INDEX IF NOT EXISTS idx_game_knowledge_embedding ON game_knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Full text search index for title matching
CREATE INDEX IF NOT EXISTS idx_game_knowledge_section_title_fts ON game_knowledge_base
USING gin(to_tsvector('english', section_title));

-- Full text search index for content
CREATE INDEX IF NOT EXISTS idx_game_knowledge_content_fts ON game_knowledge_base
USING gin(to_tsvector('english', content));

-- Comments for documentation
COMMENT ON TABLE game_knowledge_base IS 'Vector database for game knowledge (labs, calculator, modules guides)';
COMMENT ON COLUMN game_knowledge_base.doc_type IS 'Type of document: labs_guide, calculator_guide, modules_guide';
COMMENT ON COLUMN game_knowledge_base.embedding IS 'Vector embedding for semantic search (1536 dimensions from OpenAI)';
COMMENT ON COLUMN game_knowledge_base.chunk_index IS 'Position of this chunk in the original document';
