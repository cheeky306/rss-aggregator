'use client';

import { useAI } from './AIProvider';
import { AIPanel } from './AIPanel';
import { ReactNode } from 'react';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { isOpen, articleId, articleTitle, closeAI, toggleAI } = useAI();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* AI Panel */}
      <AIPanel
        isOpen={isOpen}
        onClose={closeAI}
        articleId={articleId}
        articleTitle={articleTitle}
      />

      {/* Toggle button (when panel is closed) */}
      {!isOpen && (
        <button
          onClick={toggleAI}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 hover:shadow-xl transition-all flex items-center justify-center z-40"
          title="Open AI Assistant"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </button>
      )}
    </div>
  );
}
