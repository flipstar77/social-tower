-- Video AI Feature Database Schema
-- Creates tables for video uploads, clips, and AI analysis
-- Run this on your Supabase database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- VIDEO UPLOADS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS video_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File information
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,

  -- Video metadata
  duration NUMERIC,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  fps NUMERIC,
  codec TEXT,

  -- Processing status
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_uploads_user_id ON video_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON video_uploads(status);
CREATE INDEX IF NOT EXISTS idx_video_uploads_created_at ON video_uploads(created_at DESC);

-- ===========================
-- VIDEO CLIPS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS video_clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES video_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Clip timing
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,

  -- AI-generated content
  title TEXT NOT NULL,
  summary TEXT,
  reasoning TEXT,
  transcript_stub TEXT,

  -- Metrics
  virality_score INTEGER CHECK (virality_score >= 0 AND virality_score <= 100),
  tags TEXT[],

  -- Storage
  storage_path TEXT,
  thumbnail_path TEXT,

  -- Vector embedding for semantic search
  embedding vector(768),

  -- User interaction
  is_favorite BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_clips_video_id ON video_clips(video_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_user_id ON video_clips(user_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_virality_score ON video_clips(virality_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_clips_created_at ON video_clips(created_at DESC);

-- Vector similarity search index (if pgvector is enabled)
-- CREATE INDEX IF NOT EXISTS idx_video_clips_embedding ON video_clips USING ivfflat (embedding vector_cosine_ops);

-- ===========================
-- COMMENT ANALYSIS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS video_comment_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES video_uploads(id) ON DELETE CASCADE,

  -- Analysis results
  sentiment TEXT CHECK (sentiment IN ('Positive', 'Negative', 'Neutral', 'Mixed')),
  summary TEXT,
  key_topics TEXT[],
  viewer_requests TEXT[],
  content_suggestions TEXT[],

  -- Source comments
  comments_analyzed INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_comment_analysis_video_id ON video_comment_analysis(video_id);

-- ===========================
-- VIDEO TRANSCRIPTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS video_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES video_uploads(id) ON DELETE CASCADE,

  -- Transcript segments
  segments JSONB NOT NULL, -- Array of {startTime, endTime, text}

  -- Full text for search
  full_text TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_video_transcripts_video_id ON video_transcripts(video_id);
CREATE INDEX IF NOT EXISTS idx_video_transcripts_full_text ON video_transcripts USING gin(to_tsvector('english', full_text));

-- ===========================
-- ROW LEVEL SECURITY (RLS)
-- ===========================

-- Enable RLS on all tables
ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;

-- Video Uploads Policies
CREATE POLICY "Users can view their own uploads"
  ON video_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON video_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads"
  ON video_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
  ON video_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Video Clips Policies
CREATE POLICY "Users can view their own clips"
  ON video_clips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert clips for their videos"
  ON video_clips FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM video_uploads WHERE id = video_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update their own clips"
  ON video_clips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clips"
  ON video_clips FOR DELETE
  USING (auth.uid() = user_id);

-- Comment Analysis Policies
CREATE POLICY "Users can view analysis for their videos"
  ON video_comment_analysis FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM video_uploads WHERE id = video_id AND user_id = auth.uid())
  );

CREATE POLICY "Service role can insert analysis"
  ON video_comment_analysis FOR INSERT
  WITH CHECK (true);

-- Transcript Policies
CREATE POLICY "Users can view transcripts for their videos"
  ON video_transcripts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM video_uploads WHERE id = video_id AND user_id = auth.uid())
  );

CREATE POLICY "Service role can insert transcripts"
  ON video_transcripts FOR INSERT
  WITH CHECK (true);

-- ===========================
-- STORAGE BUCKET SETUP
-- ===========================

-- Create storage bucket for videos (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('tower-videos', 'tower-videos', false);

-- Storage policies for tower-videos bucket
-- CREATE POLICY "Users can upload their own videos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'tower-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own videos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'tower-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own videos"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'tower-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===========================
-- HELPER FUNCTIONS
-- ===========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_video_uploads_updated_at
  BEFORE UPDATE ON video_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_clips_updated_at
  BEFORE UPDATE ON video_clips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-delete old uploads (optional, run via cron job)
CREATE OR REPLACE FUNCTION delete_old_video_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM video_uploads
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND status = 'completed';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- INITIAL DATA / SEED
-- ===========================

-- Add any initial data if needed
-- (None required for this feature)

-- ===========================
-- VIEWS (Optional)
-- ===========================

-- View for user's video statistics
CREATE OR REPLACE VIEW user_video_stats AS
SELECT
  u.user_id,
  COUNT(DISTINCT u.id) as total_videos,
  COUNT(DISTINCT c.id) as total_clips,
  AVG(c.virality_score) as avg_virality_score,
  SUM(u.file_size) as total_storage_used,
  SUM(u.duration) as total_duration
FROM video_uploads u
LEFT JOIN video_clips c ON u.id = c.video_id
GROUP BY u.user_id;

-- ===========================
-- COMMENTS
-- ===========================

COMMENT ON TABLE video_uploads IS 'Stores uploaded video files and metadata';
COMMENT ON TABLE video_clips IS 'AI-detected viral clips from uploaded videos';
COMMENT ON TABLE video_comment_analysis IS 'AI analysis of video comments';
COMMENT ON TABLE video_transcripts IS 'Generated transcripts for videos';

-- Schema creation complete!
-- Next steps:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. Create the 'tower-videos' storage bucket in Supabase dashboard
-- 3. Configure bucket policies for user access
-- 4. Test with sample video upload
