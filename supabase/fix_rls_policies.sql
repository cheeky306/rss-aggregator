-- Fix RLS Policies Migration
-- Run this in Supabase SQL Editor to fix the live database.
--
-- Problem: existing policies use FOR ALL USING (true), which lets anyone
-- with the anon key INSERT, UPDATE, and DELETE all data.
--
-- Fix: drop the wide-open policies and replace with least-privilege:
--   - articles: anon can SELECT, UPDATE (favorites/read-later), DELETE
--   - articles: only service_role can INSERT (bypasses RLS automatically)
--   - sources: anon can only SELECT
--   - deleted_urls: enable RLS + anon can only SELECT

BEGIN;

-- ============================================================
-- articles
-- ============================================================

-- Drop the old wide-open policy
DROP POLICY IF EXISTS "Service role has full access to articles" ON articles;

-- Anon can read all articles
CREATE POLICY "Allow public read access to articles" ON articles
  FOR SELECT USING (true);

-- Anon can update articles (for toggling favorites / read-later)
CREATE POLICY "Allow public update of articles" ON articles
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Anon can delete articles
CREATE POLICY "Allow public delete of articles" ON articles
  FOR DELETE USING (true);

-- No INSERT policy for anon — insert is denied by default with RLS enabled.
-- service_role bypasses RLS, so the digest scripts still work.

-- Tighten grants: remove INSERT for anon
REVOKE ALL ON articles FROM anon;
GRANT SELECT, UPDATE, DELETE ON articles TO anon;

-- ============================================================
-- sources
-- ============================================================

-- Drop the old wide-open policy
DROP POLICY IF EXISTS "Service role has full access to sources" ON sources;

-- Anon can only read sources
CREATE POLICY "Allow public read access to sources" ON sources
  FOR SELECT USING (true);

REVOKE ALL ON sources FROM anon;
GRANT SELECT ON sources TO anon;

-- ============================================================
-- deleted_urls
-- ============================================================

-- Enable RLS (was missing entirely)
ALTER TABLE deleted_urls ENABLE ROW LEVEL SECURITY;

-- Anon can only read
CREATE POLICY "Allow public read access to deleted_urls" ON deleted_urls
  FOR SELECT USING (true);

REVOKE ALL ON deleted_urls FROM anon;
GRANT SELECT ON deleted_urls TO anon;

COMMIT;
