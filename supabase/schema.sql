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

-- Row Level Security (optional but recommended)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to articles" ON articles
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to sources" ON sources
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON articles TO service_role;
GRANT ALL ON sources TO service_role;
