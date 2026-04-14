import type { WeeklyForecast, DayWeather, WeatherCondition } from './types';

const DEFAULT_LOCATION = 'St. Louis, MO';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

interface CacheEntry {
  data: WeeklyForecast;
  fetchedAt: number;
}

/** In-memory cache keyed by location string. */
const cache = new Map<string, CacheEntry>();

/** Returns a deterministic mock forecast – used when API key is not configured. */
export function getMockForecast(location: string = DEFAULT_LOCATION): WeeklyForecast {
  const today = new Date();
  const days: DayWeather[] = [];

  const mockPatterns: Array<{ high: number; low: number; condition: WeatherCondition; description: string; precip: number }> = [
    { high: 72, low: 58, condition: 'clear',   description: 'Sunny',          precip: 0.05 },
    { high: 65, low: 52, condition: 'cloudy',  description: 'Partly cloudy',  precip: 0.15 },
    { high: 58, low: 48, condition: 'rain',    description: 'Light rain',     precip: 0.75 },
    { high: 70, low: 55, condition: 'clear',   description: 'Sunny',          precip: 0.05 },
    { high: 68, low: 53, condition: 'cloudy',  description: 'Mostly cloudy',  precip: 0.20 },
    { high: 62, low: 50, condition: 'windy',   description: 'Breezy',         precip: 0.10 },
    { high: 75, low: 60, condition: 'clear',   description: 'Sunny',          precip: 0.02 },
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const pat = mockPatterns[i % mockPatterns.length];
    days.push({
      date: d.toISOString().split('T')[0],
      tempHigh: pat.high,
      tempLow: pat.low,
      condition: pat.condition,
      precipitation: pat.precip,
      description: pat.description,
    });
  }

  return {
    location,
    days,
    fetchedAt: new Date().toISOString(),
  };
}

/** Maps an OpenWeatherMap weather id to our WeatherCondition enum. */
function mapCondition(id: number, description: string): WeatherCondition {
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 300 && id < 400) return 'rain';
  if (id >= 200 && id < 300) return 'rain';
  if (id === 800) return 'clear';
  if (id >= 801 && id <= 804) return 'cloudy';
  if (description.toLowerCase().includes('wind')) return 'windy';
  return 'cloudy';
}

/**
 * Fetches the 7-day weather forecast from OpenWeatherMap.
 * Falls back to mock data if OPENWEATHER_API_KEY is not set.
 * Results are cached in memory for 4 hours.
 */
export async function fetchWeeklyForecast(
  location: string = DEFAULT_LOCATION,
): Promise<WeeklyForecast> {
  // Return cached result if still fresh
  const cached = cache.get(location);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  // If no API key configured, return mock data (dev / demo mode)
  if (!apiKey || apiKey === 'your_openweathermap_api_key') {
    console.info('[WeatherService] No API key configured – using mock forecast.');
    const mock = getMockForecast(location);
    cache.set(location, { data: mock, fetchedAt: Date.now() });
    return mock;
  }

  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
    const geoRes = await fetch(geoUrl);
    const geoData = (await geoRes.json()) as Array<{ lat: number; lon: number }>;
    if (!geoData.length) throw new Error(`Location not found: ${location}`);

    const { lat, lon } = geoData[0];
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial&cnt=40`;
    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json() as {
      list: Array<{
        dt: number;
        main: { temp_max: number; temp_min: number };
        weather: Array<{ id: number; description: string }>;
        pop: number;
      }>;
    };

    // OWM 5-day/3-hour forecast – group by date and take daily high/low
    const byDate = new Map<string, { highs: number[]; lows: number[]; conditions: WeatherCondition[]; descriptions: string[]; pops: number[] }>();

    for (const entry of forecastData.list) {
      const date = new Date(entry.dt * 1000).toISOString().split('T')[0];
      if (!byDate.has(date)) {
        byDate.set(date, { highs: [], lows: [], conditions: [], descriptions: [], pops: [] });
      }
      const day = byDate.get(date)!;
      day.highs.push(entry.main.temp_max);
      day.lows.push(entry.main.temp_min);
      const weather = entry.weather[0];
      day.conditions.push(mapCondition(weather.id, weather.description));
      day.descriptions.push(weather.description);
      day.pops.push(entry.pop ?? 0);
    }

    const days: DayWeather[] = Array.from(byDate.entries())
      .slice(0, 7)
      .map(([date, d]) => ({
        date,
        tempHigh: Math.round(Math.max(...d.highs)),
        tempLow: Math.round(Math.min(...d.lows)),
        condition: d.conditions[0],
        precipitation: Math.max(...d.pops),
        description: d.descriptions[0],
      }));

    const result: WeeklyForecast = {
      location,
      days,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(location, { data: result, fetchedAt: Date.now() });
    return result;
  } catch (err) {
    console.error('[WeatherService] API error, falling back to mock data:', err);
    const mock = getMockForecast(location);
    cache.set(location, { data: mock, fetchedAt: Date.now() });
    return mock;
  }
}
