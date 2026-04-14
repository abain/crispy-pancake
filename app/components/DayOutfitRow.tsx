'use client';

import type { DayPlan } from '@/lib/types';
import OutfitSuggestionCard from './OutfitSuggestionCard';
import WeatherBadge from './WeatherBadge';

interface Props {
  day: DayPlan;
}

export default function DayOutfitRow({ day }: Props) {
  const isToday =
    new Date().toISOString().split('T')[0] === day.date;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isToday ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200 bg-white shadow-sm'
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className={`font-bold text-lg ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
            {day.dayOfWeek}
            {isToday && (
              <span className="ml-2 text-xs font-semibold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-400">
            {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Context badges */}
          {day.work !== 'off' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
              {day.work === 'in-office' ? '🏢 Office' : '🏠 WFH'}
            </span>
          )}
          {day.gym !== 'none' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">
              🏋️ {day.gym}
            </span>
          )}
          {day.evening !== 'none' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">
              🌙 {day.evening}
            </span>
          )}
          {day.weather && <WeatherBadge weather={day.weather} />}
        </div>
      </div>

      {/* Outfits grid */}
      {day.outfits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {day.outfits.map((outfit, idx) => (
            <OutfitSuggestionCard key={`${day.date}-${outfit.context}-${idx}`} outfit={outfit} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No outfits planned for this day.</p>
      )}

      {/* Warnings */}
      {day.warnings && day.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {day.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-start gap-1">
              <span>⚠️</span>
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
