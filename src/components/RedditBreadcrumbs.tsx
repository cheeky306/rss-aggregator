'use client';

import { redditCategoryLabels } from '@/lib/reddit';

interface RedditBreadcrumbsProps {
  category?: string;
  subreddit?: string;
}

export function RedditBreadcrumbs({ category, subreddit }: RedditBreadcrumbsProps) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Reddit', href: '/reddit' },
  ];

  // Add category crumb
  if (category) {
    const label = redditCategoryLabels[category] || category;
    crumbs.push({ label, href: `/reddit?category=${category}` });
  }

  // Add subreddit crumb
  if (subreddit) {
    crumbs.push({ label: `r/${subreddit}`, href: `/reddit?subreddit=${subreddit}` });
  }

  // Don't show if just Home > Reddit
  if (crumbs.length === 2) {
    return null;
  }

  return (
    <nav className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            )}
            {index === crumbs.length - 1 ? (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            ) : (
              <a href={crumb.href} className="text-gray-500 hover:text-orange-600 transition-colors">
                {crumb.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
