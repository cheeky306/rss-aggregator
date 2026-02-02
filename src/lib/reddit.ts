// Reddit feed configuration

export const redditFeeds = [
  // SEO
  { subreddit: 'SEO', category: 'seo' },
  { subreddit: 'bigseo', category: 'seo' },
  { subreddit: 'TechSEO', category: 'seo' },
  { subreddit: 'localseo', category: 'seo' },
  
  // Tech & Privacy
  { subreddit: 'duckduckgo', category: 'tech' },
  { subreddit: 'google', category: 'tech' },
  { subreddit: 'Technology', category: 'tech' },
  { subreddit: 'technews', category: 'tech' },
  { subreddit: 'techsupport', category: 'tech' },
  { subreddit: 'privacy', category: 'tech' },
  
  // Web Development
  { subreddit: 'Wordpress', category: 'webdev' },
  { subreddit: 'web_design', category: 'webdev' },
  { subreddit: 'webdev', category: 'webdev' },
  { subreddit: 'userexperience', category: 'webdev' },
  { subreddit: 'css', category: 'webdev' },
  
  // Programming
  { subreddit: 'programming', category: 'programming' },
  { subreddit: 'learnprogramming', category: 'programming' },
  { subreddit: 'javascript', category: 'programming' },
  { subreddit: 'PHP', category: 'programming' },
  { subreddit: 'Python', category: 'programming' },
  
  // Business
  { subreddit: 'smallbusiness', category: 'business' },
  { subreddit: 'Entrepreneur', category: 'business' },
  { subreddit: 'startups', category: 'business' },
  { subreddit: 'GrowthHacking', category: 'business' },
  { subreddit: 'SaaS', category: 'business' },
];

export const redditCategoryLabels: Record<string, string> = {
  seo: '🔍 SEO',
  tech: '💻 Tech & Privacy',
  webdev: '🌐 Web Development',
  programming: '👨‍💻 Programming',
  business: '💼 Business & Startups',
};

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  permalink: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext: string;
  is_self: boolean;
  thumbnail: string;
  category: string;
}

export async function fetchRedditPosts(subreddit: string, category: string, limit: number = 10): Promise<RedditPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          'User-Agent': 'TillysJournal/1.0',
        },
        next: { revalidate: 1800 }, // Cache for 30 minutes
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const posts: RedditPost[] = data.data.children
      .filter((child: any) => !child.data.stickied) // Skip pinned posts
      .map((child: any) => ({
        id: child.data.id,
        title: child.data.title,
        url: child.data.url,
        permalink: `https://reddit.com${child.data.permalink}`,
        subreddit: child.data.subreddit,
        author: child.data.author,
        score: child.data.score,
        num_comments: child.data.num_comments,
        created_utc: child.data.created_utc,
        selftext: child.data.selftext?.slice(0, 500) || '',
        is_self: child.data.is_self,
        thumbnail: child.data.thumbnail,
        category,
      }));

    return posts;
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error);
    return [];
  }
}

export async function fetchAllRedditFeeds(): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = [];
  
  // Fetch in batches to avoid rate limiting
  for (const feed of redditFeeds) {
    const posts = await fetchRedditPosts(feed.subreddit, feed.category, 5);
    allPosts.push(...posts);
    // Small delay to be nice to Reddit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Sort by score (popularity)
  allPosts.sort((a, b) => b.score - a.score);

  return allPosts;
}
