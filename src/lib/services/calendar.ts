import { siteConfig } from '../config';

/**
 * Calendar provider abstraction.
 *
 * Today this is a "booking request" mode — it does NOT fake availability or
 * invent meeting links. When a real provider is configured (Google Calendar,
 * Microsoft Calendar, Calendly, or Cal.com via edge functions + secrets), the
 * provider implementation will check real availability and create real events.
 *
 * The UI calls these functions; they never call provider APIs directly from
 * the browser (secrets stay server-side).
 */

export type AvailabilitySlot = {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h, local to the slot's timezone)
  label: string; // display label e.g. "10:00 AM"
};

export type BookingResult =
  | { ok: true; calendarEventId?: string; meetingLink?: string }
  | { ok: false; reason: 'not_configured' | 'error'; message: string };

export type CalendarProvider = {
  /** Human-readable name for display. */
  name: string;
  /** Whether a real provider is wired up (env vars present). */
  configured: boolean;
  /** Fetch available slots for a given date. Returns [] when not configured. */
  getAvailability(date: Date): Promise<AvailabilitySlot[]>;
  /** Attempt to create a booking. Returns request-mode result when not configured. */
  createBooking(input: BookingInput): Promise<BookingResult>;
};

export type BookingInput = {
  leadId: string;
  service: string;
  meetingType: string;
  date: string;
  time: string;
  timezone: string;
  durationMinutes: number;
  customerName: string;
  customerEmail: string;
};

/**
 * Default provider. In request mode it returns a fixed set of illustrative
 * time slots so the visitor can pick a preferred time — this is NOT real
 * availability. The confirmation screen honestly says "request received."
 */
class RequestModeProvider implements CalendarProvider {
  name = 'Booking Request';
  configured = false;

  async getAvailability(): Promise<AvailabilitySlot[]> {
    // Illustrative slots — these represent preferred times the visitor can
    // request, not real calendar availability.
    return [
      { date: '', time: '09:00', label: '9:00 AM' },
      { date: '', time: '11:00', label: '11:00 AM' },
      { date: '', time: '13:00', label: '1:00 PM' },
      { date: '', time: '15:00', label: '3:00 PM' },
      { date: '', time: '17:00', label: '5:00 PM' },
    ];
  }

  async createBooking(): Promise<BookingResult> {
    return {
      ok: false,
      reason: 'not_configured',
      message:
        'Calendar integration is not connected yet. Your consultation request has been saved and our team will confirm the meeting manually.',
    };
  }
}

export const calendarProvider: CalendarProvider = new RequestModeProvider();

export function isCalendarConfigured(): boolean {
  return siteConfig.calendarEnabled && siteConfig.calendarProvider !== 'none';
}
