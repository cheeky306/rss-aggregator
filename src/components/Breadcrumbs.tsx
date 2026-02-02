'use client';

import { categoryLabels } from '@/lib/feeds';

interface BreadcrumbsProps {
  category?: string;
  source?: string;
  time?: string;
  view?: string;
  search?: string;
}

export function Breadcrumbs({ category, source, time, view, search }: BreadcrumbsProps) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
  ];

  // Add view crumb
  if (view === 'favorites') {
    crumbs.push({ label: '❤️ Favorites', href: '/?view=favorites' });
  } else if (view === 'read-later') {
    crumbs.push({ label: '🔖 Read Later', href: '/?view=read-later' });
  }

  // Add time crumb
  if (time) {
    const timeLabels: Record<string, string> = {
      today: '📅 Today',
      yesterday: '🕙 Yesterday',
      week: '📆 This Week',
      month: '🗓️ This Month',
    };
    crumbs.push({ label: timeLabels[time] || time, href: `/?time=${time}` });
  }

  // Add category crumb
  if (category) {
    const label = categoryLabels[category as keyof typeof categoryLabels] || category;
    crumbs.push({ label, href: `/?category=${category}` });
  }

  // Add source crumb
  if (source) {
    crumbs.push({ label: source, href: `/?source=${encodeURIComponent(source)}` });
  }

  // Add search crumb
  if (search) {
    crumbs.push({ label: `"${search}"`, href: `/?search=${encodeURIComponent(search)}` });
  }

  // Don't show if just Home
  if (crumbs.length === 1) {
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
              <a href={crumb.href} className="text-gray-500 hover:text-purple-600 transition-colors">
                {crumb.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
