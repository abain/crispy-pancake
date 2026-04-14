'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ClothingItem } from '@/lib/types';
import ClosetList from '../components/ClosetList';

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [laundering, setLaundering] = useState(false);
  const [launderSuccess, setLaunderSuccess] = useState(false);

  // Load items directly from the dedicated closet endpoint
  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/getCloset');
      if (!res.ok) throw new Error('Failed to load closet');
      const data = (await res.json()) as { items: ClothingItem[] };
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load closet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const handleAdd = useCallback(async (newItem: Partial<ClothingItem>) => {
    try {
      const res = await fetch('/api/addClothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Add failed');
      }
      const added = (await res.json()) as ClothingItem;
      setItems((prev) => [...prev, added]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, updates: Partial<ClothingItem>) => {
    try {
      const res = await fetch('/api/updateClothing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Update failed');
      }
      const updated = (await res.json()) as ClothingItem;
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/deleteClothing?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Delete failed');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  }, []);

  const handleMarkDirty = useCallback(async (id: string) => {
    await handleUpdate(id, { isDirty: true });
  }, [handleUpdate]);

  const handleMarkClean = useCallback(async (id: string) => {
    await handleUpdate(id, { isDirty: false });
  }, [handleUpdate]);

  const handleLaunderAll = useCallback(async () => {
    setLaundering(true);
    try {
      await fetch('/api/launderItems', { method: 'POST' });
      setItems((prev) => prev.map((i) => ({ ...i, isDirty: false })));
      setLaunderSuccess(true);
      setTimeout(() => setLaunderSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launder');
    } finally {
      setLaundering(false);
    }
  }, []);

  const dirtyCount = items.filter((i) => i.isDirty).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👔 My Closet</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your wardrobe – add items, track what&apos;s clean, and reset for a new week.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={bootstrap}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleLaunderAll}
            disabled={laundering || dirtyCount === 0}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
              dirtyCount > 0
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {laundering ? '🫧 Laundering…' : `🫧 Launder All (${dirtyCount} dirty)`}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {launderSuccess && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
          ✅ All items have been laundered and are ready for the new week!
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Closet list */}
      {!loading && (
        <ClosetList
          items={items}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          onMarkDirty={handleMarkDirty}
          onMarkClean={handleMarkClean}
        />
      )}

      {/* Info */}
      {!loading && items.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">👕</p>
          <p className="font-medium">Your closet is empty.</p>
          <p className="text-sm mt-1">
            Use the <strong>+ Add Item</strong> button above to start building your wardrobe.
          </p>
        </div>
      )}
    </div>
  );
}
