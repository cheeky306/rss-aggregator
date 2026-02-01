import { supabase, Article } from './supabase';
import { ProcessedArticle } from './ai-briefing';

// Get single article by ID
export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Failed to fetch article:', error);
    return null;
  }

  return data;
}

// Save articles to database (with AI summaries)
export async function saveArticles(
  articles: ProcessedArticle[]
): Promise<{ saved: number; errors: number }> {
  let saved = 0;
  let errors = 0;

  for (const article of articles) {
    const dbArticle: Omit<Article, 'id' | 'created_at'> = {
      title: article.title,
      url: article.url,
      source_name: article.sourceName,
      category: article.category,
      published_at: article.publishedAt.toISOString(),
      full_text: article.fullText,
      summary: article.summary,
      briefing: article.briefing,
      tags: article.tags,
      content_angles: article.contentAngles,
    };

    const { error } = await supabase.from('articles').upsert(dbArticle, {
      onConflict: 'url',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error(`Failed to save article: ${article.title}`, error);
      errors++;
    } else {
      saved++;
    }
  }

  return { saved, errors };
}

// Save articles WITHOUT AI processing (just basic info)
export async function saveArticlesWithoutAI(
  articles: { title: string; url: string; sourceName: string; category: string; publishedAt: Date; snippet: string }[]
): Promise<{ saved: number; errors: number }> {
  let saved = 0;
  let errors = 0;

  for (const article of articles) {
    const dbArticle = {
      title: article.title,
      url: article.url,
      source_name: article.sourceName,
      category: article.category,
      published_at: article.publishedAt.toISOString(),
      full_text: null,
      summary: article.snippet?.slice(0, 500) || null, // Use RSS snippet as basic summary
      briefing: null,
      tags: [],
      content_angles: [],
    };

    const { error } = await supabase.from('articles').upsert(dbArticle, {
      onConflict: 'url',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error(`Failed to save article: ${article.title}`, error);
      errors++;
    } else {
      saved++;
    }
  }

  return { saved, errors };
}

// Check if URL already exists
export async function articleExists(url: string): Promise<boolean> {
  const { data } = await supabase
    .from('articles')
    .select('id')
    .eq('url', url)
    .single();

  return !!data;
}

// Get count of articles processed today
export async function getArticleCountToday(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  return count || 0;
}

// Get articles with filters
export async function getArticles(options: {
  category?: string;
  source?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  favorites?: boolean;
  readLater?: boolean;
}): Promise<{ articles: Article[]; total: number }> {
  // Build the base query for both data and count
  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false });

  if (options.category && options.category.trim() !== '') {
    query = query.eq('category', options.category);
  }

  if (options.source && options.source.trim() !== '') {
    query = query.eq('source_name', options.source);
  }

  if (options.tags && options.tags.length > 0 && options.tags[0] !== '') {
    query = query.overlaps('tags', options.tags);
  }

  if (options.search && options.search.trim() !== '') {
    query = query.or(
      `title.ilike.%${options.search}%,summary.ilike.%${options.search}%,briefing.ilike.%${options.search}%`
    );
  }

  if (options.startDate) {
    query = query.gte('published_at', options.startDate.toISOString());
  }

  if (options.endDate) {
    query = query.lte('published_at', options.endDate.toISOString());
  }

  if (options.favorites) {
    query = query.eq('is_favorite', true);
  }

  if (options.readLater) {
    query = query.eq('is_read_later', true);
  }

  // Apply pagination
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch articles:', error);
    return { articles: [], total: 0 };
  }

  return { articles: data || [], total: count || 0 };
}

// Get source counts
export async function getSourceCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('articles').select('source_name');

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  data.forEach((row) => {
    counts[row.source_name] = (counts[row.source_name] || 0) + 1;
  });

  return counts;
}

// Get unique tags with counts
export async function getTagCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('articles').select('tags');

  if (error || !data) return {};

  const tagCounts: Record<string, number> = {};

  data.forEach((row) => {
    (row.tags || []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return tagCounts;
}

// Get article stats
export async function getStats(): Promise<{
  totalArticles: number;
  todayArticles: number;
  favoriteCount: number;
  readLaterCount: number;
  byCategory: Record<string, number>;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  const { count: todayArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('published_at', today.toISOString());

  const { count: favoriteCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_favorite', true);

  const { count: readLaterCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_read_later', true);

  const { data: categoryData } = await supabase
    .from('articles')
    .select('category');

  const byCategory: Record<string, number> = {};
  (categoryData || []).forEach((row) => {
    byCategory[row.category] = (byCategory[row.category] || 0) + 1;
  });

  return {
    totalArticles: totalArticles || 0,
    todayArticles: todayArticles || 0,
    favoriteCount: favoriteCount || 0,
    readLaterCount: readLaterCount || 0,
    byCategory,
  };
}

// ==================== DELETED URLS ====================

// Add URL to deleted list
export async function addDeletedUrl(url: string): Promise<void> {
  const { error } = await supabase
    .from('deleted_urls')
    .upsert({ url }, { onConflict: 'url', ignoreDuplicates: true });

  if (error) {
    console.error('Failed to add deleted URL:', error);
  }
}

// Check if URL is in deleted list
export async function isUrlDeleted(url: string): Promise<boolean> {
  const { data } = await supabase
    .from('deleted_urls')
    .select('id')
    .eq('url', url)
    .single();

  return !!data;
}

// Get all deleted URLs (for filtering)
export async function getDeletedUrls(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('deleted_urls')
    .select('url');

  if (error || !data) return new Set();

  return new Set(data.map(row => row.url));
}

// Clear deleted URLs (optional - if user wants to reset)
export async function clearDeletedUrls(): Promise<number> {
  const { data, error } = await supabase
    .from('deleted_urls')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    .select();

  if (error) {
    console.error('Failed to clear deleted URLs:', error);
    return 0;
  }

  return data?.length || 0;
}
