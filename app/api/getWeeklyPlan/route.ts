import { NextResponse } from 'next/server';
import { fetchCalendarEvents } from '@/lib/calendarService';

export const dynamic = 'force-dynamic';
import { fetchWeeklyForecast } from '@/lib/weatherService';
import { outfitPlanner } from '@/lib/outfitPlanner';
import closetManager from '@/lib/closetManager';

export async function GET() {
  try {
    // Build week range: Sunday → Saturday of the current week
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);

    const [events, forecast] = await Promise.all([
      fetchCalendarEvents(sunday, saturday),
      fetchWeeklyForecast(),
    ]);

    const wardrobe = closetManager.getAll();
    const plan = outfitPlanner.generateWeeklyPlan(events, forecast, wardrobe);

    return NextResponse.json(plan);
  } catch (err) {
    console.error('[/api/getWeeklyPlan] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate weekly plan' },
      { status: 500 },
    );
  }
}
