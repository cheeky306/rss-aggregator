-- RSS Aggregator Database Schema
-- Run this in your Supabase SQL Editor

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  full_text TEXT,
  summary TEXT,
  briefing TEXT,
  tags TEXT[] DEFAULT '{}',
  content_angles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles 
USING GIN(to_tsvector('english', title || ' ' || COALESCE(briefing, '')));

-- Sources table (optional, for managing feeds via UI later)
CREATE TABLE IF NOT EXISTS sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  feed_url TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Note: service_role bypasses RLS automatically, no policy needed for it.
-- These policies control access for anon (public) and authenticated users.

-- Articles: anon can read, update (favorites/read-later), and delete
CREATE POLICY "Allow public read access to articles" ON articles
  FOR SELECT USING (true);

CREATE POLICY "Allow public update of articles" ON articles
  FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete of articles" ON articles
  FOR DELETE USING (true);

-- Articles: only service_role can insert (via digest scripts)
-- No INSERT policy for anon = insert is denied by default with RLS enabled.

-- Sources: read-only for anon
CREATE POLICY "Allow public read access to sources" ON sources
  FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT, UPDATE, DELETE ON articles TO anon;
GRANT SELECT ON sources TO anon;
