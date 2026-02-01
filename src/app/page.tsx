import { Suspense } from 'react';
import { getArticles, getStats, getSourceCounts } from '@/lib/database';
import { categoryLabels } from '@/lib/feeds';
import { BulkActions, RunDigestButton, ExpandableArticleCard } from '@/components/DeleteButtons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Article {
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
}

async function Sidebar({ 
  currentSource, 
  currentCategory,
  currentTime 
}: { 
  currentSource?: string;
  currentCategory?: string;
  currentTime?: string;
}) {
  const stats = await getStats();
  const sources = await getSourceCounts();
  
  const categories = [
    { key: 'agents', label: '🤖 AI Agents', color: 'text-violet-600' },
    { key: 'ai', label: '🧠 AI & ML', color: 'text-purple-600' },
    { key: 'seo', label: '🔍 SEO', color: 'text-green-600' },
    { key: 'tech', label: '💻 Tech', color: 'text-blue-600' },
    { key: 'marketing', label: '📈 Marketing', color: 'text-orange-600' },
  ];

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-20 space-y-6">
        {/* Stats */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-2xl font-bold text-gray-900">{stats.totalArticles}</div>
          <div className="text-sm text-gray-500">Total Articles</div>
          <div className="mt-2 text-sm">
            <span className="text-green-600 font-medium">{stats.todayArticles} today</span>
          </div>
        </div>
        
        {/* Time Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Time</h3>
          <div className="space-y-1">
            <a
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                !currentTime ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              All Time
            </a>
            <a
              href="/?time=today"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                currentTime === 'today' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              📅 Today
            </a>
            <a
              href="/?time=yesterday"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                currentTime === 'yesterday' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              🕙 Yesterday
            </a>
            <a
              href="/?time=week"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                currentTime === 'week' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              📆 This Week
            </a>
            <a
              href="/?time=month"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                currentTime === 'month' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              🗓️ This Month
            </a>
          </div>
        </div>
        
        {/* Categories */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
          <div className="space-y-1">
            <a
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                !currentCategory ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              All Categories
            </a>
            {categories.map((cat) => (
              <a
                key={cat.key}
                href={`/?category=${cat.key}`}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentCategory === cat.key ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                <span className={cat.color}>{cat.label}</span>
                <span className="float-right text-gray-400">
                  {stats.byCategory[cat.key] || 0}
                </span>
              </a>
            ))}
          </div>
        </div>
        
        {/* Sources */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Sources</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <a
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                !currentSource ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              All Sources
            </a>
            {Object.entries(sources)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <a
                  key={source}
                  href={`/?source=${encodeURIComponent(source)}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                    currentSource === source ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                  }`}
                  title={source}
                >
                  <span className="text-gray-700">{source}</span>
                  <span className="float-right text-gray-400 ml-2">{count}</span>
                </a>
              ))}
          </div>
        </div>

        {/* Bulk Actions */}
        <BulkActions />
        
        {/* Run Digest */}
        <RunDigestButton cronSecret={process.env.CRON_SECRET || ''} />
      </div>
    </aside>
  );
}

function getTimeRange(time?: string): { startDate?: Date; endDate?: Date } {
  if (!time) return {};
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (time) {
    case 'today':
      return { startDate: today };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: today };
    }
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo };
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { startDate: monthAgo };
    }
    default:
      return {};
  }
}

async function ArticleList({
  category,
  source,
  search,
  time,
}: {
  category?: string;
  source?: string;
  search?: string;
  time?: string;
}) {
  const { startDate, endDate } = getTimeRange(time);
  
  const articles = await getArticles({
    category: category || undefined,
    source: source || undefined,
    search: search || undefined,
    startDate,
    endDate,
    limit: 100,
  });

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No articles found</h3>
        <p className="text-gray-500">Try adjusting your filters or run the digest.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-900">{articles.length} articles</span>
          {(category || source || search || time) && (
            <a href="/" className="ml-3 text-sm text-blue-600 hover:underline">
              Clear filters
            </a>
          )}
        </div>
        <span className="text-xs text-gray-500">Click article to expand</span>
      </div>
      <div className="divide-y divide-gray-100 px-4">
        {articles.map((article) => (
          <ExpandableArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; source?: string; search?: string; time?: string }>;
}) {
  const params = await searchParams;
  
  // Clean up empty strings
  const category = params.category?.trim() || undefined;
  const source = params.source?.trim() || undefined;
  const search = params.search?.trim() || undefined;
  const time = params.time?.trim() || undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🍑</span>
              <span className="font-bold text-xl text-gray-900">Cheeks Digest</span>
            </a>
            
            {/* Search */}
            <form action="/" method="GET" className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="search"
                  name="search"
                  placeholder="Search articles..."
                  defaultValue={search}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {/* Preserve other filters */}
              {category && <input type="hidden" name="category" value={category} />}
              {source && <input type="hidden" name="source" value={source} />}
              {time && <input type="hidden" name="time" value={time} />}
            </form>
            
            <div className="text-sm text-gray-500">
              Updated every 12 hours
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <Suspense fallback={<div className="w-64 flex-shrink-0" />}>
            <Sidebar currentSource={source} currentCategory={category} currentTime={time} />
          </Suspense>
          
          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Active filters */}
            {(category || source || search || time) && (
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Filters:</span>
                {time && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {time === 'today' ? 'Today' : time === 'yesterday' ? 'Yesterday' : time === 'week' ? 'This Week' : 'This Month'}
                    <a href={`/?${category ? `category=${category}` : ''}${source ? `&source=${encodeURIComponent(source)}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`} className="ml-2 hover:text-green-900">×</a>
                  </span>
                )}
                {category && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                    <a href={`/?${time ? `time=${time}` : ''}${source ? `&source=${encodeURIComponent(source)}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`} className="ml-2 hover:text-purple-900">×</a>
                  </span>
                )}
                {source && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {source}
                    <a href={`/?${time ? `time=${time}` : ''}${category ? `&category=${category}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`} className="ml-2 hover:text-blue-900">×</a>
                  </span>
                )}
                {search && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    &quot;{search}&quot;
                    <a href={`/?${time ? `time=${time}` : ''}${category ? `&category=${category}` : ''}${source ? `&source=${encodeURIComponent(source)}` : ''}`} className="ml-2 hover:text-gray-900">×</a>
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
              <ArticleList category={category} source={source} search={search} time={time} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
