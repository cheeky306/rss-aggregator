-- Create deleted_urls table to track articles the user has deleted
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS deleted_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_deleted_urls_url ON deleted_urls(url);

-- Row Level Security
ALTER TABLE deleted_urls ENABLE ROW LEVEL SECURITY;

-- Anon can only read (service_role inserts via scripts, bypasses RLS)
CREATE POLICY "Allow public read access to deleted_urls" ON deleted_urls
  FOR SELECT USING (true);

GRANT SELECT ON deleted_urls TO anon;
