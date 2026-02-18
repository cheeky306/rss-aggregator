import { getSupabase, type Article } from './supabase'

export interface FetchOptions {
  category?: string
  source?: string
  search?: string
  startDate?: Date
  endDate?: Date
  favorites?: boolean
  readLater?: boolean
  limit?: number
  offset?: number
}

function sanitizeSearchInput(input: string): string {
  // Strip PostgREST special characters that could manipulate filter logic
  return input.replace(/[,.()"\\]/g, '').trim()
}

export async function getArticles(options: FetchOptions = {}): Promise<{ articles: Article[]; total: number }> {
  let query = getSupabase()
    .from('articles')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })

  if (options.category) {
    query = query.eq('category', options.category)
  }
  if (options.source) {
    query = query.eq('source_name', options.source)
  }
  if (options.search) {
    const sanitized = sanitizeSearchInput(options.search)
    if (sanitized) {
      query = query.or(
        `title.ilike.%${sanitized}%,summary.ilike.%${sanitized}%,briefing.ilike.%${sanitized}%`
      )
    }
  }
  if (options.startDate) {
    query = query.gte('published_at', options.startDate.toISOString())
  }
  if (options.endDate) {
    query = query.lte('published_at', options.endDate.toISOString())
  }
  if (options.favorites) {
    query = query.eq('is_favorite', true)
  }
  if (options.readLater) {
    query = query.eq('is_read_later', true)
  }

  const limit = options.limit || 20
  const offset = options.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to fetch articles:', error)
    return { articles: [], total: 0 }
  }

  return { articles: data || [], total: count || 0 }
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await getSupabase()
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

export async function getStats(): Promise<{
  totalArticles: number
  todayArticles: number
  favoriteCount: number
  readLaterCount: number
  byCategory: Record<string, number>
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalRes, todayRes, favRes, rlRes, catRes] = await Promise.all([
    getSupabase().from('articles').select('*', { count: 'exact', head: true }),
    getSupabase().from('articles').select('*', { count: 'exact', head: true }).gte('published_at', today.toISOString()),
    getSupabase().from('articles').select('*', { count: 'exact', head: true }).eq('is_favorite', true),
    getSupabase().from('articles').select('*', { count: 'exact', head: true }).eq('is_read_later', true),
    getSupabase().from('articles').select('category'),
  ])

  const byCategory: Record<string, number> = {}
  ;(catRes.data || []).forEach((row: { category: string }) => {
    byCategory[row.category] = (byCategory[row.category] || 0) + 1
  })

  return {
    totalArticles: totalRes.count || 0,
    todayArticles: todayRes.count || 0,
    favoriteCount: favRes.count || 0,
    readLaterCount: rlRes.count || 0,
    byCategory,
  }
}

export async function getSourceCounts(): Promise<Record<string, number>> {
  const { data, error } = await getSupabase().from('articles').select('source_name')
  if (error || !data) return {}

  const counts: Record<string, number> = {}
  data.forEach((row: { source_name: string }) => {
    counts[row.source_name] = (counts[row.source_name] || 0) + 1
  })
  return counts
}

export async function toggleFavorite(id: string, current: boolean): Promise<boolean> {
  const { error } = await getSupabase()
    .from('articles')
    .update({ is_favorite: !current })
    .eq('id', id)

  if (error) {
    console.error('Failed to toggle favorite:', error)
    return current
  }
  return !current
}

export async function toggleReadLater(id: string, current: boolean): Promise<boolean> {
  const { error } = await getSupabase()
    .from('articles')
    .update({ is_read_later: !current })
    .eq('id', id)

  if (error) {
    console.error('Failed to toggle read later:', error)
    return current
  }
  return !current
}

export async function deleteArticle(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('articles').delete().eq('id', id)
  if (error) {
    console.error('Failed to delete article:', error)
    return false
  }
  return true
}
