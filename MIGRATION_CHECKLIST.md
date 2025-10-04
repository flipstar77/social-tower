# Migration Checklist

Quick checklist for migrating from old monolithic code to new refactored modules.

## ✅ Phase 1: Verify New Files

All new files have been created. Verify they exist:

```bash
# Configuration
□ config/app-config.js
□ config/channels-config.js
□ config/reddit-config.js

# Services
□ public/js/services/api-client.js
□ public/js/services/cache-service.js

# Utilities
□ public/js/utils/text-utils.js

# Components
□ public/js/components/filter-chips.js

# Core
□ public/js/core/base-feed-manager.js

# Refactored Managers
□ public/js/youtube-rss-refactored.js
□ public/js/reddit-rss-refactored.js

# Server Core
□ server/core/process-manager.js
□ server/core/service-registry.js
□ server/core/logger.js

# New Init
□ init-refactored.js

# Documentation
□ REFACTORING_GUIDE.md
□ REFACTORING_SUMMARY.md
□ MIGRATION_CHECKLIST.md (this file)
```

---

## ✅ Phase 2: Update HTML Files

### Find HTML files that include old scripts:

```bash
# Search for old script includes
grep -r "youtube-rss.js\|reddit-rss.js" public/*.html
```

### Update script includes:

**BEFORE:**
```html
<script src="/youtube-rss.js"></script>
<script src="/reddit-rss.js"></script>
```

**AFTER:**
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

<!-- Feed Managers -->
<script src="/js/youtube-rss-refactored.js"></script>
<script src="/js/reddit-rss-refactored.js"></script>
```

**Files to update:**
```bash
□ public/index.html
□ public/content-hub.html (if exists)
□ [Add any other HTML files that use feeds]
```

---

## ✅ Phase 3: Test Functionality

### Test YouTube Feed:
```bash
□ Open page in browser
□ Verify YouTube videos load
□ Test channel filtering
□ Test sort dropdown
□ Test manual refresh button
□ Check browser console for errors
```

### Test Reddit Feed:
```bash
□ Open page in browser
□ Verify Reddit posts load
□ Test flair filtering
□ Test manual refresh button
□ Check browser console for errors
```

### Test Caching:
```bash
□ Open browser DevTools → Application → Local Storage
□ Verify 'youtube_videos' cache entry exists
□ Verify 'reddit_posts' cache entry exists
□ Refresh page - should load from cache
```

### Test Server:
```bash
# Test new init script
□ node init-refactored.js status
□ node init-refactored.js start
□ Verify services start successfully
□ Check logs directory created
□ node init-refactored.js stop
```

---

## ✅ Phase 4: Clean Up (Optional)

Once everything works, you can remove old files:

```bash
# Backup first!
□ Create backup: cp youtube-rss.js youtube-rss.js.bak
□ Create backup: cp reddit-rss.js reddit-rss.js.bak
□ Create backup: cp init.js init.js.bak

# Remove old files (AFTER testing!)
□ rm youtube-rss.js
□ rm reddit-rss.js
□ rm init.js

# Or move to archive
□ mkdir archive
□ mv youtube-rss.js reddit-rss.js init.js archive/
```

---

## ✅ Phase 5: Update Documentation

```bash
□ Update README.md with new file structure
□ Update any setup guides
□ Update deployment scripts if needed
```

---

## 🚨 Troubleshooting

### Issue: "BaseFeedManager is not defined"
**Solution:** Make sure `base-feed-manager.js` is included BEFORE the feed managers

### Issue: "APP_CONFIG is not defined"
**Solution:** Make sure `app-config.js` is included FIRST

### Issue: "YOUTUBE_CHANNELS is not defined"
**Solution:** Make sure `channels-config.js` is included

### Issue: Videos/posts not loading
**Solution:**
1. Check browser console for errors
2. Verify API endpoints in `app-config.js`
3. Check network tab in DevTools

### Issue: Filters not working
**Solution:**
1. Verify filter chip container IDs match
2. Check `FilterChips` is included
3. Look for console errors

---

## 📋 Rollback Plan

If something goes wrong:

```bash
# 1. Restore from backups
cp youtube-rss.js.bak youtube-rss.js
cp reddit-rss.js.bak reddit-rss.js
cp init.js.bak init.js

# 2. Revert HTML changes
git checkout public/index.html
# (or manually restore old script tags)

# 3. Restart server with old init
node init.js start
```

---

## ✨ Success Criteria

Your migration is complete when:

- ✅ All feeds load correctly
- ✅ Filtering works
- ✅ Caching works
- ✅ No console errors
- ✅ Server starts with init-refactored.js
- ✅ All old functionality preserved
- ✅ Code is cleaner and more maintainable

---

## 📞 Need Help?

- **Documentation:** See [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md)
- **Summary:** See [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)
- **Code Comments:** All modules have detailed inline documentation

---

**Happy Migrating! 🚀**
