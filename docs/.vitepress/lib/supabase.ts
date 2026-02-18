import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase URL and Anon Key must be set via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

export interface Article {
  id: string
  title: string
  url: string
  source_name: string
  category: string
  published_at: string
  full_text: string | null
  summary: string | null
  briefing: string | null
  tags: string[] | null
  content_angles: string[] | null
  is_favorite?: boolean
  is_read_later?: boolean
  created_at?: string
}
