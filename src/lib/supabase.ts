import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types for our database
export interface Article {
  id?: string;
  title: string;
  url: string;
  source_name: string;
  category: string;
  published_at: string;
  full_text: string | null;
  summary: string | null;
  briefing: string | null;
  tags: string[] | null;
  content_angles: string[] | null;
  created_at?: string;
}

export interface Source {
  id?: string;
  name: string;
  feed_url: string;
  category: string;
  active: boolean;
  created_at?: string;
}
