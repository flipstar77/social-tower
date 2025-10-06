-- Reddit Posts Table
CREATE TABLE IF NOT EXISTS reddit_posts (
    id SERIAL PRIMARY KEY,
    reddit_id VARCHAR(20) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author VARCHAR(100),
    subreddit VARCHAR(50) NOT NULL,
    body TEXT,
    flair VARCHAR(50),
    url TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    num_comments INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    scraped_at TIMESTAMP DEFAULT NOW(),
    thumbnail_url TEXT,
    is_video BOOLEAN DEFAULT FALSE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reddit_posts_created_at ON reddit_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_score ON reddit_posts(score DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_flair ON reddit_posts(flair);

-- Reddit RAG Content Table (for vectorization and semantic search)
CREATE TABLE IF NOT EXISTS reddit_rag_content (
    id SERIAL PRIMARY KEY,
    reddit_id VARCHAR(20) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    flair VARCHAR(50),
    score INTEGER DEFAULT 0,
    url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    indexed_at TIMESTAMP DEFAULT NOW()
);

-- Full-text search index for RAG content
CREATE INDEX IF NOT EXISTS idx_reddit_rag_content_search
    ON reddit_rag_content USING GIN (to_tsvector('english', content));

-- Index for filtering high-quality content
CREATE INDEX IF NOT EXISTS idx_reddit_rag_content_score ON reddit_rag_content(score DESC);

-- Reddit Comments Table
CREATE TABLE IF NOT EXISTS reddit_comments (
    id SERIAL PRIMARY KEY,
    comment_id VARCHAR(20) UNIQUE NOT NULL,
    post_id VARCHAR(20) NOT NULL,
    parent_id VARCHAR(20),
    author VARCHAR(100),
    body TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    scraped_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (post_id) REFERENCES reddit_posts(reddit_id) ON DELETE CASCADE
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_reddit_comments_post_id ON reddit_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reddit_comments_score ON reddit_comments(score DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_comments_created_at ON reddit_comments(created_at DESC);

COMMENT ON TABLE reddit_posts IS 'Stores scraped Reddit posts from r/TheTowerGame';
COMMENT ON TABLE reddit_rag_content IS 'High-quality Reddit content indexed for RAG/semantic search';
COMMENT ON TABLE reddit_comments IS 'Stores comments from Reddit posts with upvote scores';
