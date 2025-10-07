# Phase 3: Performance & Bundling

**Date:** 2025-10-07
**Status:** Ready to start
**Estimated Time:** 3-4 hours
**Goal:** Reduce 814KB → 250KB, 40+ scripts → 3-5 bundles

---

## 🎯 Two-Track Approach

### Track A: Quick Wins (30 minutes) - DO FIRST
Low-hanging fruit that provides immediate 60-70% improvement

### Track B: Full Bundling (2-3 hours) - DO SECOND
Complete bundler setup with Vite for long-term maintainability

---

## 🚀 Track A: Quick Wins (RECOMMENDED STARTING POINT)

### Task 1: Add Compression Middleware (5 min)
**Impact:** 814KB → ~200KB over network (60% reduction)

```bash
npm install compression
```

```javascript
// server/server.js (add after line 30)
const compression = require('compression');

// Add compression middleware (before routes)
app.use(compression());
```

**Test:**
```bash
curl -H "Accept-Encoding: gzip" http://localhost:6078 -I
# Should see: Content-Encoding: gzip
```

---

### Task 2: Fix Reddit Rate Limiting (15 min)
**Impact:** Stop 200+ 429 errors

```javascript
// server/services/reddit-scraper-service.js

class RedditScraperService {
    constructor(supabase) {
        this.supabase = supabase;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async fetchWithBackoff(url, attempt = 0) {
        try {
            const response = await axios.get(url);
            this.retryCount = 0; // Reset on success
            return response;
        } catch (error) {
            if (error.response?.status === 429 && attempt < this.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30s
                logger.warn(`Rate limited, retrying in ${delay}ms`, { attempt });
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithBackoff(url, attempt + 1);
            }
            throw error;
        }
    }
}
```

---

### Task 3: Fix Supabase 520 Errors (10 min)
**Impact:** Reduce vectorization failures

```javascript
// server/services/embeddings.js (or wherever vectorization happens)

async function generateEmbedding(text, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await supabase.functions.invoke('generate-embedding', {
                body: { text }
            });
            return response.data;
        } catch (error) {
            if (i === retries - 1) throw error;

            logger.warn('Supabase error, retrying...', {
                attempt: i + 1,
                error: error.message
            });

            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

---

### Task 4: Combine Critical CSS (5 min)
**Impact:** 18 CSS files → 3-4 files

```bash
# Create combined CSS file
cat public/styles.css public/content-hub.css public/tower-analytics.css > public/critical.css
```

```html
<!-- public/index.html - Replace first 3 CSS links with: -->
<link rel="stylesheet" href="critical.css?v=1">
```

---

### Task 5: Add Response Caching (5 min)
**Impact:** Reduce Reddit API calls

```javascript
// server/routes/reddit.js

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

