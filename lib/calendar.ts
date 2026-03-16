import { google } from 'googleapis';
import { db } from './db';
import { accountsTable } from '../schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './encryption';

export class CalendarService {
  private static async getOAuth2Client(userId: string) {
    const account = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.userId, userId))
      .limit(1);

    if (account.length === 0) {
      throw new Error('No Google account linked');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      access_token: decrypt(account[0].access_token),
      refresh_token: decrypt(account[0].refresh_token),
    });

    // Handle token refresh — encrypt before persisting
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await db.update(accountsTable)
          .set({
            refresh_token: encrypt(tokens.refresh_token),
            access_token: encrypt(tokens.access_token ?? null),
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
          })
          .where(eq(accountsTable.userId, userId));
      } else {
        await db.update(accountsTable)
          .set({
            access_token: encrypt(tokens.access_token ?? null),
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
          })
          .where(eq(accountsTable.userId, userId));
      }
    });

    return oauth2Client;
  }

  static async getEvents(userId: string, calendarId = 'primary', timeMin?: Date, timeMax?: Date) {
    const oauth2Client = await this.getOAuth2Client(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin?.toISOString(),
      timeMax: timeMax?.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  }

  static async createEvent(userId: string, event: {
    summary: string;
    start: { dateTime: string };
    end: { dateTime: string };
    attendees?: { email: string }[];
    description?: string;
  }, calendarId = 'primary') {
    const oauth2Client = await this.getOAuth2Client(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    return response.data;
  }

  static async getFreeBusy(userId: string, timeMin: Date, timeMax: Date, calendarIds: string[]) {
    const oauth2Client = await this.getOAuth2Client(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map(id => ({ id })),
      },
    });

    return response.data.calendars;
  }

  static async findAvailableSlots(
    userId: string,
    attendees: string[],
    durationMinutes: number,
    preferredStart?: Date,
    preferredEnd?: Date,
    timeMin = new Date(),
    timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
  ) {
    // For simplicity, assume attendees are Gmail addresses
    const calendarIds = [`${userId}@gmail.com`, ...attendees];
    const freeBusy = await this.getFreeBusy(userId, timeMin, timeMax, calendarIds);

    // Simple slot finding logic - find overlapping free periods
    const slots: { start: Date; end: Date }[] = [];
    const durationMs = durationMinutes * 60 * 1000;

    // This is a basic implementation - in production, you'd want more sophisticated logic
    // Check every 30-minute interval for availability
    let current = new Date(timeMin);
    while (current < timeMax) {
      const slotEnd = new Date(current.getTime() + durationMs);
      if (slotEnd > timeMax) break;

      // Check if all calendars are free during this slot
      let isFree = true;
      for (const [, busyTimes] of Object.entries(freeBusy || {})) {
        const busy = busyTimes as { busy?: { start: string; end: string }[] };
        for (const period of busy.busy || []) {
          const busyStart = new Date(period.start);
          const busyEnd = new Date(period.end);
          if (current < busyEnd && slotEnd > busyStart) {
            isFree = false;
            break;
          }
        }
        if (!isFree) break;
      }

      if (isFree) {
        slots.push({ start: new Date(current), end: slotEnd });
      }

      // Move to next 30-minute slot
      current = new Date(current.getTime() + 30 * 60 * 1000);
    }

    // Filter by preferred times if provided
    if (preferredStart && preferredEnd) {
      return slots.filter(slot => slot.start >= preferredStart && slot.end <= preferredEnd);
    }

    return slots.slice(0, 10); // Return top 10 slots
  }

  static async createMeeting(
    userId: string,
    title: string,
    startTime: Date,
    endTime: Date,
    attendees: string[],
    description?: string
  ) {
    const event = {
      summary: title,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: attendees.map(email => ({ email })),
      description,
    };

    return await this.createEvent(userId, event);
  }
}