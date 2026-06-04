import { google, calendar_v3 } from 'googleapis';
import { env } from '../config/env';

// Authentication
const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

export async function checkAvailability(timeMin: string, timeMax: string) {
  try {
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: env.GOOGLE_CALENDAR_ID }],
      },
    });
    return res.data.calendars?.[env.GOOGLE_CALENDAR_ID]?.busy || [];
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
}

export async function createEvent(
  summary: string,
  startTime: string,
  endTime: string,
  attendeeEmail: string,
  attendeeName: string
) {
  try {
    const res = await calendar.events.insert({
      calendarId: env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: summary,
        description: `Meeting booked via Anup's AI Voice Agent.\nAttendee: ${attendeeName} (${attendeeEmail})`,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        attendees: [{ email: attendeeEmail }],
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// Simple slot generator logic
export async function getAvailableSlots(dateString: string) {
  // Assuming dateString is "YYYY-MM-DD"
  const startOfDay = new Date(`${dateString}T09:00:00+05:30`); // 9 AM IST
  const endOfDay = new Date(`${dateString}T18:00:00+05:30`); // 6 PM IST

  const busySlots = await checkAvailability(startOfDay.toISOString(), endOfDay.toISOString());
  
  // Logic to find free 30-min slots
  let slots = [];
  let current = new Date(startOfDay);
  while (current < endOfDay) {
    let next = new Date(current.getTime() + 30 * 60000); // +30 mins
    
    let isBusy = busySlots.some(busy => {
      let bStart = new Date(busy.start!);
      let bEnd = new Date(busy.end!);
      return (current >= bStart && current < bEnd) || (next > bStart && next <= bEnd);
    });

    if (!isBusy) {
      slots.push({
        start: current.toISOString(),
        end: next.toISOString()
      });
    }

    current = next;
  }

  return slots;
}
