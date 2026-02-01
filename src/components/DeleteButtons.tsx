'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
