'use client';

import type { Outfit, ClothingCategory } from '@/lib/types';

// Maps clothing categories to emoji icons
const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  top: '👕',
  bottom: '👖',
  shoes: '👟',
  outerwear: '🧥',
  accessory: '⌚',
  socks: '🧦',
};

// Context label formatting
const CONTEXT_LABELS: Record<string, { label: string; color: string }> = {
  work:    { label: 'Work',    color: 'bg-blue-100 text-blue-800' },
  gym:     { label: 'Gym',     color: 'bg-green-100 text-green-800' },
  evening: { label: 'Evening', color: 'bg-purple-100 text-purple-800' },
  casual:  { label: 'Casual',  color: 'bg-gray-100 text-gray-700' },
};

interface Props {
  outfit: Outfit;
}

export default function OutfitSuggestionCard({ outfit }: Props) {
  const meta = CONTEXT_LABELS[outfit.context] ?? CONTEXT_LABELS.casual;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meta.color}`}>
          {meta.label}
        </span>
        {outfit.notes && (
          <span className="text-xs text-gray-500 italic truncate ml-2">{outfit.notes}</span>
        )}
      </div>

      {/* Item list */}
      <ul className="space-y-1.5">
        {outfit.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <span className="text-base w-6 text-center" aria-hidden="true">
              {CATEGORY_ICONS[item.category]}
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800">{item.name}</span>
              <span className="text-xs text-gray-400 capitalize">{item.category}</span>
            </div>
            {/* Dirty indicator */}
            {item.isDirty && (
              <span
                title="Needs laundering"
                className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full"
              >
                🫧 dirty
              </span>
            )}
          </li>
        ))}
      </ul>

      {outfit.items.length === 0 && (
        <p className="text-sm text-gray-400 italic">No items available for this outfit.</p>
      )}
    </div>
  );
}
