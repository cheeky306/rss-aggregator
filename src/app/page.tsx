import { Suspense } from 'react';
import { getArticles, getStats, getSourceCounts } from '@/lib/database';
import { categoryLabels } from '@/lib/feeds';
import { DeleteButton, BulkActions } from '@/components/DeleteButtons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const categoryColors: Record<string, string> = {
  agents: 'bg-violet-100 text-violet-700 border-violet-200',
  ai: 'bg-purple-100 text-purple-700 border-purple-200',
  seo: 'bg-green-100 text-green-700 border-green-200',
  tech: 'bg-blue-100 text-blue-700 border-blue-200',
  marketing: 'bg-orange-100 text-orange-700 border-orange-200',
};

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

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}

function ArticleCard({ article }: { article: Article }) {
  const colors = categoryColors[article.category] || categoryColors.tech;
  const hasAI = !!article.briefing;
  
  return (
    <div className="border-b border-gray-100 py-4 hover:bg-gray-50 transition-colors group">
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2 leading-snug"
          >
            {article.title}
          </a>
          
          {/* Preview text */}
          {article.summary && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {article.summary}
            </p>
          )}
          
          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className={`px-2 py-0.5 rounded border ${colors}`}>
              {article.category}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 truncate">{article.source_name}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{getTimeAgo(new Date(article.published_at))}</span>
            {hasAI && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-purple-600 font-medium">✨ AI</span>
              </>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex-shrink-0 flex items-start gap-1">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-300 hover:text-blue-500"
            title="Open article"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </a>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DeleteButton id={article.id} title={article.title} />
          </div>
        </div>
      </div>
      
      {/* AI Briefing (expandable) */}
      {article.briefing && (
        <details className="mt-3">
          <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800">
            View AI Briefing
          </summary>
          <div className="mt-2 p-3 bg-purple-50 rounded-lg text-sm text-gray-700">
            {article.briefing}
          </div>
        </details>
      )}
      
      {/* Content Ideas */}
      {article.content_angles && article.content_angles.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-800">
            💡 {article.content_angles.length} Content Ideas
          </summary>
          <ul className="mt-2 p-3 bg-amber-50 rounded-lg text-sm space-y-1">
            {article.content_angles.map((angle, i) => (
              <li key={i} className="text-amber-900">• {angle}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

async function Sidebar({ 
  currentSource, 
  currentCategory 
}: { 
  currentSource?: string;
  currentCategory?: string;
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
        <a
          href={`/api/cron/digest?secret=${process.env.CRON_SECRET}`}
          className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          🔄 Run Digest
        </a>
      </div>
    </aside>
  );
}

async function ArticleList({
  category,
  source,
  search,
}: {
  category?: string;
  source?: string;
  search?: string;
}) {
  const articles = await getArticles({
    category: category || undefined,
    source: source || undefined,
    search: search || undefined,
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
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
        <span className="font-medium text-gray-900">{articles.length} articles</span>
        {(category || source || search) && (
          <a href="/" className="ml-3 text-sm text-blue-600 hover:underline">
            Clear filters
          </a>
        )}
      </div>
      <div className="divide-y divide-gray-100 px-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; source?: string; search?: string }>;
}) {
  const params = await searchParams;
  
  // Clean up empty strings
  const category = params.category?.trim() || undefined;
  const source = params.source?.trim() || undefined;
  const search = params.search?.trim() || undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">📰</span>
              <span className="font-bold text-xl text-gray-900">News Aggregator</span>
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
            </form>
            
            <div className="text-sm text-gray-500">
              Updated daily at 6am UTC
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <Suspense fallback={<div className="w-64 flex-shrink-0" />}>
            <Sidebar currentSource={source} currentCategory={category} />
          </Suspense>
          
          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Active filters */}
            {(category || source || search) && (
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Filters:</span>
                {category && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                    <a href={`/?${source ? `source=${encodeURIComponent(source)}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`} className="ml-2 hover:text-purple-900">×</a>
                  </span>
                )}
                {source && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {source}
                    <a href={`/?${category ? `category=${category}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`} className="ml-2 hover:text-blue-900">×</a>
                  </span>
                )}
                {search && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    &quot;{search}&quot;
                    <a href={`/?${category ? `category=${category}` : ''}${source ? `&source=${encodeURIComponent(source)}` : ''}`} className="ml-2 hover:text-gray-900">×</a>
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
              <ArticleList category={category} source={source} search={search} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
