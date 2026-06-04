import { google } from 'googleapis';

function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const calendar = getCalendarClient();
    const startOfDay = new Date(`${date}T09:00:00+05:30`);
    const endOfDay = new Date(`${date}T18:00:00+05:30`);

    const busyRes = await calendar.freebusy.query({
      requestBody: {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    });

    const busySlots = busyRes.data.calendars?.[process.env.GOOGLE_CALENDAR_ID!]?.busy || [];

    const slots = [];
    let current = new Date(startOfDay);
    while (current < endOfDay) {
      const next = new Date(current.getTime() + 30 * 60000);
      const isBusy = busySlots.some(busy => {
        const bStart = new Date(busy.start!);
        const bEnd = new Date(busy.end!);
        return (current >= bStart && current < bEnd) || (next > bStart && next <= bEnd);
      });

      if (!isBusy) {
        slots.push({
          start: current.toISOString(),
          label: current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST',
        });
      }
      current = next;
    }

    return Response.json({ slots, date });
  } catch (error: any) {
    console.error('[Calendar GET Error]', error);
    return Response.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { dateTime, name, email } = await request.json();

    if (!dateTime || !name || !email) {
      return Response.json({ error: 'dateTime, name, and email are required' }, { status: 400 });
    }

    const calendar = getCalendarClient();
    const start = new Date(dateTime);
    const end = new Date(start.getTime() + 30 * 60000);

    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `Interview with ${name} — Scaler AI Role`,
        description: `Meeting booked via Anup's AI Chat Interface.\nAttendee: ${name} (${email})`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: [{ email }],
      },
    });

    return Response.json({
      success: true,
      eventId: event.data.id,
      summary: event.data.summary,
      start: event.data.start?.dateTime,
    });
  } catch (error: any) {
    console.error('[Calendar POST Error]', error);
    return Response.json({ error: 'Failed to book meeting' }, { status: 500 });
  }
}
