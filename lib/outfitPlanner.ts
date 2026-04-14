import type {
  ClothingItem,
  ClothingCategory,
  Outfit,
  OutfitContext,
  DayPlan,
  WeeklyPlan,
  CalendarEvent,
  WeeklyForecast,
  DayWeather,
  WorkContext,
  GymContext,
  EveningContext,
  WeatherCondition,
} from './types';
import {
  parseWorkContext,
  parseGymContext,
  parseEveningContext,
} from './calendarService';

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/** Returns true if the item's weather suitability covers the given temperature. */
function isTempSuitable(item: ClothingItem, temp: number): boolean {
  const { minTemp, maxTemp } = item.weatherSuitability;
  if (minTemp !== undefined && temp < minTemp) return false;
  if (maxTemp !== undefined && temp > maxTemp) return false;
  return true;
}

/** Returns true if the item can be worn in the given weather condition. */
function isConditionSuitable(item: ClothingItem, condition: WeatherCondition): boolean {
  const { conditions } = item.weatherSuitability;
  if (!conditions || conditions.length === 0) return true; // no restriction
  return conditions.includes(condition);
}

/**
 * Score an item for how well it matches context requirements.
 * Higher is better.
 */
function scoreItem(
  item: ClothingItem,
  targetFormality: number,
  requiredStyles: string[],
  weather: DayWeather | undefined,
): number {
  let score = 0;

  // Formality match (penalty grows with distance)
  const formalityDiff = Math.abs(item.formality - targetFormality);
  score += Math.max(0, 5 - formalityDiff * 2);

  // Style tag overlap
  const overlap = item.style.filter((s) => requiredStyles.includes(s)).length;
  score += overlap * 3;

  // Cool color preference
  if (item.colorFamily === 'cool') score += 1;

  // Weather suitability
  if (weather) {
    const avgTemp = (weather.tempHigh + weather.tempLow) / 2;
    if (isTempSuitable(item, avgTemp)) score += 2;
    if (isConditionSuitable(item, weather.condition)) score += 2;
  }

  return score;
}

// ─── Item selection ───────────────────────────────────────────────────────────

/**
 * Selects the best matching item from a list for a given category.
 * Prefers clean (not dirty) items, then falls back to dirty with a warning.
 */
function pickBest(
  candidates: ClothingItem[],
  targetFormality: number,
  requiredStyles: string[],
  weather: DayWeather | undefined,
  usedIds: Set<string>,
  warnings: string[],
  context: string,
): ClothingItem | null {
  if (candidates.length === 0) return null;

  // Prefer unused + clean items
  const fresh = candidates.filter((i) => !i.isDirty && !usedIds.has(i.id));
  const pool = fresh.length > 0 ? fresh : candidates.filter((i) => !i.isDirty);

  // If nothing clean, reuse dirty items with a warning
  const finalPool = pool.length > 0 ? pool : candidates;
  if (finalPool.length > 0 && pool.length === 0) {
    warnings.push(`All ${candidates[0].category} items are dirty – reusing for ${context} outfit.`);
  }

  finalPool.sort(
    (a, b) =>
      scoreItem(b, targetFormality, requiredStyles, weather) -
      scoreItem(a, targetFormality, requiredStyles, weather),
  );

  return finalPool[0] ?? null;
}

/**
 * Selects a complete outfit for the given context.
 * Marks chosen items as used in usedIds.
 */
