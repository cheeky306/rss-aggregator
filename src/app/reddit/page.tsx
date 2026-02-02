import { Suspense } from 'react';
import { fetchAllRedditFeeds, redditFeeds, redditCategoryLabels, fetchRedditPosts, RedditPost } from '@/lib/reddit';
import { DashboardLayout } from '@/components/DashboardLayout';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

function getTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const seconds = Math.floor(now - timestamp);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
}

const categoryColors: Record<string, string> = {
  seo: 'bg-green-100 text-green-700 border-green-200',
  tech: 'bg-blue-100 text-blue-700 border-blue-200',
  webdev: 'bg-purple-100 text-purple-700 border-purple-200',
  programming: 'bg-orange-100 text-orange-700 border-orange-200',
  business: 'bg-amber-100 text-amber-700 border-amber-200',
};

function RedditPostCard({ post }: { post: RedditPost }) {
  const colors = categoryColors[post.category] || categoryColors.tech;

  return (
    <div className="py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex gap-3">
        {/* Vote count */}
        <div className="flex-shrink-0 w-12 text-center">
          <div className="text-lg font-semibold text-orange-500">{formatScore(post.score)}</div>
          <div className="text-xs text-gray-400">votes</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2 leading-snug"
          >
            {post.title}
          </a>

          {/* Preview text for self posts */}
          {post.is_self && post.selftext && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {post.selftext}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
            <span className={`px-2 py-0.5 rounded border ${colors}`}>
              {redditCategoryLabels[post.category]?.replace(/[^\w\s&]/g, '').trim() || post.category}
            </span>
            <span className="text-orange-500 font-medium">r/{post.subreddit}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">u/{post.author}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{getTimeAgo(post.created_utc)}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{post.num_comments} comments</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-start gap-1">
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-300 hover:text-orange-500"
            title="Open on Reddit"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
            </svg>
          </a>
          {!post.is_self && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-300 hover:text-blue-500"
              title="Open link"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

async function Sidebar({ 
  currentCategory,
  currentSubreddit,
}: { 
  currentCategory?: string;
  currentSubreddit?: string;
}) {
  const categories = Object.entries(redditCategoryLabels);
  
  // Group subreddits by category
  const subredditsByCategory = redditFeeds.reduce((acc, feed) => {
    if (!acc[feed.category]) acc[feed.category] = [];
    acc[feed.category].push(feed.subreddit);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-20 space-y-6">
        {/* Back to Articles */}
        <a
          href="/"
          className="block px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-center font-medium"
        >
          ← Back to Articles
        </a>

        {/* Categories */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
          <div className="space-y-1">
            <a
              href="/reddit"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                !currentCategory && !currentSubreddit ? 'bg-orange-100 text-orange-700 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              🔥 All Hot Posts
            </a>
            {categories.map(([key, label]) => (
              <a
                key={key}
                href={`/reddit?category=${key}`}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentCategory === key ? 'bg-orange-100 text-orange-700 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Subreddits */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Subreddits</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {Object.entries(subredditsByCategory).map(([category, subs]) => (
              <div key={category} className="mb-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-1">
                  {redditCategoryLabels[category]?.replace(/[^\w\s&]/g, '').trim()}
                </div>
                {subs.map(sub => (
                  <a
                    key={sub}
                    href={`/reddit?subreddit=${sub}`}
                    className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentSubreddit === sub ? 'bg-orange-100 text-orange-700 font-medium' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    r/{sub}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

async function RedditList({
  category,
  subreddit,
}: {
  category?: string;
  subreddit?: string;
}) {
  let posts: RedditPost[] = [];
  let title = '🔥 Hot Posts from All Subreddits';

  if (subreddit) {
    const feed = redditFeeds.find(f => f.subreddit.toLowerCase() === subreddit.toLowerCase());
    posts = await fetchRedditPosts(subreddit, feed?.category || 'tech', 50);
    title = `r/${subreddit}`;
  } else if (category) {
    const categoryFeeds = redditFeeds.filter(f => f.category === category);
    for (const feed of categoryFeeds) {
      const feedPosts = await fetchRedditPosts(feed.subreddit, feed.category, 10);
      posts.push(...feedPosts);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    posts.sort((a, b) => b.score - a.score);
    title = redditCategoryLabels[category] || category;
  } else {
    posts = await fetchAllRedditFeeds();
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border">
        <div className="text-5xl mb-4">🤷</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts found</h3>
        <p className="text-gray-500">Reddit might be rate limiting. Try again in a minute.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-900">{title}</span>
          <span className="text-gray-500 ml-2">({posts.length} posts)</span>
        </div>
        <span className="text-xs text-gray-400">Updated every 30 min</span>
      </div>
      <div className="divide-y divide-gray-100 px-4">
        {posts.slice(0, 100).map((post) => (
          <RedditPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

export default async function RedditPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subreddit?: string }>;
}) {
  const params = await searchParams;
  const category = params.category?.trim() || undefined;
  const subreddit = params.subreddit?.trim() || undefined;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <a href="/" className="flex items-center gap-2">
                <span className="text-2xl">📓</span>
                <span className="font-bold text-xl text-gray-900">Tilly's Journal</span>
              </a>
              
              {/* Nav */}
              <div className="flex items-center gap-4">
                <a href="/" className="text-gray-600 hover:text-gray-900">Articles</a>
                <a href="/reddit" className="text-orange-600 font-medium">Reddit</a>
              </div>
              
              <div className="text-sm text-gray-500">
                Live from Reddit
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar */}
            <Suspense fallback={<div className="w-64 flex-shrink-0" />}>
              <Sidebar currentCategory={category} currentSubreddit={subreddit} />
            </Suspense>
            
            {/* Content */}
            <main className="flex-1 min-w-0">
              {/* Active filters */}
              {(category || subreddit) && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500">Viewing:</span>
                  {subreddit && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      r/{subreddit}
                      <a href="/reddit" className="ml-2 hover:text-orange-900">×</a>
                    </span>
                  )}
                  {category && !subreddit && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {redditCategoryLabels[category]}
                      <a href="/reddit" className="ml-2 hover:text-orange-900">×</a>
                    </span>
                  )}
                </div>
              )}
              
              <Suspense
                fallback={
                  <div className="bg-white rounded-xl border p-8">
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded" />
                      ))}
                    </div>
                  </div>
                }
              >
                <RedditList category={category} subreddit={subreddit} />
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
