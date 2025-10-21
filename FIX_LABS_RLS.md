# Fix Labs Data Isolation - Apply RLS Policies

## The Problem

You're seeing another user's labs because the Row Level Security (RLS) policies haven't been applied to the `user_labs` table in your Supabase database.

The error: **406 Not Acceptable** when trying to load labs.

## The Solution

Apply the RLS policies to your Supabase database by running the SQL migration.

### Step-by-Step Instructions

#### 1. Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project (`kktvmpwxfyevkgotppah`)
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

#### 2. Run the RLS Policy SQL

Copy and paste this EXACT SQL into the editor:

```sql
-- Fix RLS policies for user_labs to work with Discord OAuth
-- Users must be authenticated via Supabase Discord OAuth to access labs

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Users can insert their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Users can update their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Authenticated users can view their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Authenticated users can insert their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Authenticated users can update their own labs" ON public.user_labs;

-- Create policies that require authentication and match Discord user ID
-- auth.jwt() -> 'user_metadata' ->> 'provider_id' contains the Discord user ID from OAuth
CREATE POLICY "Authenticated users can view their own labs"
    ON public.user_labs
    FOR SELECT
    TO authenticated
    USING (
        discord_user_id = (auth.jwt() -> 'user_metadata' ->> 'provider_id')
    );

CREATE POLICY "Authenticated users can insert their own labs"
    ON public.user_labs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        discord_user_id = (auth.jwt() -> 'user_metadata' ->> 'provider_id')
    );

CREATE POLICY "Authenticated users can update their own labs"
    ON public.user_labs
    FOR UPDATE
    TO authenticated
    USING (
        discord_user_id = (auth.jwt() -> 'user_metadata' ->> 'provider_id')
    )
    WITH CHECK (
        discord_user_id = (auth.jwt() -> 'user_metadata' ->> 'provider_id')
    );
```

#### 3. Execute the Query

1. Click the **Run** button (or press `Ctrl+Enter`)
2. You should see: "Success. No rows returned"

#### 4. Verify RLS is Enabled

Run this query to check if RLS is enabled on the table:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_labs';
```

Expected result:
- `rowsecurity` should be `true`

If it's `false`, run this:

```sql
ALTER TABLE public.user_labs ENABLE ROW LEVEL SECURITY;
```

#### 5. Verify the Policies Were Created

Run this to list all policies:

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_labs';
```

You should see 3 policies:
- `Authenticated users can view their own labs` (SELECT)
- `Authenticated users can insert their own labs` (INSERT)
- `Authenticated users can update their own labs` (UPDATE)

### After Applying the Fix

1. **Hard refresh** your browser (`Ctrl+Shift+R`)
2. **Log in** with each account
3. Each user should now see:
   - ✅ Only their own labs
   - ✅ No 406 errors in console
   - ✅ Ability to save their own labs

### What These Policies Do

1. **SELECT policy**: Users can only VIEW labs where `discord_user_id` matches their Discord ID from OAuth
2. **INSERT policy**: Users can only CREATE labs with their own Discord ID
3. **UPDATE policy**: Users can only UPDATE labs that belong to them

The policies extract the Discord ID from the JWT token using:
```sql
auth.jwt() -> 'user_metadata' ->> 'provider_id'
```

This matches the Discord user ID that Supabase stores when you log in with Discord OAuth.

### Troubleshooting

**If you still see 406 errors:**

1. Check that RLS is enabled:
   ```sql
   ALTER TABLE public.user_labs ENABLE ROW LEVEL SECURITY;
   ```

2. Verify the policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_labs';
   ```

3. Check if the logged-in user has the Discord ID in their JWT:
   - Open browser console
   - Run:
     ```javascript
     window.discordAuth.user.user_metadata.provider_id
     ```
   - This should show your Discord ID (e.g., `1290706045395796060`)

4. Test the policy manually in Supabase SQL Editor:
   ```sql
   SET LOCAL request.jwt.claims TO '{
     "sub": "test-user-id",
     "user_metadata": {
       "provider_id": "1290706045395796060"
     }
   }';

   SELECT * FROM user_labs WHERE discord_user_id = '1290706045395796060';
   ```

**If you need to check what data exists:**

```sql
-- See all labs (requires admin access or run in SQL editor)
SELECT discord_user_id, created_at, updated_at
FROM user_labs
ORDER BY updated_at DESC;
```

## Summary

The tower runs are now properly isolated (0 runs showing). Once you apply these RLS policies, the labs will also be properly isolated per user.

This is the last piece needed for complete user data isolation! 🔒
