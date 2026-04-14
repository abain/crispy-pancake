import { NextResponse } from 'next/server';
import { fetchCalendarEvents } from '@/lib/calendarService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // Default to the current week (Sunday–Saturday) if not provided
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);

    const startDate = startParam ? new Date(startParam) : sunday;
    const endDate = endParam ? new Date(endParam) : saturday;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 (e.g. 2024-01-14).' },
        { status: 400 },
      );
    }

    const events = await fetchCalendarEvents(startDate, endDate);
    return NextResponse.json({ events, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[/api/fetchCalendar] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 },
    );
  }
}
