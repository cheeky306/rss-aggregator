import { Suspense } from 'react';
import { getArticles, getStats, getTagCounts } from '@/lib/database';
import { categoryLabels } from '@/lib/feeds';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function StatsCard() {
  const stats = await getStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-500">Total Articles</p>
        <p className="text-2xl font-bold">{stats.totalArticles}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-500">Today</p>
        <p className="text-2xl font-bold">{stats.todayArticles}</p>
      </div>
      {Object.entries(stats.byCategory)
        .slice(0, 2)
        .map(([cat, count]) => (
          <div key={cat} className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 capitalize">{cat}</p>
            <p className="text-2xl font-bold">{count}</p>
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

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-8">
      <h2 className="font-semibold mb-3">Popular Tags</h2>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map(([tag, count]) => (
          <a
            key={tag}
            href={`?tags=${encodeURIComponent(tag)}`}
            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
          >
            {tag} ({count})
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

  return (
    <article className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-semibold text-lg leading-tight">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            {article.title}
          </a>
        </h3>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full whitespace-nowrap">
          {categoryLabel}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        {article.source_name} ·{' '}
        {new Date(article.published_at).toLocaleDateString()}
      </p>

      {article.briefing && (
        <p className="text-gray-700 mb-4 leading-relaxed">{article.briefing}</p>
      )}

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {article.content_angles && article.content_angles.length > 0 && (
        <div className="bg-amber-50 p-3 rounded-md">
          <p className="text-xs font-semibold text-amber-800 mb-1">
            💡 Content Angles
          </p>
          <ul className="text-sm text-amber-900 space-y-1">
            {article.content_angles.map((angle, i) => (
              <li key={i}>• {angle}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
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
      <div className="text-center py-12 text-gray-500">
        No articles found. Run the digest to fetch new articles.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
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
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">📰 News Aggregator</h1>
            <a
              href="/api/cron/digest"
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Run Digest Now
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <form className="flex flex-wrap gap-4">
            <input
              type="search"
              name="search"
              placeholder="Search articles..."
              defaultValue={params.search}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-md"
            />
            <select
              name="category"
              defaultValue={params.category}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              <option value="ai">AI & ML</option>
              <option value="seo">SEO & Search</option>
              <option value="tech">Tech News</option>
              <option value="marketing">Marketing</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Stats */}
        <Suspense
          fallback={
            <div className="h-24 bg-gray-100 animate-pulse rounded-lg mb-8" />
          }
        >
          <StatsCard />
        </Suspense>

        {/* Tags */}
        <Suspense
          fallback={
            <div className="h-32 bg-gray-100 animate-pulse rounded-lg mb-8" />
          }
        >
          <TagCloud />
        </Suspense>

        {/* Articles */}
        <Suspense
          fallback={
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-100 animate-pulse rounded-lg"
                />
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
    </div>
  );
}
