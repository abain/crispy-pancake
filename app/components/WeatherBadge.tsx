'use client';

import type { DayWeather } from '@/lib/types';

const CONDITION_ICON: Record<string, string> = {
  clear:  '☀️',
  cloudy: '☁️',
  rain:   '🌧️',
  snow:   '❄️',
  windy:  '💨',
};

interface Props {
  weather: DayWeather;
  compact?: boolean;
}

export default function WeatherBadge({ weather, compact = false }: Props) {
  const icon = CONDITION_ICON[weather.condition] ?? '🌡️';

  if (compact) {
    return (
      <span
        title={`${weather.description} | High: ${weather.tempHigh}°F, Low: ${weather.tempLow}°F`}
        className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full"
      >
        {icon} {weather.tempHigh}°
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-xl">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-xs capitalize">{weather.description}</span>
        <span className="text-xs">
          {weather.tempHigh}° / {weather.tempLow}°F
          {weather.precipitation > 0.3 && (
            <span className="ml-1 text-sky-500">💧 {Math.round(weather.precipitation * 100)}%</span>
          )}
        </span>
      </div>
    </div>
  );
}
