import { NextResponse } from 'next/server';
import { fetchWeeklyForecast } from '@/lib/weatherService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') ?? 'St. Louis, MO';

    const forecast = await fetchWeeklyForecast(location);
    return NextResponse.json(forecast);
  } catch (err) {
    console.error('[/api/getWeather] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch weather forecast' },
      { status: 500 },
    );
  }
}
