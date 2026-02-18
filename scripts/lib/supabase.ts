import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Article {
  id: string;
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
  is_favorite?: boolean;
  is_read_later?: boolean;
  created_at?: string;
}