router.get('/', async (req, res) => {
    const subreddit = req.query.subreddit || 'TheTowerGame';
    const cacheKey = `reddit:${subreddit}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.info('Cache hit', { subreddit });
        return res.json(cached);
    }

    // ... fetch from database ...

    // Store in cache
    cache.set(cacheKey, result);
    res.json(result);
});
```

```bash
npm install node-cache
```

---

### Expected Results After Track A:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Network Size** | 814 KB | ~200 KB | 📉 75% |
| **429 Errors** | 200+ | 0 | ✅ Fixed |
| **520 Errors** | 50+ | ~5 | 📉 90% |
| **CSS Files** | 18 | 4 | 📉 78% |
| **Response Time** | 200-500ms | 50-100ms | 📉 75% |

---

## 🏗️ Track B: Full Bundling with Vite

### Prerequisites
- Track A completed
- All tests passing (or at least server running)
- Git committed

---

### Step 1: Install Vite (2 min)

```bash
npm install --save-dev vite @vitejs/plugin-legacy vite-plugin-html
```

---

### Step 2: Create vite.config.js (5 min)

```javascript
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
    root: 'public',
    publicDir: 'assets',
    build: {
        outDir: '../dist/public',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: './public/index.html',
            },
            output: {
                manualChunks(id) {
                    // Vendor chunk for third-party libraries
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                    // Analytics chunk
                    if (id.includes('tower-analytics') || id.includes('analytics-')) {
                        return 'analytics';
                    }
                    // Discord chunk
                    if (id.includes('discord')) {
                        return 'discord';
                    }
                    // Content hub chunk
                    if (id.includes('content-hub') || id.includes('youtube') || id.includes('reddit')) {
                        return 'content';
                    }
                },
                assetFileNames: 'assets/[name].[hash][extname]',
                chunkFileNames: 'js/[name].[hash].js',
                entryFileNames: 'js/[name].[hash].js',
            },
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.log in production
                drop_debugger: true,
            },
        },
        sourcemap: true, // For debugging
    },
    plugins: [
        createHtmlPlugin({
            minify: true,
        }),
        legacy({
            targets: ['defaults', 'not IE 11'],
        }),
    ],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:6078',
                changeOrigin: true,
            },
        },
    },
});
```

---

### Step 3: Create main.js Entry Point (15 min)

```javascript
// public/main.js (NEW FILE)

// Import styles
import './styles.css';
import './content-hub.css';
import './tower-analytics.css';
import './css/dark-dashboard-theme.css';
import './css/chatbot.css';

// Import core modules
import './discord-auth.js';
import './tower-analytics.js';
import './content-hub.js';
import './tournaments.js';
import './script.js';

// Import utilities
import './js/utils/formatting.js';
import './js/utils/storage.js';
import './js/utils/notifications.js';

// Import analytics modules
import './js/analytics-api.js';
import './js/analytics-charts.js';
import './js/analytics-filter-manager.js';

// Import chatbot
import './js/chatbot/tower-chatbot.js';

// Import modules
import './js/modules/navigation-manager.js';
import './js/modules/session-manager.js';

console.log('✅ Application loaded');
```

---

### Step 4: Update index.html (20 min)

**Before:**
```html
<script src="discord-auth.js?v=7"></script>
<script src="tower-analytics.js"></script>
<!-- ... 38 more scripts ... -->
```

**After:**
```html
<!-- Development -->
<script type="module" src="/main.js"></script>

<!-- OR Production (after build) -->
<script type="module" src="/js/main.[hash].js"></script>
```

**Full changes:**
1. Replace all `<script>` tags with single entry point
2. Keep CDN scripts (Chart.js, ECharts)
3. Add `type="module"` to main script
4. Update CSS imports in main.js instead of HTML

---

### Step 5: Update Package.json Scripts (2 min)

```json
{
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "start:server": "node server/server.js",
        "start:dev": "concurrently \"npm run dev\" \"npm run start:server\""
    }
}
```

```bash
npm install --save-dev concurrently
```

---

### Step 6: Test Build (10 min)

```bash
# Build for production
npm run build

# Check output
ls -lh dist/public/js/
# Should see: main.[hash].js, analytics.[hash].js, vendor.[hash].js, etc.

# Preview production build
npm run preview

# Open http://localhost:4173 and test all features
```

---

### Step 7: Update Server for Production (10 min)

```javascript
// server/server.js

const path = require('path');

// Serve from dist in production, public in development
const publicDir = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../dist/public')
    : path.join(__dirname, '../public');

app.use(express.static(publicDir));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});
```

---

### Step 8: Update .gitignore (1 min)

```gitignore
# Build output
dist/
```

---

### Expected Results After Track B:

| Metric | Before | After Track B | Total Improvement |
|--------|--------|---------------|-------------------|
| **JS Size** | 814 KB | 250 KB | 📉 69% |
| **Network (gzip)** | 814 KB | 80 KB | 📉 90% |
| **HTTP Requests** | 40+ | 5 | 📉 88% |
| **Load Time** | 3-5s | 1-2s | 📉 60% |
| **Lighthouse** | ~60 | ~90 | 📈 +50% |

---

## 🧪 Testing Checklist

After implementing Track A:
- [ ] Server starts without errors
- [ ] All API endpoints respond
- [ ] Reddit posts load
- [ ] No 429 errors in logs
- [ ] Response headers show gzip encoding

After implementing Track B:
- [ ] `npm run build` succeeds
- [ ] Preview site works (npm run preview)
- [ ] All pages load correctly
- [ ] Discord login works
- [ ] Analytics dashboard works
- [ ] Charts render properly
- [ ] No console errors

---

## 🔄 Rollback Plan

### Track A Rollback
```bash
# Undo compression
git checkout HEAD -- server/server.js

# Undo Reddit changes
git checkout HEAD -- server/services/reddit-scraper-service.js

# Remove node-cache if needed
npm uninstall node-cache compression
```

### Track B Rollback
```bash
# Full rollback
git checkout HEAD -- public/index.html public/main.js vite.config.js

# Remove dist
rm -rf dist/

# Uninstall Vite
npm uninstall vite @vitejs/plugin-legacy vite-plugin-html
```

---

## 📊 Success Metrics

### Must Have (Critical)
- ✅ Server runs without errors
- ✅ All features work (login, analytics, content hub)
- ✅ No console errors
- ✅ 429 errors eliminated

### Should Have (Important)
- ✅ Bundle size < 300 KB
- ✅ HTTP requests < 10
- ✅ Lighthouse score > 80

### Nice to Have (Bonus)
- ✅ Lighthouse score > 90
- ✅ Load time < 1.5s
- ✅ Service worker for offline

---

## 🚨 Known Risks

1. **Breaking Changes:** Vite module system might break global scope variables
   - **Mitigation:** Test thoroughly, use window.x for globals

2. **Import Order:** Some files depend on others being loaded first
   - **Mitigation:** Explicit imports in main.js

3. **CDN Scripts:** Chart.js/ECharts might not work with modules
   - **Mitigation:** Keep CDN scripts separate, test charts

4. **Production Build:** Might work in dev but fail in prod
   - **Mitigation:** Test `npm run preview` before deploying

---

## 📚 Resources

- [Vite Guide](https://vitejs.dev/guide/)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [Terser Options](https://terser.org/docs/api-reference#minify-options)
- [Compression Middleware](https://github.com/expressjs/compression)

---

## 💡 Pro Tips

1. **Start Small:** Test bundler with 1-2 files first
2. **Check Sourcemaps:** Enable for debugging production issues
3. **Monitor Bundle Size:** Use `npm run build -- --report` to analyze
4. **Test in Incognito:** Avoid cache issues
5. **Keep Backups:** Commit before major changes

---

## 🎯 Recommended Execution Order

### Session 1 (30 min) - Quick Wins
1. Add compression middleware
2. Fix Reddit rate limiting
3. Fix Supabase retry logic
4. Test everything works
5. **Commit:** "Phase 3A: Quick performance wins"

### Session 2 (2-3 hours) - Full Bundling
1. Install Vite
2. Create vite.config.js
3. Create main.js entry
4. Update index.html
5. Test development mode
6. Test production build
7. **Commit:** "Phase 3B: Vite bundler implementation"

---

**Last Updated:** 2025-10-07
**Status:** Ready to execute
**Next Action:** Start Track A (Quick Wins)
