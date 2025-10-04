# Social Tower - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SOCIAL TOWER                             │
│                    Tower Game Analytics Hub                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Content Hub    │  │  Dashboard      │  │  Analytics      │ │
│  │  (Feeds)        │  │  (Stats)        │  │  (Runs)         │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │           │
│           └────────────────────┼─────────────────────┘           │
│                               │                                  │
│  ┌────────────────────────────┴─────────────────────────────┐  │
│  │              FEED MANAGERS (UI Components)                │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌──────────────────┐        ┌──────────────────┐        │  │
│  │  │ YouTube Manager  │        │ Reddit Manager   │        │  │
│  │  │  (280 lines)     │        │  (235 lines)     │        │  │
│  │  └────────┬─────────┘        └────────┬─────────┘        │  │
│  │           │                            │                   │  │
│  │           └────────────┬───────────────┘                   │  │
│  │                       │                                    │  │
│  │           ┌───────────┴────────────┐                      │  │
│  │           │  BaseFeedManager       │                      │  │
│  │           │  (272 lines - shared)  │                      │  │
│  │           └───────────┬────────────┘                      │  │
│  │                       │                                    │  │
│  └───────────────────────┼────────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────┴────────────────────────────────────┐ │
│  │                    CORE SERVICES                            │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ ApiClient    │  │ CacheService │  │ FilterChips  │    │ │
│  │  │ (HTTP+retry) │  │ (localStorage)│  │ (UI Component)│   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐                       │ │
│  │  │ TextUtils    │  │ EventBus     │                       │ │
│  │  │ (Formatting) │  │ (Modules)    │                       │ │
│  │  └──────────────┘  └──────────────┘                       │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   CONFIGURATION                              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  • app-config.js     (API, intervals, cache)               │ │
│  │  • channels-config.js (YouTube channels)                   │ │
│  │  • reddit-config.js   (Subreddit, flairs)                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

                              ▼ HTTP/REST ▼

┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Server                         │ │
│  │                     (server/server.js)                       │ │
│  └────────────────────────┬─────────────────────────────────────┘ │
│                           │                                       │
│  ┌────────────────────────┴─────────────────────────────────────┐ │
│  │                      ROUTE MODULES                            │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │ │
│  │  │ /videos  │  │ /reddit  │  │ /tower   │  │ /wiki    │    │ │
│  │  │ (YouTube)│  │ (Posts)  │  │ (Stats)  │  │ (Search) │    │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │ │
│  │                                                               │ │
│  │  ┌──────────┐  ┌──────────┐                                 │ │
│  │  │ /auth    │  │ /api     │                                 │ │
│  │  │ (Discord)│  │ (General)│                                 │ │
│  │  └──────────┘  └──────────┘                                 │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     SERVICES LAYER                           │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                  │ │
│  │  │ TowerDataService│  │ WikiScraper     │                  │ │
│  │  └─────────────────┘  └─────────────────┘                  │ │
│  │                                                              │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                  │ │
│  │  │ DiscordAuth     │  │ SupabaseManager │                  │ │
│  │  └─────────────────┘  └─────────────────┘                  │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    DATABASE LAYER                            │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  • Supabase (PostgreSQL)                                    │ │
│  │  • Local file storage (JSON cache)                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    PROCESS MANAGEMENT LAYER                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              init-refactored.js (Process Manager)            │ │
│  └────────────────────────┬─────────────────────────────────────┘ │
│                           │                                       │
│  ┌────────────────────────┴─────────────────────────────────────┐ │
│  │                      CORE MODULES                             │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                 │ │
│  │  │ ProcessManager   │  │ ServiceRegistry  │                 │ │
│  │  │ (Lifecycle)      │  │ (Definitions)    │                 │ │
│  │  └──────────────────┘  └──────────────────┘                 │ │
│  │                                                               │ │
│  │  ┌──────────────────┐                                        │ │
│  │  │ Logger           │                                        │ │
│  │  │ (Centralized)    │                                        │ │
│  │  └──────────────────┘                                        │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      MANAGED SERVICES                         │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  • Main Server (Express)                                    │ │
│  │  • Discord Bot (Discord.js)                                 │ │
│  │  • Wiki Indexer (Optional)                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                            │
├──────────────────────────────────────────────────────────────────┤
│  • YouTube RSS Feeds                                             │
│  • Reddit JSON API                                               │
│  • Discord API                                                   │
│  • Supabase                                                      │
│  • Tower Wiki                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### YouTube Feed Flow

