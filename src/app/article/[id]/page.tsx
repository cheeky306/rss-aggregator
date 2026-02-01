import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleById } from '@/lib/database';
import { categoryLabels } from '@/lib/feeds';

export const dynamic = 'force-dynamic';

const categoryColors: Record<string, string> = {
  agents: 'bg-violet-100 text-violet-700 border-violet-200',
  ai: 'bg-purple-100 text-purple-700 border-purple-200',
  seo: 'bg-green-100 text-green-700 border-green-200',
  tech: 'bg-blue-100 text-blue-700 border-blue-200',
  marketing: 'bg-orange-100 text-orange-700 border-orange-200',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  const colors = categoryColors[article.category] || categoryColors.tech;
  const hasAI = !!article.briefing;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🍑</span>
              <span className="font-bold text-gray-900">Cheeks Digest</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Article Header */}
          <div className="p-6 sm:p-8 border-b bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors}`}>
                {categoryLabels[article.category as keyof typeof categoryLabels] || article.category}
              </span>
              {hasAI && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  ✨ AI Enhanced
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{article.source_name}</span>
              <span>•</span>
              <span>{formatDate(new Date(article.published_at))}</span>
            </div>
          </div>

          {/* AI Briefing */}
          {article.briefing && (
            <div className="p-6 sm:p-8 border-b bg-purple-50">
              <h2 className="text-sm font-semibold text-purple-800 uppercase tracking-wide mb-3">
                ✨ AI Briefing
              </h2>
              <p className="text-gray-800 leading-relaxed text-lg">
                {article.briefing}
              </p>
            </div>
          )}

          {/* Summary */}
          {article.summary && (
            <div className="p-6 sm:p-8 border-b">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {article.summary}
              </p>
            </div>
          )}

          {/* Full Text */}
          {article.full_text && (
            <div className="p-6 sm:p-8 border-b">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Full Article
              </h2>
              <div 
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: article.full_text }}
              />
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="p-6 sm:p-8 border-b">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, i) => (
                  <Link
                    key={i}
                    href={`/?search=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Content Angles */}
          {article.content_angles && article.content_angles.length > 0 && (
            <div className="p-6 sm:p-8 border-b bg-amber-50">
              <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3">
                💡 Content Ideas
              </h2>
              <ul className="space-y-3">
                {article.content_angles.map((angle, i) => (
                  <li key={i} className="flex gap-3 text-amber-900">
                    <span className="text-amber-500 font-bold">→</span>
                    <span>{angle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 sm:p-8 bg-gray-50 flex flex-wrap gap-4">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Read Original Article
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium border"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
