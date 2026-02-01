import { supabase, Article } from './supabase';
import { ProcessedArticle } from './ai-briefing';

// Save articles to database
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

// Check if URL already exists
export async function articleExists(url: string): Promise<boolean> {
  const { data } = await supabase
    .from('articles')
    .select('id')
    .eq('url', url)
    .single();

  return !!data;
}

// Get articles with filters
export async function getArticles(options: {
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false });

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.tags && options.tags.length > 0) {
    query = query.overlaps('tags', options.tags);
  }

  if (options.search) {
    query = query.or(
      `title.ilike.%${options.search}%,briefing.ilike.%${options.search}%`
    );
  }

  if (options.startDate) {
    query = query.gte('published_at', options.startDate.toISOString());
  }

  if (options.endDate) {
    query = query.lte('published_at', options.endDate.toISOString());
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }

  return data || [];
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
    byCategory,
  };
}
