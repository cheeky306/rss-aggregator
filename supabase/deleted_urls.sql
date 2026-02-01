-- Create deleted_urls table to track articles the user has deleted
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS deleted_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_deleted_urls_url ON deleted_urls(url);
