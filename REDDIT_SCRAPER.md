# Reddit Scraper & RAG System

Automated Reddit scraping system for r/TheTowerGame with intelligent content indexing for RAG (Retrieval-Augmented Generation).

## Features

### 🤖 Automated Scraping
- **Schedule**: Runs twice daily at 8 AM and 8 PM
- **Volume**: Scrapes 50 posts per run to balance coverage vs API costs
- **Caching**: 30-minute cache on API endpoint to reduce duplicate requests
- **Comments**: Fetches top 10 comments for context

### 📊 Data Storage
All scraped data is stored in Supabase:

**`reddit_posts` table:**
- Full post content (title, body, author, flair)
- Engagement metrics (score, num_comments)
- Media (thumbnail URLs, video flags)
- Timestamps (created_at, scraped_at)

**`reddit_rag_content` table:**
- High-quality posts indexed for semantic search
- Full-text search enabled with PostgreSQL GIN index
- Filtered by engagement (>10 upvotes OR >5 comments)
- Prioritizes Guide, Strategy, and Discussion flairs

### 🔍 RAG Vectorization

The system automatically identifies and indexes valuable content:

**Selection Criteria:**
- Posts with >10 upvotes
- Posts with >5 comments
- Guide, Strategy, or Discussion flairs
- Limits to 10 best posts per scrape run

**Content Format:**
```
Title: [Post Title]

Body: [Post Content]

Flair: [Post Flair]
```

### 💰 Cost Optimization

- **Scheduled runs only**: 2x per day instead of on-demand
- **Caching**: 30-minute cache prevents duplicate API calls
- **Limited vectorization**: Only top 10 posts per run
- **Apify pay-per-event**: ~$0.02 per scrape run

**Estimated monthly cost**: ~$1.20 (60 runs × $0.02)

## API Endpoints

### Get Posts (Cached)
```bash
GET /api/reddit?subreddit=TheTowerGame&limit=25
```

Returns cached posts with 30-minute freshness.

### Scraper Status
```bash
GET /api/reddit/scraper/status
```

Response:
```json
{
  "isRunning": false,
  "lastScrapeTime": "2025-10-06T08:00:00.000Z",
  "nextScheduledRun": "Next at 8 AM or 8 PM"
}
```

### Manual Trigger
```bash
POST /api/reddit/scraper/trigger
```

Manually triggers a scrape (useful for testing or urgent updates).

## Database Schema

### reddit_posts
```sql
CREATE TABLE reddit_posts (
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
```

### reddit_rag_content
```sql
CREATE TABLE reddit_rag_content (
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
```

## Setup

1. **Add Apify API key to `.env`:**
```env
APIFY_API_KEY=your_apify_key_here
```

2. **Run database migrations:**
```bash
# Execute server/migrations/003_reddit_tables.sql in Supabase SQL editor
```

3. **Start server:**
```bash
npm run dev
```

The scraper will automatically start and schedule runs.

## Future Enhancements

- [ ] Add vector embeddings using OpenAI or local models
- [ ] Implement semantic search endpoint for RAG
- [ ] Add comment threading for deeper context
- [ ] Create dashboard for viewing scraped content
- [ ] Add sentiment analysis on posts
- [ ] Export to LangChain/LlamaIndex format

## Monitoring

Check scraper status in server logs:
```
✅ Reddit scraper scheduled (runs at 8 AM and 8 PM daily)
📡 Starting Reddit scrape for r/TheTowerGame...
✅ Fetched 50 posts from Reddit
✅ Stored 50 posts in database
🔍 Found 15 high-quality posts to vectorize
✅ Reddit scrape completed successfully
```

## Troubleshooting

**No posts appearing:**
- Check Apify API key is set correctly
- Verify Supabase tables exist (run migration)
- Check server logs for error messages

**Scraper not running:**
- Verify cron schedule: `0 8,20 * * *` (8 AM and 8 PM)
- Check server is running continuously (not just on-demand)
- Manually trigger: `POST /api/reddit/scraper/trigger`

**High API costs:**
- Scraper runs only 2x daily by design
- Cache duration is 30 minutes
- Reduce `maxItems` if needed (currently 50)
