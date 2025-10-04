# Social Tower Modularization Plan

## 🎯 **Current Status Summary**

### ✅ **Completed (Phase 1)**
1. **SQLite Removal**: Cleaned up dual database system, now using Supabase only
2. **Mock Data Elimination**: Dashboard no longer shows fake data when empty
3. **Process Manager Created**: `init.js` provides centralized process management
4. **Database Optimization**: Unified database layer simplified and streamlined

### 🚨 **Critical Issues Identified**

#### **Major Monoliths:**
- **server.js**: 1,941 lines with 7+ different responsibilities
- **tower-dashboard.js**: 986 lines mixing UI and business logic
- **20+ duplicate Node.js processes** consuming 6GB+ RAM

#### **Code Duplication:**
- Discord auth files exist in 3+ locations
- Wiki components duplicated across directories
- YouTube RSS functionality scattered

## 📋 **Next Phase Priorities**

### **🔥 URGENT (This Week)**

#### 1. **Extract Routes from server.js** (Reduce from 1,941 → ~200 lines)
```
server/routes/
├── auth.js          (Discord OAuth routes)
├── tower.js         (Tower statistics API)
├── videos.js        (YouTube RSS endpoints)
├── wiki.js          (Wiki search routes)
└── reddit.js        (Reddit API routes)
```

#### 2. **Create Service Layer**
```
server/services/
├── youtubeService.js
├── discordAuthService.js
├── wikiService.js
└── redditService.js
```

#### 3. **Remove Duplicate Files**
**Files to Remove:**
- `D:\social tower\public\js\discord-auth.js` (duplicate)
- `D:\social tower\wiki-scraper.js` (root level)
- `D:\social tower\js\wiki-search-mock.js` (unused)
- `D:\social tower\public\youtube-rss.js` (duplicate)

**Files to Keep:**
- `D:\social tower\server\discord-auth.js` (backend)
- `D:\social tower\js\discord-auth.js` (frontend)
- `D:\social tower\server\wiki-scraper.js` (main implementation)

### **⚡ HIGH PRIORITY (Next 2 Weeks)**

#### 4. **Modularize Dashboard Components**
```
public/js/dashboard/
├── DashboardController.js
├── StatsCalculator.js
├── ChartManager.js
├── PresetManager.js
└── DataLoader.js
```

#### 5. **Implement Proper Error Handling**
- Centralized error middleware
- Service-level error boundaries
- Client-side error handling

#### 6. **Process Management**
- Use `init.js` for all process coordination
- Eliminate duplicate bot-launcher instances
- Implement proper logging and monitoring

### **📊 MEDIUM PRIORITY (Month)**

#### 7. **Directory Restructure**
```
D:\social tower\
├── server/
│   ├── index.js (entry point)
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   └── database/
├── public/
│   ├── js/
│   │   ├── dashboard/
│   │   ├── auth/
│   │   └── shared/
│   ├── css/
│   └── assets/
├── shared/
│   ├── utils/
│   └── constants/
└── scripts/
    ├── init.js
    └── migration/
```

## 🛠️ **Implementation Steps**

### **Step 1: Route Extraction (2-3 hours)**
1. Create `server/routes/` directory
2. Extract auth routes from server.js
3. Extract tower API routes
4. Update server.js to use extracted routes
5. Test all endpoints work correctly

### **Step 2: Service Layer Creation (3-4 hours)**
1. Create `server/services/` directory
2. Move YouTube RSS logic to service
3. Move Discord auth logic to service
4. Move wiki search logic to service
5. Update routes to use services

### **Step 3: Duplicate File Cleanup (1-2 hours)**
1. Inventory all duplicate files
2. Choose canonical versions
3. Remove duplicates
4. Update import statements
5. Test all functionality

### **Step 4: Process Consolidation (2-3 hours)**
1. Use init.js for all process management
2. Kill duplicate processes
3. Configure proper logging
4. Test startup/shutdown procedures

## 📈 **Expected Impact**

### **Before Modularization:**
- **server.js**: 1,941 lines, 7 responsibilities
- **Memory usage**: ~6GB (20+ processes)
- **Maintainability**: Very poor
- **Developer experience**: Difficult to debug/modify

### **After Modularization:**
- **server.js**: ~150-200 lines (entry point only)
- **Memory usage**: ~2-3GB (3-5 processes)
- **Maintainability**: Good separation of concerns
- **Developer experience**: Clear, modular, easy to work with

## 🚀 **Quick Start Commands**

```bash
# Use the new process manager
node init.js start          # Start all services
node init.js status         # Check service status
node init.js kill-all       # Emergency stop
node init.js logs main-server # View server logs

# Or use the batch file
start.bat                   # Windows quick start
```

## 🎯 **Success Metrics**

- [ ] server.js under 300 lines
- [ ] No duplicate files in codebase
- [ ] Memory usage under 3GB total
- [ ] 5 or fewer Node.js processes running
- [ ] All tests passing after refactor
- [ ] Dashboard loads in under 2 seconds

## ⚠️ **Risk Mitigation**

1. **Backup current working state** before major changes
2. **Test each component** after extraction
3. **Maintain API compatibility** during refactoring
4. **Keep rollback plan** ready
5. **Monitor performance** after changes

---

**Next Action**: Start with route extraction from server.js - this will provide immediate benefits and reduce the monolith significantly.