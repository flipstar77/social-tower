# Social Tower - Refactoring Guide

## Overview

This document describes the refactoring efforts to modularize and improve the Social Tower codebase following best practices.

## What Was Refactored

### 1. **Centralized Configuration** ✅

Previously, configuration was scattered across multiple files. Now consolidated into:

```
config/
  ├── app-config.js          # Application-wide settings
  ├── channels-config.js     # YouTube channel definitions
  └── reddit-config.js       # Reddit feed configuration
```

**Benefits:**
- Single source of truth for all configuration
- Easy to update API endpoints, intervals, cache settings
- Shared between server and client

**Usage:**
```javascript
// Client-side
const apiUrl = APP_CONFIG.api.baseUrl;
const channels = YOUTUBE_CHANNELS;

// Server-side
const { YOUTUBE_CHANNELS } = require('./config/channels-config');
```

---

### 2. **Shared Utility Modules** ✅

Common utility functions extracted into reusable modules:

```
public/js/utils/
  └── text-utils.js          # Text formatting, time ago, truncation
```

**Before:**
- `getTimeAgo()` duplicated in 3+ files
- `truncateText()` implemented 4 different ways
- `formatViewCount()` copy-pasted everywhere

**After:**
```javascript
TextUtils.getTimeAgo(date);
TextUtils.truncate(text, 120);
TextUtils.formatViewCount(25300); // "25.3K"
```

---

### 3. **Shared Services** ✅

Created centralized service layer:

```
public/js/services/
  ├── api-client.js          # HTTP client with retry logic
  └── cache-service.js       # localStorage wrapper with expiration
```

**ApiClient Features:**
- Automatic retry on failure
- Timeout handling
- Fallback URL support
- Consistent error handling

**CacheService Features:**
- Automatic expiration
- Cache hit/miss tracking
- getOrFetch() pattern

**Usage:**
```javascript
const api = new ApiClient();
const result = await api.get('/api/videos');

const cache = new CacheService();
cache.set('videos', data, 1800000); // 30 min expiry
```

---

### 4. **Base Feed Manager** ✅

Eliminated 500+ lines of duplicate code by creating abstract base class:

```
public/js/core/
  └── base-feed-manager.js   # Shared RSS/feed management logic
```

**Before:**
- YouTubeRSSManager: 903 lines
- RedditRSSManager: 662 lines
- ~70% duplicate code

**After:**
- BaseFeedManager: 272 lines (shared)
- YouTubeRSSManager: 280 lines (YouTube-specific)
- RedditRSSManager: 235 lines (Reddit-specific)

**Shared Functionality:**
- Data loading and caching
- Filter management
- Carousel rendering
- Periodic updates
- Notifications

---

### 5. **UI Components** ✅

Extracted reusable UI components:

```
public/js/components/
  └── filter-chips.js        # Reusable filter chip component
```

**Features:**
- Multi-select/single-select modes
- State persistence
- Customizable colors
- Event callbacks

**Usage:**
```javascript
const chips = new FilterChips('containerId', {
    multiSelect: true,
    onChange: (activeFilters) => {
        console.log('Filters changed:', activeFilters);
    }
});

chips.render([
    { value: 'strategy', label: 'Strategy', color: '#4CAF50' },
    { value: 'guide', label: 'Guide', color: '#00BCD4' }
]);
```

---

### 6. **Process Management Split** ✅

Broke down monolithic `init.js` (433 lines) into focused modules:

```
server/core/
  ├── process-manager.js     # Process lifecycle management
  ├── service-registry.js    # Service definitions
  └── logger.js              # Centralized logging
```

**Before:**
- Single 433-line file
- Mixed concerns (process management, config, logging)
- Hard to test or extend

**After:**
- Separated concerns
- Testable modules
- Easy to add new services
- Centralized logging

**Usage:**
```bash
# Old way
node init.js start

# New way (same command, cleaner code)
node init-refactored.js start
```

---

### 7. **Refactored Feed Managers** ✅

Created clean implementations using new architecture:

```
public/js/
  ├── youtube-rss-refactored.js
  └── reddit-rss-refactored.js
```

**Key Improvements:**
- Extends BaseFeedManager
- Uses ApiClient for HTTP requests
- Uses CacheService for storage
- Uses FilterChips for UI
- Uses TextUtils for formatting
- 60% less code
- Better error handling
- Consistent patterns

---

## Migration Guide

### For Developers

#### Using Refactored Modules

1. **Include new dependencies in HTML:**

