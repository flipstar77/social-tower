# Code Refactoring Plan - Social Tower Project

**Created:** 2025-10-07
**Status:** Phase 1 - Planning & Cleanup
**Safety Level:** HIGH - All changes have rollback procedures

---

## 🎯 Project Goals

1. Improve code maintainability and organization
2. Reduce technical debt (30+ CSS files, 2000+ line JS files)
3. Eliminate duplicate/dead code
4. Maintain 100% functionality throughout refactoring
5. Create clear rollback procedures for every change

---

## 📊 Current State Inventory

### **Critical Production Files (DO NOT DELETE)**

#### Frontend Core
- `public/index.html` - Main entry point (1054 lines)
- `public/tower-analytics.js` - Analytics dashboard (2144 lines) ⚠️ NEEDS SPLIT
- `public/script.js` - Main dashboard logic (1662 lines) ⚠️ NEEDS SPLIT
- `public/discord-auth.js` - Auth handler (578 lines)
- `public/content-hub.js` - Content hub (1346 lines) ⚠️ NEEDS SPLIT
- `public/tower-dashboard.js` - Dashboard controller (1039 lines)
- `public/tournaments.js` - Tournament logic (365 lines)

#### Backend Core
- `server/server.js` - Express server (main entry)
- `server/bot-launcher.js` - Discord bot launcher
- `server/discord-auth.js` - Auth service
- `server/supabase-config.js` - DB connection

#### Active Routes (Used in Production)
- `server/routes/reddit.js` - Reddit API
- `server/routes/reddit-rag.js` - AI chatbot backend
- `server/routes/videos.js` - YouTube feeds
- `server/routes/tower.js` - Game stats API
- `server/routes/wiki.js` - Wiki scraping
- `server/routes/discord-auth.js` - OAuth flow
- `server/routes/discord-api.js` - Discord API
- `server/routes/tournament-brackets.js` - Tournament data

#### Active Services
- `server/services/reddit-scraper-service.js` - Reddit scraping
- `server/services/tournament-automation-service.js` - Tournament automation
- `server/wiki-scraper.js` - Wiki content

### **Root-Level Utility Scripts (Move to /scripts/)**
These are NOT imported by server.js or package.json - safe to move:
- `analyze-difficulty.js` - Bracket difficulty analysis tool
- `check-all-runs.js` - Data verification script
- `check-data.js` - DB check utility
- `check-mrflipstar-runs.js` - User-specific check
- `complete-bracket-scrape.js` - One-off scraping script
- `delete-t18-run.js` - Data cleanup script
- `extract-from-yaml.js` - Data migration tool
- `process-snapshot.js` - Snapshot processor
- `save-target-bracket.js` - Bracket saving utility
- `scrape-loop.js` - Manual scraping loop
- `test-wiki-api.js` - Wiki API test
- `init.js` - Old initialization (replaced by init-refactored.js?)
- `init-refactored.js` - Newer initialization

### **Server Scripts (22 Files - Likely Duplicates)**
Location: `server/scripts/`

**Scraper Scripts (Possibly Duplicates):**
- `dropdown-scraper.js`
- `stealth-scraper.js` (appears 5x in running processes!)
- `working-scraper.js`
- `final-scraper.js`
- `correct-dropdown-scraper.js`
- `simple-next-button.js`
- `slow-scraper.js` (appears 3x in running processes!)
- `complete-scraper.js`
- `keyboard-navigation.js`
- `keyboard-scraper.js`
- `next-bracket-button.js`
- `label-based-scraper.js`
- `scrape-all-brackets-playwright.js`
- `scrape-all-legend-brackets.js`
- `scrape-all-live-brackets.js`
- `scrape-legend-brackets.js`
- `scrape-tournament-demo.js`
- `auto-scrape-all-brackets.js`
- `fully-automated-scraper.js`

**Other Scripts:**
- `generate-mock-tournament-data.js`
- `test-tournament-scrape.js`

**⚠️ ACTION REQUIRED:** Identify which ONE scraper is actually used in production, archive the rest.

