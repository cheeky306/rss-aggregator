// Custom scrapers for sites without RSS feeds

import { RawArticle } from './rss-fetcher';

interface ScrapedSource {
  name: string;
  url: string;
  category: 'ai' | 'agents' | 'seo' | 'tech' | 'marketing';
  scraper: () => Promise<RawArticle[]>;
}

// Artificial Analysis scraper
async function scrapeArtificialAnalysis(): Promise<RawArticle[]> {
  try {
    const response = await fetch('https://artificialanalysis.ai/articles', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSSAggregator/1.0)',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Artificial Analysis:', response.status);
      return [];
    }

    const html = await response.text();
    const articles: RawArticle[] = [];

    // Extract article links and titles using regex
    // Looking for pattern: href="/articles/[slug]" followed by title in h2
    const articlePattern = /<a[^>]*href="(\/articles\/[^"]+)"[^>]*>[\s\S]*?<h2[^>]*>([^<]+)<\/h2>/gi;
    
    let match;
    while ((match = articlePattern.exec(html)) !== null) {
      const slug = match[1];
      const title = match[2].trim();
      
      if (slug && title) {
        articles.push({
          title,
          url: `https://artificialanalysis.ai${slug}`,
          sourceName: 'Artificial Analysis',
          category: 'agents',
          publishedAt: new Date(), // They don't show dates clearly, use current
          snippet: '',
          fullText: null,
        });
      }
    }

    // Alternative pattern for their card structure
    if (articles.length === 0) {
      // Try a simpler pattern
      const linkPattern = /href="(\/articles\/([^"]+))"/gi;
      const titlePattern = /## ([^\n]+)/gi;
      
      const links: string[] = [];
      const titles: string[] = [];
      
      let linkMatch;
      while ((linkMatch = linkPattern.exec(html)) !== null) {
        if (!links.includes(linkMatch[1])) {
          links.push(linkMatch[1]);
        }
      }
      
      let titleMatch;
      while ((titleMatch = titlePattern.exec(html)) !== null) {
        titles.push(titleMatch[1].trim());
      }
      
      // Match links with titles
      for (let i = 0; i < Math.min(links.length, titles.length); i++) {
        articles.push({
          title: titles[i],
          url: `https://artificialanalysis.ai${links[i]}`,
          sourceName: 'Artificial Analysis',
          category: 'agents',
          publishedAt: new Date(),
          snippet: '',
          fullText: null,
        });
      }
    }

    console.log(`Scraped ${articles.length} articles from Artificial Analysis`);
    return articles.slice(0, 10); // Limit to 10 most recent
  } catch (error) {
    console.error('Error scraping Artificial Analysis:', error);
    return [];
  }
}

// List of custom scraped sources
export const scrapedSources: ScrapedSource[] = [
  {
    name: 'Artificial Analysis',
    url: 'https://artificialanalysis.ai/articles',
    category: 'agents',
    scraper: scrapeArtificialAnalysis,
  },
];

// Fetch all scraped sources
export async function fetchScrapedSources(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    scrapedSources.map((source) => source.scraper())
  );

  const articles: RawArticle[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    } else {
      console.error(`Failed to scrape ${scrapedSources[index].name}:`, result.reason);
    }
  });

  return articles;
}