```
User Opens Page
      │
      ▼
YouTubeRSSManager.init()
      │
      ├─── Load from cache (CacheService)
      │         │
      │         ├─── Cache valid? → Display cached data
      │         │
      │         └─── Cache stale/missing
      │                   │
      │                   ▼
      ├─── Fetch fresh data (ApiClient)
      │         │
      │         ├─── Try: localhost:6078/api/videos
      │         │
      │         ├─── Fallback: YouTube RSS direct
      │         │
      │         └─── Parse & normalize data
      │
      ├─── Apply filters (FilterChips)
      │
      ├─── Create tiles (BaseFeedManager.updateCarousel)
      │         │
      │         └─── Use TextUtils for formatting
      │
      ├─── Save to cache (CacheService)
      │
      └─── Display to user
```

### Filter Interaction Flow

```
User Clicks Filter Chip
      │
      ▼
FilterChips.handleChipClick()
      │
      ├─── Update active state
      │
      ├─── Trigger onChange callback
      │
      ▼
FeedManager.applyCustomFilters()
      │
      ├─── Filter items by active chips
      │
      ▼
BaseFeedManager.updateCarousel()
      │
      ├─── Re-render tiles
      │
      └─── Display filtered results
```

---

## Module Dependencies

```
YouTubeRSSManager
    ├── extends BaseFeedManager
    │       ├── uses ApiClient
    │       ├── uses CacheService
    │       └── uses TextUtils
    │
    ├── uses YOUTUBE_CHANNELS (config)
    ├── uses APP_CONFIG (config)
    └── uses FilterChips

RedditRSSManager
    ├── extends BaseFeedManager
    │       ├── uses ApiClient
    │       ├── uses CacheService
    │       └── uses TextUtils
    │
    ├── uses REDDIT_CONFIG (config)
    ├── uses APP_CONFIG (config)
    └── uses FilterChips
```

---

## File Loading Order

**Critical:** Scripts must be loaded in this order:

```html
1. Configuration (no dependencies)
   ├── app-config.js
   ├── channels-config.js
   └── reddit-config.js

2. Services (no dependencies)
   ├── api-client.js
   └── cache-service.js

3. Utilities (no dependencies)
   └── text-utils.js

4. Components (depends on services)
   └── filter-chips.js

5. Core (depends on services + utils)
   └── base-feed-manager.js

6. Implementations (depends on everything above)
   ├── youtube-rss-refactored.js
   └── reddit-rss-refactored.js
```

---

## Design Patterns Used

### 1. **Inheritance Pattern**
```
BaseFeedManager (abstract)
    ├── YouTubeRSSManager
    └── RedditRSSManager
```

### 2. **Singleton Pattern**
```javascript
// CacheService is a singleton
const cacheService = new CacheService();
window.cacheService = cacheService;
```

### 3. **Strategy Pattern**
```javascript
// Different filter strategies
applyCustomFilters(items) {
    // YouTube: filter by channel
    // Reddit: filter by flair
    // Twitter: filter by hashtag
}
```

### 4. **Observer Pattern**
```javascript
// FilterChips with onChange callback
new FilterChips('id', {
    onChange: (filters) => {
        // React to filter changes
    }
});
```

### 5. **Template Method Pattern**
```javascript
// BaseFeedManager defines algorithm
init() {
    this.loadCachedData();
    this.setupPeriodicUpdate();
    this.setupFilterEvents();
    await this.loadData(); // Override in subclass
}
```

### 6. **Factory Pattern**
```javascript
// ServiceRegistry creates services
const service = registry.getService('main-server');
processManager.startProcess('main-server', service);
```

---

## Key Architectural Decisions

### 1. **Why BaseFeedManager?**
- Eliminates 500+ lines of duplicate code
- Ensures consistent behavior across all feeds
- Makes adding new feeds trivial

### 2. **Why Separate Config Files?**
- Single source of truth
- Easy to update without code changes
- Shared between server and client

### 3. **Why ApiClient Service?**
- Centralized HTTP logic
- Built-in retry and fallback
- Consistent error handling

### 4. **Why CacheService?**
- Automatic expiration
- Consistent caching strategy
- Easy cache invalidation

### 5. **Why FilterChips Component?**
- Reusable across all feeds
- Consistent filtering UX
- Encapsulated state management

---

## Performance Optimizations

1. **Smart Caching**
   - In-memory cache for current session
   - localStorage for persistence
   - Automatic expiration

2. **Lazy Loading**
   - Load feeds only when needed
   - Periodic updates in background

3. **Fallback Strategy**
   - Multiple data sources
   - Graceful degradation

4. **Efficient Rendering**
   - Reuse DOM elements
   - Batch updates

---

## Security Considerations

1. **API Client**
   - CORS handling
   - Timeout protection
   - Error sanitization

2. **Cache Service**
   - localStorage limits
   - Data validation
   - XSS prevention

3. **Server**
   - Input validation
   - Rate limiting (routes)
   - Authentication (Discord)

---

**Last Updated:** 2025-10-01
