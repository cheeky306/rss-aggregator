'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAI } from './AIProvider';

export function DeleteButton({ id, title }: { id: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Delete "${title.slice(0, 50)}..."?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/articles/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete');
      }
    } catch (e) {
      alert('Error deleting article');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-gray-300 hover:text-red-500 disabled:opacity-50"
      title="Delete article"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/>
        </svg>
      )}
    </button>
  );
}

export function BulkActions() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const deleteAll = async () => {
    if (!confirm('Delete ALL articles? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/articles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-all' }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Deleted ${data.deleted} articles`);
        router.refresh();
      } else {
        alert('Failed to delete');
      }
    } catch (e) {
      alert('Error');
    }
    setLoading(false);
  };

  const deleteOlder = async (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    if (!confirm(`Delete all articles older than ${days} days?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/articles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-older', olderThan: date.toISOString() }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Deleted ${data.deleted} articles`);
        router.refresh();
      } else {
        alert('Failed to delete');
      }
    } catch (e) {
      alert('Error');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <h3 className="font-semibold text-gray-900 mb-3">Manage</h3>
      <div className="space-y-2">
        <button
          onClick={() => deleteOlder(7)}
          disabled={loading}
          className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
        >
          🗑️ Delete older than 7 days
        </button>
        <button
          onClick={() => deleteOlder(30)}
          disabled={loading}
          className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
        >
          🗑️ Delete older than 30 days
        </button>
        <button
          onClick={deleteAll}
          disabled={loading}
          className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
        >
          ⚠️ Delete all articles
        </button>
      </div>
    </div>
  );
}

export function RunDigestButton({ cronSecret }: { cronSecret: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const runDigest = async () => {
    setLoading(true);
    setStatus('Fetching feeds...');
    
    try {
      const res = await fetch(`/api/cron/digest?secret=${cronSecret}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus(`Done! ${data.aiProcessed} AI + ${data.savedWithoutAI} basic articles`);
        setTimeout(() => {
          router.refresh();
          setLoading(false);
          setStatus('');
        }, 1500);
      } else {
        setStatus('Error: ' + (data.error || 'Unknown error'));
        setLoading(false);
      }
    } catch (e) {
      setStatus('Failed to run digest');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={runDigest}
      disabled={loading}
      className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {status}
        </span>
      ) : (
        '🔄 Run Digest'
      )}
    </button>
  );
}

// Expandable Article Card
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

const categoryColors: Record<string, string> = {
  agents: 'bg-violet-100 text-violet-700 border-violet-200',
  ai: 'bg-purple-100 text-purple-700 border-purple-200',
  seo: 'bg-green-100 text-green-700 border-green-200',
  tech: 'bg-blue-100 text-blue-700 border-blue-200',
  marketing: 'bg-orange-100 text-orange-700 border-orange-200',
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}

// Format plain text into readable HTML
function formatArticleText(text: string): string {
  // If it already has HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }

  // Split into lines and process
  const lines = text.split('\n').filter(line => line.trim());
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Check for list items (lines starting with - or • or *)
    if (/^[-•*]\s/.test(line)) {
      if (!inList) {
        html += '<ul class="list-disc pl-5 my-3 space-y-1">';
        inList = true;
      }
      html += `<li>${line.replace(/^[-•*]\s/, '')}</li>`;
      continue;
    } else if (inList) {
      html += '</ul>';
      inList = false;
    }

    // Check for numbered list items
    if (/^\d+[.)\s]/.test(line)) {
      if (!inList) {
        html += '<ol class="list-decimal pl-5 my-3 space-y-1">';
        inList = true;
      }
      html += `<li>${line.replace(/^\d+[.)\s]+/, '')}</li>`;
      continue;
    }

    // Check if line looks like a heading (short, no period at end, possibly all caps)
    const isHeading = (
      line.length < 80 && 
      !line.endsWith('.') && 
      !line.endsWith(',') &&
      (line === line.toUpperCase() || /^[A-Z][^.]*$/.test(line))
    );

    // Check for "Read more" type links - make them smaller
    if (/^Read more$/i.test(line) || /^Continue reading$/i.test(line)) {
      continue; // Skip these
    }

    // Check if it's a short line that might be a subheading or label
    if (line.length < 60 && !line.includes('.') && i < lines.length - 1) {
      const nextLine = lines[i + 1]?.trim() || '';
      // If next line is longer, this might be a heading
      if (nextLine.length > line.length * 1.5) {
        html += `<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">${line}</h3>`;
        continue;
      }
    }

    // Check for section headers (all caps or title case short lines)
    if (isHeading && line.length > 3) {
      html += `<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">${line}</h3>`;
      continue;
    }

    // Regular paragraph
    html += `<p class="mb-4 leading-relaxed">${line}</p>`;
  }

  // Close any open list
  if (inList) {
    html += '</ul>';
  }

  return html || `<p class="text-gray-500 italic">No content available</p>`;
}

