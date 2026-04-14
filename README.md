# 👗 Personal Stylist

A full-featured AI-powered wardrobe planner built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## Features

| Feature | Description |
|---------|-------------|
| 📅 **Weekly Planner** | Generates a 7-day outfit plan based on your calendar events and local weather forecast |
| 👔 **Closet Manager** | View, add, edit, and remove clothing items; mark items as clean/dirty |
| ✨ **Event Stylist** | Describe any event and receive 3 curated outfit suggestions |

---

## Tech Stack

- **Next.js 14** – App Router, React Server Components
- **TypeScript** – full type safety throughout
- **Tailwind CSS** – responsive, utility-first styling
- **React Context** – client-side wardrobe state
- OpenWeatherMap API (optional) – live 7-day weather forecasts
- Google Calendar API (optional) – pull events from your calendar

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys (all optional – mock data is used if not set):

| Variable | Description |
|----------|-------------|
| `OPENWEATHER_API_KEY` | [OpenWeatherMap](https://openweathermap.org/api) API key |
| `GOOGLE_CALENDAR_ID` | Google Calendar ID (e.g. `user@gmail.com`) |
| `GOOGLE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | RSA private key for the service account |
| `NEXT_PUBLIC_APP_URL` | Base URL (default: `http://localhost:3000`) |

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm start
```

---

## Project Structure

```
crispy-pancake/
├── app/
│   ├── api/
│   │   ├── addClothing/        POST – add a clothing item
│   │   ├── updateClothing/     PUT  – update an item by id
│   │   ├── deleteClothing/     DELETE – remove an item
│   │   ├── launderItems/       POST – mark all items clean
│   │   ├── fetchCalendar/      GET  – fetch calendar events
│   │   ├── getWeather/         GET  – fetch weather forecast
│   │   ├── getWeeklyPlan/      GET  – generate weekly outfit plan
│   │   └── getEventSuggestions/ POST – outfit suggestions for an event
│   ├── closet/page.tsx         Closet management page
│   ├── event/page.tsx          Event styling page
│   ├── page.tsx                Weekly planner (home page)
│   ├── layout.tsx              Root layout (Navigation + WardrobeProvider)
│   ├── globals.css             Tailwind base styles
│   ├── components/             Reusable UI components
│   └── context/                React Context (WardrobeContext)
├── lib/
│   ├── types.ts                All TypeScript types/interfaces
│   ├── defaultWardrobe.ts      Pre-loaded men's wardrobe items
│   ├── closetManager.ts        In-memory CRUD store for clothing items
│   ├── weatherService.ts       OpenWeatherMap integration + mock fallback
│   ├── calendarService.ts      Google Calendar integration + mock fallback
│   └── outfitPlanner.ts        Core outfit generation logic
├── .env.example
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## How It Works

### Outfit Planning Logic

1. **Context Detection** – Each calendar event title is parsed for keywords:
   - Work: `"WFH"`, `"office"`, `"meeting"` → `wfh` / `in-office`
   - Gym: `"run"`, `"gym"`, `"lift"`, `"workout"` → `run` / `lift`
   - Evening: `"dinner"`, `"golf"`, `"concert"`, `"game"` → corresponding context

2. **Weather Rules**
   - `< 40°F` → winter coat + beanie
   - `40–60°F` → jacket/sweater layer
   - `> 75°F` → shorts/t-shirt weather
   - Rain → rain jacket + appropriate shoes

3. **Item Scoring** – Items are scored by formality match, style-tag overlap, color family preference (cool colors prioritized), and weather suitability.

4. **No-Repeat Policy** – Items used on one day are tracked and excluded from subsequent days. A warning is shown if an item must be reused.

### Mock Data

The app works without any API keys:
- **Weather**: Deterministic 7-day mock forecast for St. Louis, MO
- **Calendar**: Mock week with WFH days, office days, gym sessions, dinner, and golf

---

## Development Guide

### Adding Clothing Items

Use the **My Closet** page to add custom items via the form, or add them programmatically to `lib/defaultWardrobe.ts` with `isDefault: true`.

### Persisting Data

The current implementation uses an **in-memory store** (`lib/closetManager.ts`) that resets on server restart. To persist data:
1. Install Prisma: `npm install prisma @prisma/client`
2. Configure a database in `prisma/schema.prisma`
3. Replace the `store` array in `closetManager.ts` with Prisma queries

### Adding API Keys

The app gracefully falls back to mock data for all external services. Configure `.env.local` to enable live data:
- Weather updates every 4 hours (cached in memory)
- Calendar events are fetched fresh on each `/api/getWeeklyPlan` call

---

## License

MIT