function selectOutfitItems(
  context: OutfitContext,
  weather: DayWeather | undefined,
  availableItems: ClothingItem[],
  usedIds: Set<string>,
  warnings: string[],
  variationOffset = 0, // used to get different combos for multiple outfits
): Outfit {
  // ── Context → formality & style requirements ──────────────────────────────
  let targetFormality = 2;
  let requiredStyles: string[] = ['casual'];
  let notes = '';

  const avgTemp = weather ? (weather.tempHigh + weather.tempLow) / 2 : 65;
  const condition = weather?.condition ?? 'clear';

  switch (context) {
    case 'work':
      targetFormality = 4;
      requiredStyles = ['business-casual', 'office'];
      notes = 'Work outfit';
      break;
    case 'gym':
      targetFormality = 1;
      requiredStyles = ['athletic', 'gym'];
      notes = 'Gym outfit';
      break;
    case 'evening':
      targetFormality = 3;
      requiredStyles = ['smart-casual', 'evening'];
      notes = 'Evening outfit';
      break;
    case 'casual':
    default:
      targetFormality = 2;
      requiredStyles = ['casual', 'versatile'];
      notes = 'Casual outfit';
      break;
  }

  // ── Build category-filtered pools ─────────────────────────────────────────
  const byCategory = (cat: ClothingCategory) =>
    availableItems.filter((i) => i.category === cat);

  // Rotate index so variation N skips the first N items
  const rotated = (arr: ClothingItem[], offset: number) => {
    const idx = offset % Math.max(arr.length, 1);
    return [...arr.slice(idx), ...arr.slice(0, idx)];
  };

  const items: ClothingItem[] = [];

  // Top
  const top = pickBest(
    rotated(byCategory('top'), variationOffset),
    targetFormality,
    requiredStyles,
    weather,
    usedIds,
    warnings,
    context,
  );
  if (top) { items.push(top); usedIds.add(top.id); }

  // Bottom
  const bottom = pickBest(
    rotated(byCategory('bottom'), variationOffset),
    targetFormality,
    requiredStyles,
    weather,
    usedIds,
    warnings,
    context,
  );
  if (bottom) { items.push(bottom); usedIds.add(bottom.id); }

  // Shoes
  const shoes = pickBest(
    rotated(byCategory('shoes'), variationOffset),
    targetFormality,
    requiredStyles,
    weather,
    usedIds,
    warnings,
    context,
  );
  if (shoes) { items.push(shoes); usedIds.add(shoes.id); }

  // Socks (if wearing shoes that need them)
  if (shoes && shoes.subcategory !== 'sandals') {
    const socks = pickBest(
      rotated(byCategory('socks'), variationOffset),
      targetFormality,
      requiredStyles,
      weather,
      usedIds,
      warnings,
      context,
    );
    if (socks) { items.push(socks); usedIds.add(socks.id); }
  }

  // Outerwear based on temperature / weather
  if (avgTemp < 40 || condition === 'snow') {
    const coat = pickBest(
      byCategory('outerwear').filter((i) => i.subcategory === 'coat'),
      targetFormality,
      requiredStyles,
      weather,
      usedIds,
      warnings,
      context,
    );
    if (coat) { items.push(coat); usedIds.add(coat.id); }
  } else if (avgTemp < 60 || condition === 'rain') {
    const jacket = pickBest(
      byCategory('outerwear').filter((i) =>
        condition === 'rain'
          ? i.subcategory === 'rain-jacket'
          : i.subcategory !== 'coat',
      ),
      targetFormality,
      requiredStyles,
      weather,
      usedIds,
      warnings,
      context,
    );
    if (jacket) { items.push(jacket); usedIds.add(jacket.id); }
  }

  // Add cold-weather accessories
  if (avgTemp < 40) {
    const beanie = availableItems.find(
      (i) => i.category === 'accessory' && i.subcategory === 'hat' && i.name.toLowerCase().includes('beanie') && !usedIds.has(i.id),
    );
    if (beanie) { items.push(beanie); usedIds.add(beanie.id); }
  }

  // Belt for formal/business contexts
  if (targetFormality >= 3) {
    const belt = pickBest(
      byCategory('accessory').filter((i) => i.subcategory === 'belt'),
      targetFormality,
      requiredStyles,
      weather,
      usedIds,
      warnings,
      context,
    );
    if (belt) { items.push(belt); usedIds.add(belt.id); }
  }

  return { context, items, notes };
}

// ─── Main Planner Class ───────────────────────────────────────────────────────

