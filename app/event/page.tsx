'use client';

import { useState } from 'react';
import type { EventSuggestion } from '@/lib/types';
import EventSuggestionForm from '../components/EventSuggestionForm';
import OutfitSuggestionCard from '../components/OutfitSuggestionCard';
import WeatherBadge from '../components/WeatherBadge';

export default function EventPage() {
  const [result, setResult] = useState<EventSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (description: string, date: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/getEventSuggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, date }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to get suggestions');
      }

      const data = (await res.json()) as EventSuggestion;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">✨ Event Stylist</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Describe any event and get 3 curated outfit suggestions from your wardrobe.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <EventSuggestionForm onSubmit={handleSubmit} loading={loading} />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Event summary */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Outfit suggestions for:
              </h2>
              <p className="text-blue-700 font-medium">&ldquo;{result.eventDescription}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(result.eventDate + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            {result.weather && <WeatherBadge weather={result.weather} />}
          </div>

          {/* Outfit cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {result.outfits.map((outfit, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Option {idx + 1}
                </h3>
                <OutfitSuggestionCard outfit={outfit} />
              </div>
            ))}
          </div>

          {result.outfits.length === 0 && (
            <p className="text-gray-400 italic text-sm">
              No outfit suggestions could be generated. Try adding more items to your closet.
            </p>
          )}

          {/* Reset */}
          <button
            onClick={() => setResult(null)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Start a new search
          </button>
        </div>
      )}

      {/* Info card */}
      {!result && !loading && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700 space-y-1">
          <p className="font-semibold">💡 Tips</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-600">
            <li>Be specific: &quot;formal wedding reception&quot; vs &quot;casual outdoor wedding&quot;.</li>
            <li>Include venue keywords: &quot;rooftop bar&quot;, &quot;office meeting&quot;, &quot;beach bonfire&quot;.</li>
            <li>Weather for the event date is fetched automatically.</li>
            <li>Suggestions are drawn from your current clean wardrobe.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
