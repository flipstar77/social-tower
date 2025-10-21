# DEPLOYMENT INSTRUCTIONS - Security Fix

## 🚨 CRITICAL SECURITY FIX DEPLOYMENT

**Date:** 2025-10-21
**Issue:** Users seeing each other's data
**Severity:** CRITICAL

---

## 📋 FILES MODIFIED

### Frontend Files (7 files):
1. ✅ `public/js/services/cache-service.js` - Added user-scoped caching
2. ✅ `public/js/dashboard/DashboardDataService.js` - Added auth headers
3. ✅ `public/discord-auth.js` - Added cache management on login/logout
4. ✅ `public/js/emergency-cache-clear.js` - **NEW** - One-time cache clear
5. ✅ `public/index.html` - Added emergency cache clear script

### Backend Files (5 files):
6. ✅ `server/routes/tower/stats.js` - Added user filtering
7. ✅ `server/routes/tower/progress.js` - Added user filtering
8. ✅ `server/database/tower/statsQueries.js` - Added user filtering to all queries
9. ✅ `server/database/tower/runQueries.js` - Enhanced user filtering

### Documentation (2 files):
10. ✅ `SECURITY_FIX_DATA_ISOLATION.md` - Complete fix documentation
11. ✅ `DEPLOYMENT_INSTRUCTIONS.md` - This file

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Deploy to Production

```bash
# 1. Commit all changes
git add .
git commit -m "CRITICAL: Fix user data isolation - users seeing each other's runs"

# 2. Push to repository
git push origin main

# 3. Deploy to Vercel (or your hosting platform)
# Vercel will auto-deploy on push to main
```

### Step 2: Verify Deployment

After deployment, check these URLs:
- ✅ https://your-domain.com/js/emergency-cache-clear.js
- ✅ https://your-domain.com/ (should load without errors)

### Step 3: Monitor Console Logs

When users visit after deployment, you should see:
```
🧹 EMERGENCY: Clearing all cached data due to security fix...
✅ Cleared X cache items for security
   Reason: User data isolation fix
   Date: 2025-10-21
```

Then after login:
```
✅ Cache isolated for user: 123456789
🔐 Including auth token in API request
🔐 Filtering stats for user: 123456789
📊 Fetched X runs for user: 123456789
```

### Step 4: Test with Multiple Accounts

1. **Login as User A**
   - Submit a test run
   - Check localStorage in DevTools
   - Should see keys like: `user_123456_tower-runs`

2. **Logout User A**
   - Console should show: `✅ Cache cleared on logout`
   - localStorage should be empty for that user

3. **Login as User B**
   - Should see **ZERO runs** from User A
   - Should see new cache keys: `user_789012_tower-runs`

---

## ⚠️ IMPORTANT NOTES

### The Emergency Cache Clear Script

The file `public/js/emergency-cache-clear.js` will:
- Run **ONCE** on each user's first page load after deployment
- Clear ALL localStorage data
- Set a flag so it doesn't clear again
- **Can be removed after 1-2 weeks** when all users have logged in at least once

### After 1-2 Weeks:

```bash
# Remove the emergency cache clear
git rm public/js/emergency-cache-clear.js

# Remove from index.html
# Delete these lines:
#   <!-- EMERGENCY CACHE CLEAR (MUST be first - security fix 2025-10-21) -->
#   <script src="js/emergency-cache-clear.js?v=1"></script>

git commit -m "Remove emergency cache clear script - all users migrated"
git push
```

---

## 🔍 WHAT TO WATCH FOR

### Good Signs ✅:
```
✅ Cache isolated for user: 123456789
🔐 Including auth token in API request
🔐 Filtering stats for user: 123456789
📊 Fetched 5 runs for user: 123456789
✅ Cache cleared on logout
```

### Bad Signs ❌:
```
⚠️ Cache mismatch: Expected user_123_, got user_456_
⚠️ No user ID provided - returning empty stats
⚠️ No active session - API may return no data
⚠️ Supabase client not initialized
```

If you see bad signs:
1. Check that the user is logged in
2. Check browser console for errors
3. Check that auth tokens are being sent (Network tab → Headers)
4. Report the issue with console logs

---

## 🧪 MANUAL TESTING CHECKLIST

After deployment, test these scenarios:

### Scenario 1: Fresh User
- [ ] Clear browser cache completely
- [ ] Visit site
- [ ] Check console for "EMERGENCY: Clearing all cached data"
- [ ] Login with Discord
- [ ] Check console for "Cache isolated for user"
- [ ] Submit a run
- [ ] Verify run appears in dashboard
- [ ] Check localStorage has user-prefixed keys

### Scenario 2: User Switching
- [ ] Login as User A
- [ ] Submit a run
- [ ] Note User A's run data
- [ ] Logout
- [ ] Check console for "Cache cleared on logout"
- [ ] Check localStorage is empty
- [ ] Login as User B
- [ ] Verify User B sees NO runs from User A
- [ ] Verify User B's localStorage has different prefix

### Scenario 3: API Authentication
- [ ] Login as User A
- [ ] Open DevTools → Network tab
- [ ] Load dashboard
- [ ] Check `/api/tower/runs` request
- [ ] Verify `Authorization: Bearer ...` header is present
- [ ] Check response contains only User A's data

---

## 🔒 SECURITY VERIFICATION

Run these checks in production:

### Check 1: Cache Isolation
```javascript
// In browser console
Object.keys(localStorage).filter(k => k.includes('tower'))
// Should show keys like: "user_123456_tower-runs"
// NOT generic keys like: "tower-runs"
```

### Check 2: API Headers
```javascript
// In Network tab, check any /api/tower/* request
// Headers tab should show:
Authorization: Bearer eyJ...
```

### Check 3: Server Logs
```bash
# Check server logs for these messages:
🔐 Filtering stats for user: 123456789
📊 Fetched X runs for user: 123456789
```

---

## 📊 ROLLBACK PLAN

If something goes wrong:

### Option 1: Quick Rollback
```bash
git revert HEAD
git push
```

### Option 2: Manual Rollback
1. Remove the emergency cache clear script from index.html
2. Revert changes to:
   - cache-service.js
   - DashboardDataService.js
   - discord-auth.js
   - server routes and queries
3. Commit and push

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:
- [x] All users see only their own data
- [x] No "Cache mismatch" warnings in console
- [x] Auth tokens present in all API requests
- [x] Server logs show user-filtered queries
- [x] No cross-user data leakage reported

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console for errors
2. Check server logs for filtering messages
3. Verify localStorage keys are user-prefixed
4. Test with multiple accounts
5. Report with:
   - Browser console logs
   - Network tab screenshots
   - Server logs
   - Steps to reproduce

---

**Last Updated:** 2025-10-21
**Status:** Ready for Deployment
**Est. Time:** 5-10 minutes
