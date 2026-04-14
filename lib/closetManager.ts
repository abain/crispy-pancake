import { v4 as uuidv4 } from 'uuid';
import type { ClothingItem, ClothingCategory } from './types';
import defaultWardrobe from './defaultWardrobe';

/**
 * In-memory closet store.
 *
 * TODO (production migration): Replace with a persistent database.
 * Recommended approach:
 *  1. Add Prisma (`npm install prisma @prisma/client`)
 *  2. Define a `ClothingItem` model in `prisma/schema.prisma` mirroring the
 *     TypeScript interface in `lib/types.ts`.
 *  3. Replace each method below with a `prisma.clothingItem.*` call.
 *  4. Seed the DB with `defaultWardrobe` data via `prisma/seed.ts`.
 *  5. Store the `DATABASE_URL` in `.env` (see `.env.example`).
 *
 * The interface of this module is intentionally database-agnostic so the swap
 * only touches this file.
 */
let store: ClothingItem[] = defaultWardrobe.map((item) => ({ ...item }));

const closetManager = {
  /** Return all items in the closet. */
  getAll(): ClothingItem[] {
    return [...store];
  },

  /** Return items filtered by category. */
  getByCategory(cat: ClothingCategory): ClothingItem[] {
    return store.filter((item) => item.category === cat);
  },

  /** Return only clean (not dirty) items. */
  getClean(): ClothingItem[] {
    return store.filter((item) => !item.isDirty);
  },

  /** Add a new item to the closet. Generates an id and createdAt if not provided. */
  addItem(item: Omit<ClothingItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): ClothingItem {
    const newItem: ClothingItem = {
      ...item,
      id: item.id ?? uuidv4(),
      createdAt: item.createdAt ?? new Date().toISOString(),
    };
    store.push(newItem);
    return newItem;
  },

  /** Update an existing item by id. Returns the updated item, or null if not found. */
  updateItem(id: string, updates: Partial<ClothingItem>): ClothingItem | null {
    const idx = store.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    store[idx] = { ...store[idx], ...updates, id }; // prevent id mutation
    return store[idx];
  },

  /** Remove an item by id. Returns true if removed. */
  removeItem(id: string): boolean {
    const before = store.length;
    store = store.filter((i) => i.id !== id);
    return store.length < before;
  },

  /** Mark specific items as dirty (worn/used). */
  markDirty(ids: string[]): void {
    store = store.map((item) =>
      ids.includes(item.id) ? { ...item, isDirty: true } : item,
    );
  },

  /** Mark specific items as clean. */
  markClean(ids: string[]): void {
    store = store.map((item) =>
      ids.includes(item.id) ? { ...item, isDirty: false } : item,
    );
  },

  /** Launder all items – resets the whole closet to clean for a new week. */
  launderAll(): void {
    store = store.map((item) => ({ ...item, isDirty: false }));
  },
};

export default closetManager;
