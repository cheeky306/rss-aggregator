import { Suspense } from 'react';
import { getArticles, getStats, getTagCounts } from '@/lib/database';
import { categoryLabels } from '@/lib/feeds';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  ai: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  seo: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  tech: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  marketing: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

async function StatsCard() {
  const stats = await getStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white">
        <p className="text-blue-100 text-sm font-medium">Total Articles</p>
        <p className="text-3xl font-bold mt-1">{stats.totalArticles}</p>
      </div>
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-xl text-white">
        <p className="text-emerald-100 text-sm font-medium">Today</p>
        <p className="text-3xl font-bold mt-1">{stats.todayArticles}</p>
      </div>
      {Object.entries(stats.byCategory)
        .slice(0, 2)
        .map(([cat, count]) => (
          <div key={cat} className="bg-gradient-to-br from-gray-700 to-gray-800 p-5 rounded-xl text-white">
            <p className="text-gray-300 text-sm font-medium capitalize">{cat}</p>
            <p className="text-3xl font-bold mt-1">{count}</p>
          </div>
        ))}
    </div>
  );
}

async function TagCloud() {
  const tags = await getTagCounts();
  const sortedTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  if (sortedTags.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border mb-8">
      <h2 className="font-semibold mb-4 text-gray-900">🏷️ Popular Tags</h2>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map(([tag, count]) => (
          <a
            key={tag}
            href={`?tags=${encodeURIComponent(tag)}`}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-blue-100 hover:text-blue-700 transition-all"
          >
            {tag} <span className="text-gray-400 ml-1">({count})</span>
          </a>
        ))}
      </div>
    </div>
  );
}

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    url: string;
    source_name: string;
    category: string;
    published_at: string;
    summary: string | null;
    briefing: string | null;
    tags: string[] | null;
    content_angles: string[] | null;
  };
}

function ArticleCard({ article }: ArticleCardProps) {
  const categoryLabel =
    categoryLabels[article.category as keyof typeof categoryLabels] ||
    article.category;
  
  const colors = categoryColors[article.category] || categoryColors.tech;
  
  const publishedDate = new Date(article.published_at);
  const timeAgo = getTimeAgo(publishedDate);

  return (
    <article className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 ${colors.bg} ${colors.text} rounded-full font-medium border ${colors.border}`}>
                {categoryLabel}
              </span>
              <span className="text-xs text-gray-500">
                {article.source_name}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{timeAgo}</span>
            </div>
            <h3 className="font-bold text-lg text-gray-900 leading-snug">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                {article.title}
              </a>
            </h3>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
            title="Open article"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {/* AI Summary */}
        {article.summary && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">✨ AI Summary</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{article.summary}</p>
          </div>
        )}

        {/* AI Briefing */}
        {article.briefing && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">📋 Full Briefing</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{article.briefing}</p>
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {article.tags.map((tag) => (
              <a
                key={tag}
                href={`?tags=${encodeURIComponent(tag)}`}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </a>
            ))}
          </div>
        )}

        {/* Content Angles */}
        {article.content_angles && article.content_angles.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-amber-800">💡 Content Ideas</span>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">For your content</span>
            </div>
            <ul className="space-y-2">
              {article.content_angles.map((angle, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{angle}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

async function ArticleList({
  category,
  search,
  tags,
}: {
  category?: string;
  search?: string;
  tags?: string;
}) {
  const articles = await getArticles({
    category,
    search,
    tags: tags?.split(','),
    limit: 50,
  });

  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No articles found</h3>
        <p className="text-gray-500 mb-6">Run the digest to fetch new articles from your RSS feeds.</p>
        <a
          href={`/api/cron/digest?secret=${process.env.CRON_SECRET}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🔄 Run Digest Now
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          📰 Latest Articles
          <span className="ml-2 text-sm font-normal text-gray-500">({articles.length})</span>
        </h2>
      </div>
      <div className="space-y-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

function FilterForm({ params }: { params: { category?: string; search?: string; tags?: string } }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border mb-8">
      <form method="GET" className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
          <input
            type="search"
            name="search"
            placeholder="Search articles, topics, summaries..."
            defaultValue={params.search}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
          <select
            name="category"
            defaultValue={params.category}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
          >
            <option value="">All Categories</option>
            <option value="ai">🤖 AI & ML</option>
            <option value="seo">🔍 SEO & Search</option>
            <option value="tech">💻 Tech News</option>
            <option value="marketing">📈 Marketing</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Filter
          </button>
          {(params.search || params.category || params.tags) && (
            <a
              href="/"
              className="px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear
            </a>
          )}
        </div>
      </form>
      {params.tags && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtered by tag:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            #{params.tags}
          </span>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600">✕ Remove</a>
        </div>
      )}
    </div>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; tags?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📰</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">News Aggregator</h1>
                <p className="text-xs text-gray-500">AI-powered news briefings</p>
              </div>
            </div>
            <a
              href={`/api/cron/digest?secret=${process.env.CRON_SECRET}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
              </svg>
              Run Digest
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />
              ))}
            </div>
          }
        >
          <StatsCard />
        </Suspense>

        {/* Filters */}
        <FilterForm params={params} />

        {/* Tags */}
        <Suspense fallback={null}>
          <TagCloud />
        </Suspense>

        {/* Articles */}
        <Suspense
          fallback={
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          }
        >
          <ArticleList
            category={params.category}
            search={params.search}
            tags={params.tags}
          />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          RSS Aggregator • Runs daily at 6am UTC • Powered by OpenAI
        </div>
      </footer>
    </div>
  );
}