export class OutfitPlanner {
  /**
   * Generate a complete 7-day outfit plan.
   * Each day gets outfits for its detected contexts.
   */
  generateWeeklyPlan(
    events: CalendarEvent[],
    forecast: WeeklyForecast,
    wardrobe: ClothingItem[],
  ): WeeklyPlan {
    // Build the week range (today's week, Sun–Sat)
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const weekStart = sunday.toISOString().split('T')[0];
    const weekEnd = saturday.toISOString().split('T')[0];

    const days: DayPlan[] = [];

    // Track items used across the entire week to avoid repeats
    const weeklyUsedIds = new Set<string>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;

      // Filter events for this day
      const dayEvents = events.filter((e) => e.start.startsWith(dateStr));

      // Determine contexts
      let workCtx: WorkContext = isWeekday ? 'wfh' : 'off';
      let gymCtx: GymContext = 'none';
      let eveningCtx: EveningContext = 'none';

      for (const evt of dayEvents) {
        const wc = parseWorkContext(evt.title);
        if (wc) workCtx = wc;
        const gc = parseGymContext(evt.title);
        if (gc) gymCtx = gc;
        const ec = parseEveningContext(evt.title);
        if (ec) eveningCtx = ec;
      }

      // Find weather for this day
      const weather = forecast.days.find((d) => d.date === dateStr);
      const warnings: string[] = [];

      const outfits: Outfit[] = [];
      const dayUsedIds = new Set<string>(weeklyUsedIds);

      // Work outfit (weekdays only, or when explicitly scheduled)
      if (workCtx !== 'off') {
        const workContext: OutfitContext = workCtx === 'in-office' ? 'work' : 'casual';
        const outfit = selectOutfitItems(workContext, weather, wardrobe, dayUsedIds, warnings, 0);
        outfit.notes = workCtx === 'in-office' ? 'In-office – business casual' : 'Work from home – casual';
        outfits.push(outfit);
      }

      // Gym outfit
      if (gymCtx !== 'none') {
        const outfit = selectOutfitItems('gym', weather, wardrobe, dayUsedIds, warnings, 1);
        outfit.notes = gymCtx === 'run' ? 'Running outfit' : 'Gym / lifting outfit';
        outfits.push(outfit);
      }

      // Evening outfit
      if (eveningCtx !== 'none') {
        const formalityMap: Record<EveningContext, number> = {
          practice: 1, game: 1, golf: 2, show: 4, dinner: 3, none: 2,
        };
        const outfit = selectOutfitItems('evening', weather, wardrobe, dayUsedIds, warnings, 2);
        outfit.notes = `Evening – ${eveningCtx}`;
        // Adjust formality note
        if (formalityMap[eveningCtx] >= 4) {
          outfit.notes += ' (dressy)';
        }
        outfits.push(outfit);
      }

      // Weekend casual outfit if nothing scheduled
      if (outfits.length === 0) {
        const outfit = selectOutfitItems('casual', weather, wardrobe, dayUsedIds, warnings, i);
        outfit.notes = 'Weekend casual';
        outfits.push(outfit);
      }

      // Commit day's used items to weekly tracker
      dayUsedIds.forEach((id) => weeklyUsedIds.add(id));

      days.push({
        date: dateStr,
        dayOfWeek,
        work: workCtx,
        gym: gymCtx,
        evening: eveningCtx,
        calendarEvents: dayEvents,
        weather,
        outfits,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    }

    return {
      weekStart,
      weekEnd,
      days,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate 3 outfit suggestions for a specific event.
   * Parses the event description for style/formality keywords.
   */
  generateEventOutfits(
    description: string,
    date: string,
    weather: DayWeather | undefined,
    wardrobe: ClothingItem[],
  ): Outfit[] {
    const desc = description.toLowerCase();

    // Determine formality from description keywords
    let targetFormality = 3;
    let context: OutfitContext = 'evening';

    if (/\b(wedding|gala|black tie|formal|opera)\b/.test(desc)) {
      targetFormality = 5;
      context = 'evening';
    } else if (/\b(dinner|restaurant|date|show|theater|concert)\b/.test(desc)) {
      targetFormality = 3;
      context = 'evening';
    } else if (/\b(interview|office|business|meeting|conference)\b/.test(desc)) {
      targetFormality = 4;
      context = 'work';
    } else if (/\b(gym|run|workout|sport|athletic)\b/.test(desc)) {
      targetFormality = 1;
      context = 'gym';
    } else if (/\b(golf|polo|course)\b/.test(desc)) {
      targetFormality = 2;
      context = 'evening';
    } else if (/\b(casual|bbq|picnic|park|beach|friend)\b/.test(desc)) {
      targetFormality = 2;
      context = 'casual';
    }

    // Generate 3 distinct outfit variations
    const outfits: Outfit[] = [];
    const usedCombos = new Set<string>(); // track to ensure variety

    for (let i = 0; i < 3; i++) {
      const usedIds = new Set<string>();
      // Seed previous outfits' items so we get variation
      for (const prev of outfits) {
        prev.items.forEach((item) => usedIds.add(item.id));
      }
      const outfit = selectOutfitItems(context, weather, wardrobe, usedIds, [], i);
      outfit.notes = `Option ${i + 1} – ${description}`;

      // Deduplicate outfit by item combo fingerprint
      const fingerprint = outfit.items
        .map((i) => i.id)
        .sort()
        .join(',');
      if (!usedCombos.has(fingerprint)) {
        usedCombos.add(fingerprint);
        outfits.push(outfit);
      }
    }

    // Ensure we always return exactly 3 (fill with variations if needed)
    while (outfits.length < 3) {
      const filler = selectOutfitItems(context, weather, wardrobe, new Set(), [], outfits.length + 10);
      filler.notes = `Option ${outfits.length + 1} – ${description} (variation)`;
      outfits.push(filler);
    }

    return outfits;
  }
}

export const outfitPlanner = new OutfitPlanner();
