import type { CalendarEvent, WorkContext, GymContext, EveningContext } from './types';

/** Mock calendar events for dev / demo when Google Calendar is not configured. */
function getMockEvents(startDate: Date, endDate: Date): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
    const dateStr = current.toISOString().split('T')[0];

    if (dayOfWeek === 1) {
      // Monday – WFH day
      events.push({
        id: `mock-wfh-${dateStr}`,
        title: 'Work from home',
        start: `${dateStr}T09:00:00`,
        end: `${dateStr}T17:00:00`,
      });
      events.push({
        id: `mock-gym-${dateStr}`,
        title: 'Morning run',
        start: `${dateStr}T06:30:00`,
        end: `${dateStr}T07:30:00`,
      });
    } else if (dayOfWeek === 2) {
      // Tuesday – in-office
      events.push({
        id: `mock-office-${dateStr}`,
        title: 'In office – team standup',
        start: `${dateStr}T09:00:00`,
        end: `${dateStr}T17:00:00`,
      });
    } else if (dayOfWeek === 3) {
      // Wednesday – WFH + gym
      events.push({
        id: `mock-wfh2-${dateStr}`,
        title: 'WFH – deep work',
        start: `${dateStr}T09:00:00`,
        end: `${dateStr}T17:00:00`,
      });
      events.push({
        id: `mock-lift-${dateStr}`,
        title: 'Gym – lift session',
        start: `${dateStr}T18:00:00`,
        end: `${dateStr}T19:30:00`,
      });
    } else if (dayOfWeek === 4) {
      // Thursday – in-office + dinner
      events.push({
        id: `mock-office2-${dateStr}`,
        title: 'Office – project review',
        start: `${dateStr}T09:00:00`,
        end: `${dateStr}T17:00:00`,
      });
      events.push({
        id: `mock-dinner-${dateStr}`,
        title: 'Team dinner',
        start: `${dateStr}T19:00:00`,
        end: `${dateStr}T21:00:00`,
      });
    } else if (dayOfWeek === 5) {
      // Friday – WFH
      events.push({
        id: `mock-wfh3-${dateStr}`,
        title: 'WFH – Friday wrap-up',
        start: `${dateStr}T09:00:00`,
        end: `${dateStr}T17:00:00`,
      });
    } else if (dayOfWeek === 6) {
      // Saturday – golf
      events.push({
        id: `mock-golf-${dateStr}`,
        title: 'Golf with friends',
        start: `${dateStr}T08:00:00`,
        end: `${dateStr}T13:00:00`,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return events;
}

// ─── Context Parsers ──────────────────────────────────────────────────────────

/**
 * Parses an event title to determine the work context for that day.
 * Returns null if the event doesn't appear to be work-related.
 */
export function parseWorkContext(title: string): WorkContext | null {
  const t = title.toLowerCase();
  if (/\b(off|pto|vacation|holiday|leave)\b/.test(t)) return 'off';
  if (/\b(wfh|work from home|remote|home office)\b/.test(t)) return 'wfh';
  if (/\b(office|in-office|onsite|on-site|meeting room|standup|stand-up)\b/.test(t)) return 'in-office';
  return null;
}

/**
 * Parses an event title to determine gym context.
 * Returns null if not gym-related.
 */
export function parseGymContext(title: string): GymContext | null {
  const t = title.toLowerCase();
  if (/\b(run|jog|jogs|5k|10k|marathon|half marathon|trail run)\b/.test(t)) return 'run';
  if (/\b(gym|lift|lifting|workout|crossfit|weight|bench|squat|deadlift|strength)\b/.test(t)) return 'lift';
  return null;
}

/**
 * Parses an event title to determine evening context.
 * Returns null if not an evening activity.
 */
export function parseEveningContext(title: string): EveningContext | null {
  const t = title.toLowerCase();
  if (/\b(practice|training session)\b/.test(t)) return 'practice';
  if (/\b(game|match|tournament|playoff|soccer|baseball|basketball|football|lacrosse)\b/.test(t)) return 'game';
  if (/\b(golf|tee time|driving range)\b/.test(t)) return 'golf';
  if (/\b(show|theater|theatre|concert|opera|ballet|musical|performance)\b/.test(t)) return 'show';
  if (/\b(dinner|restaurant|bistro|gala|banquet|brunch)\b/.test(t)) return 'dinner';
  return null;
}

/**
 * Fetches calendar events from Google Calendar.
 * Falls back to mock data if Google credentials are not configured.
 */
export async function fetchCalendarEvents(
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!calendarId || !clientEmail || !privateKey ||
      calendarId === 'your_calendar_id@group.calendar.google.com') {
    console.info('[CalendarService] Google Calendar not configured – using mock events.');
    return getMockEvents(startDate, endDate);
  }

  try {
    // Build a JWT access token for the Google Calendar service account
    const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = Buffer.from(
      JSON.stringify({
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      }),
    ).toString('base64url');

    // NOTE: crypto.subtle is used here for RSA-SHA256 signing (available in Node 18+/Edge runtime)
    const pemKey = privateKey.replace(/\\n/g, '\n');
    const keyData = pemKey
      .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
      .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');
    const binaryKey = Buffer.from(keyData, 'base64');

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signingInput = `${jwtHeader}.${jwtPayload}`;
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      Buffer.from(signingInput),
    );
    const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    // Fetch events from Google Calendar
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    });

    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const eventsData = await eventsRes.json() as {
      items: Array<{
        id: string;
        summary: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
      }>;
    };

    return (eventsData.items ?? []).map((item) => ({
      id: item.id,
      title: item.summary ?? '(no title)',
      start: item.start.dateTime ?? item.start.date ?? '',
      end: item.end.dateTime ?? item.end.date ?? '',
      allDay: !item.start.dateTime,
    }));
  } catch (err) {
    console.error('[CalendarService] Google Calendar error, falling back to mock:', err);
    return getMockEvents(startDate, endDate);
  }
}
