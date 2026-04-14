'use client';

import { useState } from 'react';

interface Props {
  onSubmit: (description: string, date: string) => void;
  loading?: boolean;
}

const EVENT_EXAMPLES = [
  'Casual dinner with friends',
  'Job interview at a tech company',
  'Wedding reception',
  'Weekend golf round',
  'First date at a nice restaurant',
  'Team sports practice',
  'Concert / live show',
  'Morning run in the park',
];

export default function EventSuggestionForm({ onSubmit, loading = false }: Props) {
  // Default date = today
  const todayStr = new Date().toISOString().split('T')[0];
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit(description.trim(), date);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Event Description *
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the event, e.g. 'Business dinner at an upscale restaurant'"
          required
        />
        {/* Quick-fill examples */}
        <div className="mt-2 flex flex-wrap gap-2">
          {EVENT_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setDescription(ex)}
              className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-2.5 py-1 rounded-full border border-gray-200 hover:border-blue-300 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date *</label>
        <input
          type="date"
          className="w-full sm:w-auto rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !description.trim()}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-8 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          '✨ Get Outfit Suggestions'
        )}
      </button>
    </form>
  );
}
