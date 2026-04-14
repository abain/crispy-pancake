'use client';

import type { WeeklyPlan } from '@/lib/types';
import DayOutfitRow from './DayOutfitRow';

interface Props {
  plan: WeeklyPlan;
}

export default function WeeklyCalendar({ plan }: Props) {
  const weekLabel = `${new Date(plan.weekStart + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })} – ${new Date(plan.weekEnd + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;

  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-700">{weekLabel}</h2>
        <span className="text-xs text-gray-400">
          Generated {new Date(plan.generatedAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Day rows */}
      <div className="space-y-4">
        {plan.days.map((day) => (
          <DayOutfitRow key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}
