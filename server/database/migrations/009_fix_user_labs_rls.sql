-- Fix RLS policies for user_labs to work with Discord OAuth
-- Users must be authenticated via Supabase Discord OAuth to access labs

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Users can insert their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Users can update their own labs" ON public.user_labs;

-- Drop any other policies that might exist
DROP POLICY IF EXISTS "Authenticated users can view their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Authenticated users can insert their own labs" ON public.user_labs;
DROP POLICY IF EXISTS "Authenticated users can update their own labs" ON public.user_labs;

-- Create policies that require authentication and match Discord user ID
-- auth.uid() returns the Supabase user ID (must be authenticated)
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
