// RSS Feed Sources Configuration
// Add, remove, or modify feeds as needed

export interface FeedSource {
  name: string;
  url: string;
  category: 'ai' | 'agents' | 'seo' | 'tech' | 'marketing';
}

export const feedSources: FeedSource[] = [
  // AI Agents & Autonomous Systems
  {
    name: 'LangChain Blog',
    url: 'https://blog.langchain.dev/rss/',
    category: 'agents',
  },
  {
    name: 'LlamaIndex Blog',
    url: 'https://www.llamaindex.ai/blog/rss.xml',
    category: 'agents',
  },
  {
    name: 'AutoGPT Blog',
    url: 'https://news.agpt.co/feed/',
    category: 'agents',
  },
  {
    name: 'Crew AI Blog',
    url: 'https://www.crewai.com/blog/rss.xml',
    category: 'agents',
  },
  {
    name: 'AI Agent News (Reddit)',
    url: 'https://www.reddit.com/r/AI_Agents/.rss',
    category: 'agents',
  },
  {
    name: 'AutoGPT Reddit',
    url: 'https://www.reddit.com/r/AutoGPT/.rss',
    category: 'agents',
  },
  {
    name: 'LangChain Reddit',
    url: 'https://www.reddit.com/r/LangChain/.rss',
    category: 'agents',
  },
  {
    name: 'LocalLLaMA Reddit',
    url: 'https://www.reddit.com/r/LocalLLaMA/.rss',
    category: 'agents',
  },
  {
    name: 'Fixie AI Blog',
    url: 'https://www.fixie.ai/blog/rss.xml',
    category: 'agents',
  },
  {
    name: 'E2B Blog',
    url: 'https://e2b.dev/blog/rss.xml',
    category: 'agents',
  },
  {
    name: 'Lindy AI Blog',
    url: 'https://www.lindy.ai/blog/rss.xml',
    category: 'agents',
  },
  {
    name: 'AI Snake Oil',
    url: 'https://aisnakeoil.substack.com/feed',
    category: 'agents',
  },
  {
    name: 'Ahead of AI (Sebastian Raschka)',
    url: 'https://magazine.sebastianraschka.com/feed',
    category: 'agents',
  },
  {
    name: 'AIModels.fyi',
    url: 'https://aimodels.substack.com/feed',
    category: 'agents',
  },

  // AI News (General)
  {
    name: 'The Rundown AI',
    url: 'https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml',
    category: 'ai',
  },
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
    name: 'Google Keyword (All)',
    url: 'https://blog.google/rss/',
    category: 'tech',
  },
  {
    name: 'Google Gemini',
    url: 'https://blog.google/products/gemini/rss/',
    category: 'ai',
  },
  {
    name: 'Google DeepMind Blog',
    url: 'https://blog.google/technology/google-deepmind/rss/',
    category: 'ai',
  },
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    category: 'ai',
  },
  {
    name: 'Meta AI Blog',
    url: 'https://ai.meta.com/blog/rss/',
    category: 'ai',
  },
  {
    name: 'Microsoft AI Blog',
    url: 'https://blogs.microsoft.com/ai/feed/',
    category: 'ai',
  },
  {
    name: 'DeepMind Blog',
    url: 'https://deepmind.google/blog/rss.xml',
    category: 'ai',
  },
  {
    name: 'Cohere Blog',
    url: 'https://cohere.com/blog/rss.xml',
    category: 'ai',
  },
  {
    name: 'Mistral AI Blog',
    url: 'https://mistral.ai/feed.xml',
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
  {
    name: 'Semrush Blog',
    url: 'https://www.semrush.com/blog/feed/',
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
  agents: '🤖 AI Agents',
  ai: '🧠 AI & ML',
  seo: '🔍 SEO & Search',
  tech: '💻 Tech News',
  marketing: '📈 Marketing',
};
