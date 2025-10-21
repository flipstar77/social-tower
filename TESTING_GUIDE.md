# TESTING GUIDE - User Data Isolation Fix

## 🧪 Step-by-Step Testing Instructions

**IMPORTANT:** You MUST follow these steps in order!

---

## ✅ **STEP 1: Restart Everything**

### A. Restart the Server
```bash
# Stop the current server (Ctrl+C)
# Then restart it
cd "d:\social tower\server"
npm start
```

### B. Hard Refresh Browser
- **Windows/Linux:** Press `Ctrl + Shift + R`
- **Mac:** Press `Cmd + Shift + R`
- **OR** Open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

---

## ✅ **STEP 2: Clear Everything**

### Open Browser DevTools (F12), then:

1. **Application Tab** → **Storage** → **Clear site data**
2. **Application Tab** → **LocalStorage** → Right-click → **Clear**
3. **Application Tab** → **Session Storage** → Right-click → **Clear**
4. **Network Tab** → **Disable cache** checkbox

---

## ✅ **STEP 3: Check Debug Output**

### Reload the page and check the Console:

You should see:
```
🧹 EMERGENCY: Clearing all cached data due to security fix...
✅ Cleared X cache items for security
🔍 AUTH DEBUG STARTED
========================
```

**Copy and paste ALL the debug output** and send it to me!

---

## ✅ **STEP 4: Login and Check**

### Login with User A:

1. **Check Console** - You should see:
   ```
   ✅ CacheService is available
      User ID Prefix: user_XXXXX_
   ✅ Supabase client is available
   ✅ Session exists
      User ID: xxx
      Provider ID: 123456789
      Access Token: Present
   ✅ Discord auth is available
      Is Authenticated: true
   ```

2. **Check LocalStorage** (Application Tab → LocalStorage):
   - Should have keys like: `user_123456_tower-runs`
   - **NOT** generic keys like: `tower-runs`

3. **Check Network Tab**:
   - Find any request to `/api/tower/runs`
   - Click on it → **Headers** tab
   - Look for: `Authorization: Bearer eyJ...`
   - **Screenshot this if possible!**

---

## ✅ **STEP 5: Submit a Test Run**

1. Submit a run as User A
2. Check it appears in the dashboard
3. Note the run details

---

## ✅ **STEP 6: Logout**

1. Click Logout
2. **Check Console** - Should see:
   ```
   🧹 Clearing cache for user: user_123456_
   ✅ Cleared X cache items
   ✅ Cache cleared on logout
   ```

3. **Check LocalStorage** - Should be cleared

---

## ✅ **STEP 7: Login as Different User**

1. Login with User B (different Discord account)
2. **Check Console** - Should see:
   ```
   ✅ Cache isolated for user: 789012
   ```
   (Different user ID!)

3. **Check Dashboard** - Should see:
   - **ZERO runs** (if User B hasn't submitted any)
   - **NO runs from User A**

4. **Check LocalStorage** - Should have:
   - Keys like: `user_789012_tower-runs`
   - **Different** from User A's prefix

---

## 🔍 **WHAT TO SEND ME:**

Please copy and send me:

### 1. Console Output
```
(Copy everything from the console after page load)
```

### 2. LocalStorage Screenshot
- DevTools → Application → LocalStorage
- Show me the keys

### 3. Network Request Headers
- DevTools → Network → `/api/tower/runs` request
- Headers tab → Request Headers
- Look for `Authorization:`

### 4. What You See
- Do you still see User A's data when logged in as User B?
- How many runs do you see?
- Are they the correct user's runs?

---

## 🚨 **COMMON ISSUES:**

### Issue: "CacheService userIdPrefix: NOT SET"
**Solution:** The cache service isn't being initialized properly. Need to check script load order.

### Issue: "NO Authorization header"
**Solution:** Supabase client not available. Need to check if discord-auth.js loaded.

### Issue: "Still seeing other user's data"
**Solution:** Server might not be filtering. Need to check server logs.

---

## 📝 **SERVER LOGS TO CHECK:**

In your server console, you should see:
```
🔐 Auth Check: { path: '/runs', hasAuth: true, ... }
✅ User authenticated: Username
   Discord ID: 123456789
🔐 Filtering stats for user: 123456789
📊 Fetched X runs for user: 123456789
```

**Copy these server logs too!**

---

After following all these steps, send me:
1. ✅ Browser console output
2. ✅ LocalStorage screenshot
3. ✅ Network headers screenshot
4. ✅ Server console logs
5. ✅ What you're seeing (still same issue or fixed?)

This will help me identify exactly what's not working!
