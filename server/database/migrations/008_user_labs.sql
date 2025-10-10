-- Migration: Create user_labs table for storing user lab levels
-- This table stores the research lab levels for each user

CREATE TABLE IF NOT EXISTS public.user_labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_user_id TEXT NOT NULL UNIQUE,
    labs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by discord_user_id
CREATE INDEX IF NOT EXISTS idx_user_labs_discord_user_id ON public.user_labs(discord_user_id);

-- Enable Row Level Security
ALTER TABLE public.user_labs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own labs
CREATE POLICY "Users can view their own labs"
    ON public.user_labs
    FOR SELECT
    USING (discord_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policy to allow users to insert their own labs
CREATE POLICY "Users can insert their own labs"
    ON public.user_labs
    FOR INSERT
    WITH CHECK (discord_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policy to allow users to update their own labs
CREATE POLICY "Users can update their own labs"
    ON public.user_labs
    FOR UPDATE
    USING (discord_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (discord_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_labs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_labs_updated_at_trigger
    BEFORE UPDATE ON public.user_labs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_labs_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_labs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_labs TO anon;
