'use client';

import { useEffect, useState, useCallback } from 'react';
import type { WeeklyPlan } from '@/lib/types';
import WeeklyCalendar from './components/WeeklyCalendar';

export default function WeeklyPlannerPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/getWeeklyPlan');
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to load plan');
      }
      const data = (await res.json()) as WeeklyPlan;
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📅 Weekly Planner</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Your personalized outfit plan based on this week&apos;s calendar &amp; weather.
          </p>
        </div>
        <button
          onClick={fetchPlan}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Regenerating…
            </>
          ) : (
            '🔄 Regenerate Plan'
          )}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && !plan && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-28 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          ⚠️ {error}
          <button onClick={fetchPlan} className="ml-3 underline text-red-600 hover:text-red-800">
            Try again
          </button>
        </div>
      )}

      {/* Plan */}
      {plan && !loading && <WeeklyCalendar plan={plan} />}

      {/* Info card */}
      {!loading && !error && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700 space-y-1">
          <p className="font-semibold">💡 How it works</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-600">
            <li>Calendar events are parsed to detect work, gym, and evening contexts.</li>
            <li>Weather forecast informs outerwear and fabric choices.</li>
            <li>Items are not repeated across the week when possible.</li>
            <li>Mark items as worn in <a href="/closet" className="underline font-medium">My Closet</a> to keep plans accurate.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
