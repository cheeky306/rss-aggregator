import Parser from 'rss-parser';
import { extract } from '@extractus/article-extractor';
import { feedSources, FeedSource } from './feeds';
import { fetchScrapedSources } from './scrapers';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; RSSAggregator/1.0)',
  },
});

export interface RawArticle {
  title: string;
  url: string;
  sourceName: string;
  category: FeedSource['category'];
  publishedAt: Date;
  snippet: string;
  fullText: string | null;
}

// Fetch articles from a single feed
async function fetchFeed(source: FeedSource): Promise<RawArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    
    return feed.items.map((item) => ({
      title: item.title || 'Untitled',
      url: item.link || '',
      sourceName: source.name,
      category: source.category,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      snippet: item.contentSnippet || item.content || '',
      fullText: null,
    }));
  } catch (error) {
    console.error(`Failed to fetch ${source.name}:`, error);
    return [];
  }
}

// Fetch all feeds in parallel
export async function fetchAllFeeds(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    feedSources.map((source) => fetchFeed(source))
  );

  const articles: RawArticle[] = [];
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  });

  // Also fetch from custom scrapers
  console.log('Fetching from custom scrapers...');
  const scrapedArticles = await fetchScrapedSources();
  console.log(`Scraped ${scrapedArticles.length} articles from custom sources`);
  articles.push(...scrapedArticles);

  return articles;
}

// Filter to last 24 hours (with option to include scraped articles that don't have dates)
export function filterRecentArticles(
  articles: RawArticle[],
  hoursAgo: number = 24
): RawArticle[] {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursAgo);

  return articles.filter((article) => {
    // Include scraped articles (they have current date as placeholder)
    // or articles within the time window
    const isRecent = article.publishedAt >= cutoff;
    const isScraped = article.sourceName === 'Artificial Analysis';
    return isRecent || isScraped;
  });
}

// Deduplicate by URL
export function deduplicateArticles(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
}

// Extract full article text
export async function extractFullText(url: string): Promise<string | null> {
  try {
    const article = await extract(url);
    return article?.content || null;
  } catch (error) {
    console.error(`Failed to extract text from ${url}:`, error);
    return null;
  }
}

// Process articles: fetch, filter, dedupe
export async function processFeeds(): Promise<RawArticle[]> {
  console.log('Fetching all feeds...');
  const allArticles = await fetchAllFeeds();
  console.log(`Fetched ${allArticles.length} total articles`);

  const recent = filterRecentArticles(allArticles, 24);
  console.log(`${recent.length} articles from last 24 hours`);

  const unique = deduplicateArticles(recent);
  console.log(`${unique.length} unique articles after deduplication`);

  // Sort by date, newest first
  unique.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return unique;
}