```html
<!-- Configuration -->
<script src="/config/app-config.js"></script>
<script src="/config/channels-config.js"></script>
<script src="/config/reddit-config.js"></script>

<!-- Services -->
<script src="/js/services/api-client.js"></script>
<script src="/js/services/cache-service.js"></script>

<!-- Utilities -->
<script src="/js/utils/text-utils.js"></script>

<!-- Components -->
<script src="/js/components/filter-chips.js"></script>

<!-- Core -->
<script src="/js/core/base-feed-manager.js"></script>

<!-- Implementations -->
<script src="/js/youtube-rss-refactored.js"></script>
<script src="/js/reddit-rss-refactored.js"></script>
```

2. **Initialize managers:**

```javascript
// Initialize YouTube feed
const youtubeManager = new YouTubeRSSManager();
await youtubeManager.init();

// Initialize Reddit feed
const redditManager = new RedditRSSManager();
await redditManager.init();
```

#### Creating New Feed Managers

To create a new feed type (e.g., Twitter, Discord):

```javascript
class TwitterFeedManager extends BaseFeedManager {
    constructor() {
        super({
            updateInterval: 300000,
            cacheKey: 'twitter_posts',
            // ... config
        });
    }

    // Required: Define grid selector
    getGridSelector() {
        return '.twitter-grid';
    }

    // Required: Load data
    async loadData(forceRefresh) {
        // Fetch Twitter data
        // Update this.items
        // Call this.updateCarousel()
    }

    // Required: Create tile
    createTile(tweet) {
        // Return DOM element for tweet
    }

    // Optional: Custom filters
    applyCustomFilters(items) {
        // Apply tweet-specific filtering
        return items;
    }
}
```

---

## File Structure

### Before Refactoring
```
social-tower/
├── init.js (433 lines - monolithic)
├── youtube-rss.js (903 lines - monolithic)
├── reddit-rss.js (662 lines - monolithic)
└── server/routes/videos.js (channels hardcoded)
```

### After Refactoring
```
social-tower/
├── config/
│   ├── app-config.js
│   ├── channels-config.js
│   └── reddit-config.js
├── public/js/
│   ├── core/
│   │   └── base-feed-manager.js
│   ├── services/
│   │   ├── api-client.js
│   │   └── cache-service.js
│   ├── utils/
│   │   └── text-utils.js
│   ├── components/
│   │   └── filter-chips.js
│   ├── youtube-rss-refactored.js
│   └── reddit-rss-refactored.js
├── server/
│   ├── core/
│   │   ├── process-manager.js
│   │   ├── service-registry.js
│   │   └── logger.js
│   └── routes/
│       └── videos.js (now uses centralized config)
├── init-refactored.js
└── REFACTORING_GUIDE.md (this file)
```

---

## Benefits

### Code Quality
- ✅ **-500 lines** of duplicate code eliminated
- ✅ **Separation of concerns** - each module has single responsibility
- ✅ **DRY principle** - reusable components and utilities
- ✅ **Testability** - modular code is easier to test

### Maintainability
- ✅ **Centralized config** - one place to update settings
- ✅ **Consistent patterns** - all feed managers work the same way
- ✅ **Clear structure** - easy to find and modify code
- ✅ **Documentation** - well-commented modules

### Extensibility
- ✅ **Easy to add features** - extend base classes
- ✅ **Plugin architecture** - new feed types drop right in
- ✅ **Reusable components** - FilterChips works everywhere
- ✅ **Service layer** - swap implementations easily

### Performance
- ✅ **Smart caching** - expiration-based cache
- ✅ **Retry logic** - handles transient failures
- ✅ **Fallback URLs** - multiple data sources
- ✅ **Efficient rendering** - shared carousel logic

---

## Next Steps

### Recommended Future Improvements

1. **Consolidate Dashboard Files**
   - Merge `script.js` and `tower-dashboard.js`
   - Create `DashboardController` using similar patterns

2. **Extract Analytics Modules**
   - Create `BaseAnalyticsManager`
   - Refactor analytics-*.js files

3. **Add TypeScript**
   - Convert modules to TypeScript for type safety
   - Better IDE autocomplete and error detection

4. **Unit Tests**
   - Add Jest/Mocha tests for services
   - Test BaseFeedManager functionality

5. **Bundle Optimization**
   - Use webpack/rollup for production builds
   - Code splitting for faster load times

---

## Backward Compatibility

### Old Files (Deprecated but still functional)
- `init.js` → Use `init-refactored.js`
- `youtube-rss.js` → Use `youtube-rss-refactored.js`
- `reddit-rss.js` → Use `reddit-rss-refactored.js`

### Migration Timeline
- **Phase 1** (Current): New files available, old files still work
- **Phase 2** (Next release): Update HTML to use refactored versions
- **Phase 3** (Future): Remove deprecated files

---

## Questions?

For questions about the refactoring or how to use the new modules, please refer to:
- This guide
- Inline code documentation
- Example usage in refactored files

---

**Last Updated:** 2025-10-01
**Refactored By:** Claude Code Assistant
