# Tower Wiki Scraping & Vectorization Implementation Plan

## 📊 Scope Analysis

**Target:** https://the-tower-idle-tower-defense.fandom.com/wiki/
- **Total Pages:** 483 pages
- **Content Types:** Gameplay guides, upgrade tables, mechanics explanations, strategies
- **Data Structure:** Well-organized with categories, infoboxes, tables, and linked content

## 🛠️ Implementation Approach

### Phase 1: Data Extraction (Easy - 2-3 days)

**Wiki API Scraping:**
- Use MediaWiki API for efficient data extraction
- Rate-limited requests (1 req/second) to respect server
- Extract: content, tables, categories, links, sections
- Clean HTML and format text for processing

**Key Components:**
- `getAllPageTitles()` - Fetch complete page list
- `scrapePage()` - Extract content from individual pages
- `extractTables()` - Parse structured data (upgrade costs, stats)
- `extractCleanContent()` - Remove navigation, ads, etc.

### Phase 2: Text Processing (Moderate - 1-2 days)

**Content Chunking:**
- Split pages into 500-1000 word chunks
- Preserve context and relationships
- Handle tables as separate structured chunks
- Maintain metadata (categories, page titles, URLs)

**Text Cleaning:**
- Remove MediaWiki markup
- Normalize whitespace and formatting
- Preserve meaningful structure (headings, lists)
- Extract key game terms and entities

### Phase 3: Vectorization (Easy with API - 1 day)

**Embedding Options:**
1. **OpenAI text-embedding-ada-002** (Recommended)
   - $0.0001 per 1K tokens
   - 1536 dimensions
   - Excellent semantic understanding

2. **Local Models:**
   - sentence-transformers
   - all-MiniLM-L6-v2 (384 dimensions)
   - Free but requires local compute

**Storage:**
- Vector database (Pinecone, Weaviate, or local with Faiss)
- Metadata indexing for filtering
- Category-based organization

### Phase 4: Search & Integration (Moderate - 2-3 days)

**Search Features:**
- Semantic similarity search
- Category filtering (modules, upgrades, enemies)
- Hybrid search (vector + keyword)
- Context-aware results

**Integration Options:**
1. **Standalone API** - Express server with search endpoints
2. **Dashboard Integration** - Add wiki search to your Tower dashboard
3. **Chatbot Interface** - Q&A system with wiki knowledge

## 💰 Cost Estimation

### OpenAI Embedding Costs:
- **483 pages** × **avg 800 words** = ~386K words
- **Text chunks:** ~1,500 chunks × 500 words = 750K tokens
- **Embedding cost:** $0.075 (one-time setup)
- **Search queries:** ~$0.0001 per search

### Development Time:
- **Total:** 6-8 days for complete implementation
- **MVP:** 3-4 days for basic scraping + search
- **Maintenance:** Minimal (weekly updates if needed)

## 🎯 Difficulty Assessment: **EASY TO MODERATE**

### Easy Aspects:
✅ Wiki has public API
✅ Well-structured content
✅ Clear categorization
✅ Stable page format
✅ No complex authentication

### Moderate Aspects:
⚠️ Large volume of content (483 pages)
⚠️ Varied content formats (tables, guides, lists)
⚠️ Maintaining content relationships
⚠️ Optimal chunk sizing for game-specific content

### Technical Requirements:
- Node.js environment ✅ (already have)
- OpenAI API key (or local embedding model)
- Vector database (optional - can use JSON files initially)
- Web scraping libraries (axios, cheerio)

## 🚀 Quick Start Implementation

### Option 1: Full Pipeline (Recommended)
```bash
# Install dependencies
npm install axios cheerio openai

# Run scraper
node wiki-scraper.js

# Expected output:
# - tower-wiki-data.json (raw scraped content)
# - tower-wiki-vectors.json (vectorized chunks)
# - Search functionality ready
```

### Option 2: MVP (Fast prototype)
```bash
# Scrape top 50 most important pages
# Focus on: modules, upgrades, enemies, guides
# Quick semantic search implementation
```

## 🎮 Integration with Tower Dashboard

### Search Features:
1. **Contextual Help** - Search wiki while viewing stats
2. **Strategy Suggestions** - Based on current tier/wave
3. **Upgrade Guidance** - Relevant wiki content for upgrades
4. **FAQ System** - Instant answers to common questions

### Example Queries:
- "How do modules work at tier 15?"
- "Best upgrades for wave 5000+"
- "Golden tower strategy"
- "Death wave damage calculation"

## 📈 Success Metrics:

- **Coverage:** All 483 pages successfully scraped
- **Accuracy:** >90% content preservation
- **Performance:** <2 second search response time
- **Relevance:** Top 3 results relevant to query 80%+ of time

## 🔧 Alternative Approaches:

1. **Gradual Implementation:** Start with 50 key pages
2. **Category-Focused:** Begin with modules/upgrades only
3. **Community-Driven:** Let users flag important pages
4. **Hybrid Approach:** Combine with game data for richer context

## Conclusion

**Feasibility: HIGH** ✅
**ROI: EXCELLENT** 📈
**Implementation: STRAIGHTFORWARD** 🛠️

This would create a powerful knowledge base for Tower players, making your dashboard the go-to resource for both statistics AND game knowledge. The wiki content would complement your gameplay analytics perfectly!