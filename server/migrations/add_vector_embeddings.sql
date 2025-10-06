-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to reddit_rag_content table
-- OpenAI text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE reddit_rag_content
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS reddit_rag_content_embedding_idx
ON reddit_rag_content
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to search by semantic similarity
CREATE OR REPLACE FUNCTION search_reddit_rag_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  reddit_id text,
  title text,
  content text,
  flair text,
  score int,
  url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    reddit_rag_content.id,
    reddit_rag_content.reddit_id,
    reddit_rag_content.title,
    reddit_rag_content.content,
    reddit_rag_content.flair,
    reddit_rag_content.score,
    reddit_rag_content.url,
    1 - (reddit_rag_content.embedding <=> query_embedding) AS similarity
  FROM reddit_rag_content
  WHERE reddit_rag_content.embedding IS NOT NULL
    AND 1 - (reddit_rag_content.embedding <=> query_embedding) > match_threshold
  ORDER BY reddit_rag_content.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
