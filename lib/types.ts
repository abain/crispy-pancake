// ─── Clothing & Wardrobe ────────────────────────────────────────────────────

export type ClothingCategory = 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'socks';
export type OutfitContext = 'work' | 'gym' | 'evening' | 'casual';
export type WorkContext = 'off' | 'wfh' | 'in-office';
export type GymContext = 'run' | 'lift' | 'none';
export type EveningContext = 'practice' | 'game' | 'golf' | 'show' | 'dinner' | 'none';
export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'windy';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory?: string;
  color: string;
  colorFamily: 'cool' | 'warm' | 'neutral';
  /** Tags like ['casual', 'athletic', 'business-casual'] */
  style: string[];
  /** 1-5 scale: 1 = loungewear, 5 = formal */
  formality: number;
  weatherSuitability: {
    minTemp?: number; // Fahrenheit
    maxTemp?: number;
    conditions?: WeatherCondition[];
  };
  imageUrl?: string;
  /** true if part of the default pre-loaded wardrobe */
  isDefault: boolean;
  /** true if worn/used this week and needs laundering */
  isDirty: boolean;
  createdAt: string;
}

export interface Outfit {
  context: OutfitContext;
  items: ClothingItem[];
  notes?: string;
}

// ─── Planning ────────────────────────────────────────────────────────────────

export interface DayPlan {
  date: string;      // ISO date string
  dayOfWeek: string;
  work: WorkContext;
  gym: GymContext;
  evening: EveningContext;
  calendarEvents: CalendarEvent[];
  weather?: DayWeather;
  outfits: Outfit[];
  /** e.g. "Item reused due to limited wardrobe" */
  warnings?: string[];
}

export interface WeeklyPlan {
  weekStart: string;   // ISO date string (Sunday)
  weekEnd: string;     // ISO date string (Saturday)
  days: DayPlan[];
  generatedAt: string;
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export interface DayWeather {
  date: string;
  tempHigh: number;      // Fahrenheit
  tempLow: number;       // Fahrenheit
  condition: WeatherCondition;
  precipitation: number; // probability 0-1
  description: string;
}

export interface WeeklyForecast {
  location: string;
  days: DayWeather[];
  fetchedAt: string;
}

// ─── Event Styling ───────────────────────────────────────────────────────────

export interface EventSuggestion {
  eventDescription: string;
  eventDate: string;
  weather?: DayWeather;
  outfits: Outfit[];
}