export function ExpandableArticleCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);
  const [fullText, setFullText] = useState<string | null>(null);
  const [loadingFullText, setLoadingFullText] = useState(false);
  const [fullTextError, setFullTextError] = useState<string | null>(null);
  const colors = categoryColors[article.category] || categoryColors.tech;
  const hasAI = !!article.briefing;
  const router = useRouter();
  const { openAI } = useAI();

  const loadFullText = async () => {
    if (fullText || loadingFullText) return;
    
    setLoadingFullText(true);
    setFullTextError(null);
    
    try {
      const res = await fetch(`/api/articles/${article.id}`);
      const data = await res.json();
      
      if (data.fullText) {
        setFullText(data.fullText);
      } else {
        setFullTextError(data.message || 'Could not load full text');
      }
    } catch (e) {
      setFullTextError('Failed to load full text');
    }
    
    setLoadingFullText(false);
  };

  return (
    <div className={`border-b border-gray-100 transition-colors ${expanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
      {/* Collapsed View */}
      <div className="py-4 group">
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {/* Title - click to expand */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2 leading-snug text-left w-full"
            >
              {article.title}
            </button>
            
            {/* Preview text */}
            {!expanded && article.summary && (
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
            {/* Expand/Collapse button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-400 hover:text-blue-500"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <svg 
                width="16" 
                height="16" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {/* External link */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-300 hover:text-blue-500"
              title="Open original"
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
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="pb-6 px-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Summary */}
          {article.summary && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Summary</h4>
              <p className="text-gray-700 leading-relaxed">{article.summary}</p>
            </div>
          )}

          {/* AI Briefing */}
          {article.briefing && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">✨ AI Briefing</h4>
              <p className="text-gray-800 leading-relaxed">{article.briefing}</p>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm cursor-pointer hover:bg-gray-200"
                  onClick={() => router.push(`/?search=${encodeURIComponent(tag)}`)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content Ideas */}
          {article.content_angles && article.content_angles.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">💡 Content Ideas</h4>
              <ul className="space-y-2">
                {article.content_angles.map((angle, i) => (
                  <li key={i} className="text-amber-900 flex gap-2">
                    <span className="text-amber-500">→</span>
                    <span>{angle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Text (lazy loaded) */}
          <details 
            className="bg-white rounded-lg border"
            onToggle={(e) => {
              if ((e.target as HTMLDetailsElement).open) {
                loadFullText();
              }
            }}
          >
            <summary className="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50">
              📄 View Full Article Text
            </summary>
            <div className="px-4 pb-4">
              {loadingFullText && (
                <div className="flex items-center gap-2 text-gray-500 py-4">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading full article...
                </div>
              )}
              {fullTextError && (
                <div className="text-amber-600 py-4">
                  {fullTextError}
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    Read on original site →
                  </a>
                </div>
              )}
              {fullText && (
                <article className="prose prose-sm max-w-none">
                  <div 
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: formatArticleText(fullText) }}
                  />
                </article>
              )}
            </div>
          </details>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => openAI(article.id, article.title)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Ask AI
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Read Original
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </a>
            <button
              onClick={() => setExpanded(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
