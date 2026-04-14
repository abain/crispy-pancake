import { NextResponse } from 'next/server';
import { outfitPlanner } from '@/lib/outfitPlanner';
import { fetchWeeklyForecast } from '@/lib/weatherService';
import closetManager from '@/lib/closetManager';

interface RequestBody {
  description: string;
  date: string;
  location?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { description, date, location } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Event description is required' },
        { status: 400 },
      );
    }
    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'Event date is required' },
        { status: 400 },
      );
    }

    // Optionally fetch weather for the event date
    let dayWeather;
    try {
      const forecast = await fetchWeeklyForecast(location);
      dayWeather = forecast.days.find((d) => d.date === date);
    } catch {
      // Weather fetch failure is non-fatal
    }

    const wardrobe = closetManager.getAll();
    const outfits = outfitPlanner.generateEventOutfits(description, date, dayWeather, wardrobe);

    return NextResponse.json({
      eventDescription: description,
      eventDate: date,
      weather: dayWeather,
      outfits,
    });
  } catch (err) {
    console.error('[/api/getEventSuggestions] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate event suggestions' },
      { status: 500 },
    );
  }
}
