import { supabase, Article } from './supabase';
import { ProcessedArticle } from './ai-briefing';

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
      summary: article.snippet?.slice(0, 500) || null,
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

export async function articleExists(url: string): Promise<boolean> {
  const { data } = await supabase
    .from('articles')
    .select('id')
    .eq('url', url)
    .single();
  return !!data;
}

export async function getArticleCountToday(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  return count || 0;
}

export async function getDeletedUrls(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('deleted_urls')
    .select('url');

  if (error || !data) return new Set();
  return new Set(data.map(row => row.url));
}
