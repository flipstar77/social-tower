-- =============================================================================
-- RLS POLICY FIX FOR TOWER_RUNS
-- =============================================================================
-- Run this SQL directly in your Supabase SQL Editor
-- This adds the missing DELETE policy for tower_runs table
-- =============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can delete tower_runs" ON tower_runs;

-- Add DELETE policy for service role (backend)
CREATE POLICY "Service role can delete tower_runs" ON tower_runs
    FOR DELETE
    USING (auth.role() = 'service_role');

-- Verify policies are working
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'tower_runs'
ORDER BY cmd;