### **CSS Files (30 Total - Contains Duplicates)**

#### Root Level (Move to /public/css/)
- `styles.css` → DUPLICATE of public/styles.css
- `content-hub.css` → DUPLICATE of public/content-hub.css
- `tournaments.css` → DUPLICATE of public/tournaments.css
- `youtube-styles.css` → DUPLICATE of public/youtube-styles.css
- `css/unique-modules.css` → DUPLICATE of public/css/unique-modules.css
- `css/glassmorphism-theme.css` → DUPLICATE of public/css/glassmorphism-theme.css
- `css/force-glassmorphism.css` → DUPLICATE of public/css/force-glassmorphism.css
- `css/wiki-search.css` → DUPLICATE of public/css/wiki-search.css
- `css/achievements.css` → DUPLICATE of public/css/achievements.css
- `css/data-sharing.css` → DUPLICATE of public/css/data-sharing.css
- `css/discord-auth.css` → DUPLICATE of public/css/discord-auth.css
- `css/landing-page.css` → DUPLICATE of public/css/landing-page.css

#### Public CSS (Keep These)
- `public/styles.css` - Main styles
- `public/content-hub.css`
- `public/tournaments.css`
- `public/youtube-styles.css`
- `public/tower-analytics.css`
- `public/charts.css`
- `public/css/*.css` (all component styles)

### **Backup Files (Delete from Production)**
- `public/tower-analytics.js.bak` - Delete after verification

### **Background Processes Running (18 Scrapers!)**
These need to be killed before cleanup:
- `334295` - dropdown-scraper.js
- `60dbb4` - stealth-scraper.js
- `82fc23` - stealth-scraper.js
- `cfb61f` - stealth-scraper.js
- `6d4ee1` - stealth-scraper.js
- `503f00` - stealth-scraper.js
- `4d78e1` - working-scraper.js
- `8d503c` - final-scraper.js
- `de58ff` - correct-dropdown-scraper.js
- `7b3109` - simple-next-button.js
- `977e2d` - slow-scraper.js
- `e17b13` - complete-scraper.js
- `a348b5` - keyboard-navigation.js
- `09dcf0` - next-bracket-button.js
- `9810f5` - slow-scraper.js
- `395bbd` - label-based-scraper.js
- `2f473c` - slow-scraper.js
- `cfd0de` - npm start (KEEP THIS ONE!)

---

## 🚀 Phase 1: Safe Cleanup (Low Risk)

### Step 1: Kill Orphaned Scraper Processes ✅
**Risk:** None - these are abandoned test scripts
**Rollback:** N/A - processes will restart on next run if needed

```bash
# Kill all scraper processes (except npm start)
# Will be done manually to avoid killing the server
```

### Step 2: Create Backup Branch ✅
**Risk:** None
**Rollback:** Switch back to main

```bash
git checkout -b refactor/phase1-cleanup
```

### Step 3: Archive Unused Root Scripts ✅
**Risk:** Low - none are imported by main code
**Rollback:** `git checkout main -- scripts/`

```bash
mkdir -p archive/root-scripts
mv analyze-difficulty.js archive/root-scripts/
mv check-all-runs.js archive/root-scripts/
mv check-data.js archive/root-scripts/
mv check-mrflipstar-runs.js archive/root-scripts/
mv complete-bracket-scrape.js archive/root-scripts/
mv delete-t18-run.js archive/root-scripts/
mv extract-from-yaml.js archive/root-scripts/
mv process-snapshot.js archive/root-scripts/
mv save-target-bracket.js archive/root-scripts/
mv scrape-loop.js archive/root-scripts/
mv test-wiki-api.js archive/root-scripts/
mv init.js archive/root-scripts/
mv init-refactored.js archive/root-scripts/

# Keep in root (still used):
# - reddit-rss.js (if referenced)
# - youtube-rss.js (if referenced)
```

### Step 4: Archive Duplicate Scraper Scripts ✅
**Risk:** Medium - need to identify which ONE is used
**Rollback:** `git checkout main -- server/scripts/`

**First, check server.js and tournament-automation-service.js to see which scraper is actually called!**

