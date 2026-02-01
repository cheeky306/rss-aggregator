-- Add read_later and favorite columns to articles table
-- Run this in Supabase SQL Editor

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_read_later BOOLEAN DEFAULT FALSE;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_articles_favorite ON articles(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_articles_read_later ON articles(is_read_later) WHERE is_read_later = TRUE;
