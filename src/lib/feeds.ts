// RSS Feed Sources Configuration
// Add, remove, or modify feeds as needed

export interface FeedSource {
  name: string;
  url: string;
  category: 'ai' | 'seo' | 'tech' | 'marketing';
}

export const feedSources: FeedSource[] = [
  // AI News
  {
    name: 'MIT Technology Review - AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    category: 'ai',
  },
  {
    name: 'The Verge - AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    category: 'ai',
  },
  {
    name: 'Ars Technica - AI',
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    category: 'ai',
  },
  {
    name: 'VentureBeat - AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'ai',
  },
  {
    name: 'AI News',
    url: 'https://www.artificialintelligence-news.com/feed/',
    category: 'ai',
  },
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    category: 'ai',
  },
  {
    name: 'Anthropic News',
    url: 'https://www.anthropic.com/rss.xml',
    category: 'ai',
  },
  {
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    category: 'ai',
  },
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    category: 'ai',
  },

  // SEO & Search
  {
    name: 'Search Engine Journal',
    url: 'https://www.searchenginejournal.com/feed/',
    category: 'seo',
  },
  {
    name: 'Search Engine Land',
    url: 'https://searchengineland.com/feed',
    category: 'seo',
  },
  {
    name: 'Moz Blog',
    url: 'https://moz.com/feeds/blog',
    category: 'seo',
  },
  {
    name: 'Ahrefs Blog',
    url: 'https://ahrefs.com/blog/feed/',
    category: 'seo',
  },
  {
    name: 'Search Engine Roundtable',
    url: 'https://www.seroundtable.com/feed',
    category: 'seo',
  },

  // General Tech
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'tech',
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
  },
  {
    name: 'Hacker News - Best',
    url: 'https://hnrss.org/best',
    category: 'tech',
  },

  // Marketing
  {
    name: 'Marketing Week',
    url: 'https://www.marketingweek.com/feed/',
    category: 'marketing',
  },
  {
    name: 'HubSpot Blog',
    url: 'https://blog.hubspot.com/marketing/rss.xml',
    category: 'marketing',
  },
];

export const categoryLabels: Record<FeedSource['category'], string> = {
  ai: '🤖 AI & Machine Learning',
  seo: '🔍 SEO & Search',
  tech: '💻 Tech News',
  marketing: '📈 Marketing',
};