```bash
mkdir -p archive/scraper-experiments
# Move all EXCEPT the one actually used in production
```

### Step 5: Remove Duplicate CSS Files ✅
**Risk:** Low - duplicates in root, originals in /public/
**Rollback:** `git checkout main -- styles.css content-hub.css ...`

```bash
# Delete root-level CSS duplicates
rm styles.css content-hub.css tournaments.css youtube-styles.css
rm -rf css/  # Root css folder (duplicates public/css/)
```

### Step 6: Remove Backup Files ✅
**Risk:** None - .bak files
**Rollback:** `git checkout main -- public/tower-analytics.js.bak`

```bash
rm public/tower-analytics.js.bak
```

### Step 7: Update .gitignore ✅
```gitignore
# Backup files
*.bak
*.backup
*.tmp

# Archive folder
/archive/

# Logs
*.log
npm-debug.log*
```

### Step 8: Test Site Functionality ✅
**Manual Testing Checklist:**
- [ ] Site loads at http://localhost:6079
- [ ] Discord login works
- [ ] Dashboard shows stats
- [ ] Content Hub loads
- [ ] Tower Analytics works
- [ ] Tournaments page loads
- [ ] Chatbot responds
- [ ] Reddit feed shows posts
- [ ] YouTube videos display

### Step 9: Commit Phase 1 ✅
```bash
git add -A
git commit -m "Phase 1: Clean up root directory and archive unused scripts

- Moved 13 utility scripts from root to archive/root-scripts/
- Archived duplicate scraper experiments (kept production scraper)
- Removed 12 duplicate CSS files from root (kept public/ versions)
- Removed .bak backup files
- Updated .gitignore for backups and archives
- Killed 17 orphaned scraper processes

Testing: All core functionality verified working
Rollback: git checkout main"
```

---

## 🔄 Rollback Procedures

### If Site Breaks After Phase 1
```bash
# Full rollback
git checkout main

# Partial rollback (specific files)
git checkout main -- [file_path]

# Restore deleted files
git checkout HEAD~1 -- [file_path]
```

### If Scraper Stops Working
```bash
# Restore all scrapers
git checkout main -- server/scripts/

# Or restore from archive
cp archive/scraper-experiments/[scraper-name].js server/scripts/
```

### Emergency Restore All
```bash
git reset --hard HEAD~1
```

---

## 📋 Phase 2: Modularization (Future)

### Split Large Files
- `tower-analytics.js` (2144 lines) → 6 modules (~350 lines each)
- `script.js` (1662 lines) → 5 modules (~330 lines each)
- `content-hub.js` (1346 lines) → 4 modules (~336 lines each)

### CSS Organization
- Implement BEM naming convention
- Use CSS custom properties for theming
- Consolidate force-glassmorphism overrides

### Build Process
- Add Webpack or Vite bundler
- Minify JS/CSS for production
- Implement cache-busting with hashes (not version params)

---

## 📋 Phase 3: Architecture Improvements (Future)

### Frontend Framework
- Consider React/Vue migration for component reusability
- State management (Redux/Zustand)

### TypeScript Migration
- Add type safety for large codebase
- Better IDE autocomplete

### Monorepo Structure
```
/packages
  ├── client/
  ├── server/
  └── shared/
```

---

## 🔍 How to Use This Document

1. **Before starting any work:** Read the relevant phase section
2. **During work:** Follow steps in order, mark completed with ✅
3. **If something breaks:** Follow rollback procedures immediately
4. **After completing phase:** Update README.md with new structure
5. **Context lost:** Read this file to understand what was done and where to continue

---

## 📞 Support & Context Recovery

**If you lose context or restart:**

1. Read `REFACTORING_PLAN.md` (this file)
2. Check git log for recent commits
3. Review current branch: `git branch --show-current`
4. See what's changed: `git status`
5. Compare with main: `git diff main`

**Current Phase Status:**
- Phase 1: IN PROGRESS
- Phase 2: NOT STARTED
- Phase 3: NOT STARTED

**Last Updated:** 2025-10-07
