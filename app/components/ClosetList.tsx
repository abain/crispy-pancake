'use client';

import { useState } from 'react';
import type { ClothingItem, ClothingCategory } from '@/lib/types';
import AddClothingForm from './AddClothingForm';

interface Props {
  items: ClothingItem[];
  onAdd?: (item: Partial<ClothingItem>) => void;
  onUpdate?: (id: string, updates: Partial<ClothingItem>) => void;
  onRemove?: (id: string) => void;
  onMarkDirty?: (id: string) => void;
  onMarkClean?: (id: string) => void;
}

const CATEGORY_FILTERS: Array<{ label: string; value: ClothingCategory | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: '👕 Tops', value: 'top' },
  { label: '👖 Bottoms', value: 'bottom' },
  { label: '👟 Shoes', value: 'shoes' },
  { label: '🧥 Outerwear', value: 'outerwear' },
  { label: '⌚ Accessories', value: 'accessory' },
  { label: '🧦 Socks', value: 'socks' },
];

export default function ClosetList({
  items,
  onAdd,
  onUpdate,
  onRemove,
  onMarkDirty,
  onMarkClean,
}: Props) {
  const [filter, setFilter] = useState<ClothingCategory | 'all'>('all');
  const [dirtyFilter, setDirtyFilter] = useState<'all' | 'clean' | 'dirty'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = items.filter((item) => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (dirtyFilter === 'clean' && item.isDirty) return false;
    if (dirtyFilter === 'dirty' && !item.isDirty) return false;
    return true;
  });

  const handleUpdate = (id: string, updates: Partial<ClothingItem>) => {
    onUpdate?.(id, updates);
    setEditingId(null);
  };

  const dirtyCount = items.filter((i) => i.isDirty).length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-gray-600">
          <span className="font-bold text-blue-600">{items.length}</span> total items
        </span>
        <span className="text-gray-600">
          <span className="font-bold text-green-600">{items.length - dirtyCount}</span> clean
        </span>
        <span className="text-gray-600">
          <span className="font-bold text-amber-500">{dirtyCount}</span> dirty
        </span>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-bold text-blue-800 mb-3">Add New Item</h3>
          <AddClothingForm
            onSave={(item) => {
              onAdd?.(item);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Clean/Dirty filter */}
        <div className="ml-auto flex gap-1">
          {(['all', 'clean', 'dirty'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setDirtyFilter(v)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                dirtyFilter === v
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8 italic">No items match the current filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <h4 className="text-xs font-bold text-blue-800 mb-3">Editing: {item.name}</h4>
                  <AddClothingForm
                    initial={item}
                    onSave={(updates) => handleUpdate(item.id, updates)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div
                  className={`rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                    item.isDirty
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200 bg-white hover:shadow-md'
                  }`}
                >
                  {/* Item name + category */}
                  <div>
                    <p className="font-semibold text-sm text-gray-800 leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {item.category}
                      {item.subcategory && ` · ${item.subcategory}`}
                    </p>
                  </div>

                  {/* Attributes */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {item.color}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        item.colorFamily === 'cool'
                          ? 'bg-blue-100 text-blue-700'
                          : item.colorFamily === 'warm'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.colorFamily}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      F:{item.formality}/5
                    </span>
                    {item.isDirty && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        🫧 dirty
                      </span>
                    )}
                  </div>

                  {/* Style tags */}
                  {item.style.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.style.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                      {item.style.length > 3 && (
                        <span className="text-xs text-gray-400">+{item.style.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1 mt-auto pt-1 flex-wrap">
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 rounded-lg transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    {item.isDirty ? (
                      <button
                        onClick={() => onMarkClean?.(item.id)}
                        className="flex-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 py-1 rounded-lg transition-colors"
                      >
                        ✅ Clean
                      </button>
                    ) : (
                      <button
                        onClick={() => onMarkDirty?.(item.id)}
                        className="flex-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 py-1 rounded-lg transition-colors"
                      >
                        🫧 Dirty
                      </button>
                    )}
                    {!item.isDefault && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${item.name}" from your closet?`)) {
                            onRemove?.(item.id);
                          }
                        }}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg transition-colors"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
