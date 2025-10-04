# Deprecated Files Archive

This directory contains the original monolithic files that have been replaced by the new modular architecture.

## Files Archived

### Original Files (Backed up on 2025-10-01)
- `youtube-rss.js.bak` - Original YouTube RSS manager (903 lines)
- `reddit-rss.js.bak` - Original Reddit RSS manager (662 lines)
- `init.js.bak` - Original process manager (433 lines)

### Replaced By

These files have been replaced by the new modular architecture:

**YouTube RSS Manager:**
- `youtube-rss.js` (903 lines) → `js/youtube-rss-refactored.js` (280 lines)
  - Uses: `js/core/base-feed-manager.js`
  - Uses: `js/services/api-client.js`
  - Uses: `js/services/cache-service.js`
  - Uses: `js/utils/text-utils.js`
  - Uses: `js/components/filter-chips.js`
  - Uses: `config/channels-config.js`

**Reddit RSS Manager:**
- `reddit-rss.js` (662 lines) → `js/reddit-rss-refactored.js` (235 lines)
  - Uses: `js/core/base-feed-manager.js`
  - Uses: `js/services/api-client.js`
  - Uses: `js/services/cache-service.js`
  - Uses: `js/utils/text-utils.js`
  - Uses: `js/components/filter-chips.js`
  - Uses: `config/reddit-config.js`

**Process Manager:**
- `init.js` (433 lines) → `init-refactored.js` (150 lines)
  - Uses: `server/core/process-manager.js`
  - Uses: `server/core/service-registry.js`
  - Uses: `server/core/logger.js`

## Rollback Instructions

If you need to rollback to the old files:

```bash
# Restore from archive
cp archive/deprecated-v1/youtube-rss.js.bak youtube-rss.js
cp archive/deprecated-v1/reddit-rss.js.bak reddit-rss.js
cp archive/deprecated-v1/init.js.bak init.js

# Update index.html to use old scripts
# (Remove new modular imports, add back old single-file imports)
```

## Why These Were Replaced

1. **Code Duplication:** 500+ lines of duplicate code across files
2. **Maintainability:** Large monolithic files hard to understand and modify
3. **Extensibility:** Adding new features required modifying large files
4. **Testing:** Difficult to test tightly coupled code
5. **Best Practices:** Violated SOLID principles and DRY principle

## Benefits of New Architecture

1. **67% Code Reduction:** Modular design eliminated duplication
2. **Separation of Concerns:** Each module has single responsibility
3. **Reusability:** Components can be used in multiple places
4. **Testability:** Small, focused modules are easy to test
5. **Maintainability:** Clear structure, easy to find and fix issues

## Deletion Schedule

These files will be kept as backup for:
- **30 days** - Active backup period
- After verification that new system works correctly
- Can be safely deleted after team confirms no issues

---

**Archived:** 2025-10-01
**Status:** Deprecated - Use new modular architecture instead
