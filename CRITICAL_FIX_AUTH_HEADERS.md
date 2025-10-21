# CRITICAL FIX: Authentication Headers Not Being Sent

## Root Cause Analysis

Users were seeing each other's data because **authentication headers were not being sent** with API requests. This was caused by using the deprecated Supabase v1 API method.

### The Problem

In both `DashboardDataService.js` and `analytics-run-manager.js`, the code was using:

```javascript
const session = window.supabaseClient.auth.session();  // ❌ DEPRECATED - Returns null/undefined
```

**This method was deprecated in Supabase v2** and returns `null` or `undefined`, meaning:
- No `Authorization` header was added to API requests
- Server received requests without user identification
- Server defaulted to returning **ALL users' data** instead of filtered data

### The Flow of the Bug

1. **Frontend**: Calls API without Authorization header
2. **Auth Middleware**: Sees no header, sets `req.discordUserId = null`, continues
3. **Route Handler**: Passes `null` as `discordUserId` to database query
4. **Database Query**: No user filter applied → Returns **ALL runs from ALL users**
5. **User**: Sees everyone's data

## The Fix

### 1. Updated Frontend Auth Methods

Changed from deprecated `auth.session()` to reading from localStorage:

**Before (Broken):**
```javascript
_getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };

    if (window.supabaseClient) {
        const session = window.supabaseClient.auth.session();  // ❌ Returns null
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    }

    return headers;
}
```

**After (Fixed):**
```javascript
_getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };

    try {
        // Get session from Supabase localStorage
        const storageKeys = Object.keys(localStorage).filter(key =>
            key.startsWith('sb-') && key.endsWith('-auth-token')
        );

        if (storageKeys.length > 0) {
            const sessionData = JSON.parse(localStorage.getItem(storageKeys[0]));
            if (sessionData?.access_token) {
                headers['Authorization'] = `Bearer ${sessionData.access_token}`;
                console.log('✅ Auth header added');
            }
        }
    } catch (error) {
        console.error('❌ Error getting auth headers:', error);
    }

    return headers;
}
```

### 2. Added Async Version for Supabase v2 API

Also added async method using the correct Supabase v2 API:

```javascript
async _getAuthHeadersAsync() {
    const headers = { 'Content-Type': 'application/json' };

    if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();  // ✅ Correct v2 API
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    }

    return headers;
}
```

### 3. Enforced User Filtering in Database

Updated `unifiedDatabase.js` to **reject queries without user ID**:

```javascript
async getRunsFromSupabase({ limit, offset, discordUserId }) {
    // CRITICAL SECURITY: Always require user ID for data isolation
    if (!discordUserId) {
        console.warn('⚠️ No user ID provided - returning empty array for security');
        return [];  // ✅ Return empty instead of all data
    }

    let query = this.supabase
        .from('tower_runs')
        .select('*')
        .eq('discord_user_id', discordUserId)  // ✅ Always filter by user
        .order('submitted_at', { ascending: false });

    // ... rest of query
}
```

### 4. Added Auth Middleware to All Routes

Ensured all Tower routes use authentication:

- ✅ `/api/tower/stats` - Already had auth
- ✅ `/api/tower/runs` - Already had auth
- ✅ `/api/tower/progress` - Already had auth
- ✅ `/api/tower/rates` - **Added auth middleware**
- ✅ `/api/tower/sessions` - **Added auth middleware**

## Files Modified

### Frontend (Auth Header Generation)
1. `public/js/dashboard/DashboardDataService.js`
   - Fixed `_getAuthHeaders()` to use localStorage
   - Added `_getAuthHeadersAsync()` for proper Supabase v2 API

2. `public/js/analytics-run-manager.js`
   - Fixed `_getAuthHeaders()` to use localStorage
   - Added `_getAuthHeadersAsync()` for proper Supabase v2 API

### Backend (Security Enforcement)
3. `server/database/unifiedDatabase.js`
   - Added check to reject queries without `discordUserId`
   - Changed from conditional filter to **mandatory filter**

4. `server/routes/tower/rates.js`
   - Added `authenticateUser` middleware

5. `server/routes/tower/sessions.js`
   - Added `authenticateUser` middleware

## Testing the Fix

### 1. Check Browser Console

After the fix, you should see these logs when loading data:

```
✅ Auth header added (from localStorage)
🔐 Including auth token in API request
🔐 Fetched 8 runs for user 273121779642400768
```

### 2. Check Network Tab

In DevTools → Network:
1. Click on any `/api/tower/runs` request
2. Go to "Headers" tab
3. Look for `Authorization: Bearer eyJ...` in Request Headers

### 3. Test User Isolation

1. Log in as User A
2. Submit some runs
3. Log out
4. Log in as User B
5. **User B should see 0 runs** (not User A's runs)

### 4. Check Server Logs

Server console should show:

```
🔐 Auth Check: { path: '/runs', hasAuth: true, ... }
✅ User authenticated: Username
   Discord ID: 273121779642400768
🔐 Fetched 8 runs for user 273121779642400768
```

## Why This Happened

1. **Supabase API Version Migration**: The project upgraded to Supabase v2 but didn't update auth code
2. **Silent Failure**: The old `auth.session()` method didn't throw an error, it just returned `null`
3. **Permissive Auth Middleware**: The middleware allowed requests to continue without authentication
4. **No Security Tests**: There were no automated tests to catch this regression

## Prevention

To prevent this in the future:

1. **Always test user isolation** when deploying auth changes
2. **Monitor console logs** for auth warnings
3. **Add automated tests** for user data isolation
4. **Use strict mode** for auth middleware (reject instead of allow)
5. **Add security audit** to deployment checklist

## Deployment Checklist

- [x] Fix auth header generation in frontend
- [x] Enforce user filtering in database layer
- [x] Add auth middleware to all routes
- [x] Clear user caches (emergency-cache-clear.js)
- [ ] Deploy to production
- [ ] Test with 2 different user accounts
- [ ] Verify Network tab shows Authorization header
- [ ] Verify server logs show user filtering
- [ ] Confirm each user sees only their own data

## Related Files

- `SECURITY_FIX_DATA_ISOLATION.md` - Previous cache isolation fix
- `public/js/emergency-cache-clear.js` - Cache cleanup script
- `server/middleware/auth.js` - Authentication middleware
