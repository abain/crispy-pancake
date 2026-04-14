'use client';

import { useState } from 'react';
import type { ClothingItem, ClothingCategory, WeatherCondition } from '@/lib/types';

interface Props {
  initial?: Partial<ClothingItem>;
  onSave: (item: Partial<ClothingItem>) => void;
  onCancel?: () => void;
}

const CATEGORIES: ClothingCategory[] = ['top', 'bottom', 'shoes', 'outerwear', 'accessory', 'socks'];
const COLOR_FAMILIES = ['cool', 'warm', 'neutral'] as const;
const WEATHER_CONDITIONS: WeatherCondition[] = ['clear', 'cloudy', 'rain', 'snow', 'windy'];

export default function AddClothingForm({ initial = {}, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<ClothingItem>>({
    name: '',
    category: 'top',
    subcategory: '',
    color: '',
    colorFamily: 'neutral',
    style: [],
    formality: 2,
    weatherSuitability: {},
    isDefault: false,
    isDirty: false,
    ...initial,
  });

  // Style tags as a comma-separated string for easy editing
  const [styleInput, setStyleInput] = useState((initial.style ?? []).join(', '));
  const [minTemp, setMinTemp] = useState<string>(
    initial.weatherSuitability?.minTemp?.toString() ?? '',
  );
  const [maxTemp, setMaxTemp] = useState<string>(
    initial.weatherSuitability?.maxTemp?.toString() ?? '',
  );
  const [selectedConditions, setSelectedConditions] = useState<WeatherCondition[]>(
    initial.weatherSuitability?.conditions ?? [],
  );

  const set = (field: keyof ClothingItem, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCondition = (c: WeatherCondition) => {
    setSelectedConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Normalize style tags: lowercase + trim to keep consistent across the app
    const styles = styleInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const weatherSuitability: ClothingItem['weatherSuitability'] = {};
    if (minTemp !== '') weatherSuitability.minTemp = Number(minTemp);
    if (maxTemp !== '') weatherSuitability.maxTemp = Number(maxTemp);
    if (selectedConditions.length > 0) weatherSuitability.conditions = selectedConditions;

    onSave({ ...form, style: styles, weatherSuitability });
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className={labelClass}>Item Name *</label>
        <input
          className={inputClass}
          value={form.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Navy Blue Oxford Shirt"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        <div>
          <label className={labelClass}>Category *</label>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => set('category', e.target.value as ClothingCategory)}
            required
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className={labelClass}>Subcategory</label>
          <input
            className={inputClass}
            value={form.subcategory ?? ''}
            onChange={(e) => set('subcategory', e.target.value)}
            placeholder="e.g. polo, hoodie, jeans"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Color */}
        <div>
          <label className={labelClass}>Color *</label>
          <input
            className={inputClass}
            value={form.color ?? ''}
            onChange={(e) => set('color', e.target.value)}
            placeholder="e.g. navy"
            required
          />
        </div>

        {/* Color Family */}
        <div>
          <label className={labelClass}>Color Family *</label>
          <select
            className={inputClass}
            value={form.colorFamily ?? 'neutral'}
            onChange={(e) =>
              set('colorFamily', e.target.value as ClothingItem['colorFamily'])
            }
          >
            {COLOR_FAMILIES.map((f) => (
              <option key={f} value={f} className="capitalize">
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Style tags */}
      <div>
        <label className={labelClass}>Style Tags (comma-separated)</label>
        <input
          className={inputClass}
          value={styleInput}
          onChange={(e) => setStyleInput(e.target.value)}
          placeholder="e.g. casual, business-casual, athletic"
        />
      </div>

      {/* Formality */}
      <div>
        <label className={labelClass}>
          Formality: <span className="text-blue-600 font-bold">{form.formality}</span>
          <span className="ml-1 text-gray-400 font-normal">(1 = loungewear, 5 = formal)</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          className="w-full accent-blue-500"
          value={form.formality ?? 2}
          onChange={(e) => set('formality', Number(e.target.value))}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>Loungewear</span>
          <span>Casual</span>
          <span>Smart</span>
          <span>Business</span>
          <span>Formal</span>
        </div>
      </div>

      {/* Weather suitability */}
      <div>
        <label className={labelClass}>Weather Suitability</label>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <label className="text-xs text-gray-500">Min Temp (°F)</label>
            <input
              className={inputClass}
              type="number"
              value={minTemp}
              onChange={(e) => setMinTemp(e.target.value)}
              placeholder="No min"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Max Temp (°F)</label>
            <input
              className={inputClass}
              type="number"
              value={maxTemp}
              onChange={(e) => setMaxTemp(e.target.value)}
              placeholder="No max"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {WEATHER_CONDITIONS.map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => toggleCondition(cond)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                selectedConditions.includes(cond)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Leave blank for all conditions.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          {initial.id ? 'Save Changes' : 'Add Item'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
