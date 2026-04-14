'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ClothingItem } from '@/lib/types';

interface WardrobeContextValue {
  items: ClothingItem[];
  loading: boolean;
  error: string | null;
  addItem: (item: Partial<ClothingItem>) => Promise<void>;
  updateItem: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  markDirty: (id: string) => Promise<void>;
  markClean: (id: string) => Promise<void>;
  launderAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all items from the closet via the dedicated endpoint
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/getCloset');
      if (!res.ok) throw new Error('Failed to fetch closet');
      const data = (await res.json()) as { items: ClothingItem[] };
      setItems(data.items ?? []);
    } catch {
      setError('Failed to load wardrobe');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load wardrobe from the server on first mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(async (item: Partial<ClothingItem>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/addClothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to add item');
      }
      const newItem = (await res.json()) as ClothingItem;
      setItems((prev) => [...prev, newItem]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<ClothingItem>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/updateClothing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to update item');
      }
      const updated = (await res.json()) as ClothingItem;
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deleteClothing?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to remove item');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markDirty = useCallback(async (id: string) => {
    try {
      await fetch('/api/updateClothing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDirty: true }),
      });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isDirty: true } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark dirty');
    }
  }, []);

  const markClean = useCallback(async (id: string) => {
    try {
      await fetch('/api/updateClothing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDirty: false }),
      });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isDirty: false } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark clean');
    }
  }, []);

  const launderAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/launderItems', { method: 'POST' });
      setItems((prev) => prev.map((i) => ({ ...i, isDirty: false })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launder');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <WardrobeContext.Provider
      value={{ items, loading, error, addItem, updateItem, removeItem, markDirty, markClean, launderAll, refresh }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe(): WardrobeContextValue {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used inside <WardrobeProvider>');
  return ctx;
}
