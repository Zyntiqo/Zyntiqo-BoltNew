/**
 * Centralized site configuration.
 * Add new integration values via environment variables (see .env.example).
 */

function bool(val: string | undefined, fallback = false): boolean {
  if (val === undefined) return fallback;
  return val === 'true' || val === '1';
}

export const siteConfig = {
  brand: 'Zyntiqo',
  tagline: 'Build. Grow. Automate.',
  email: 'wecare@zyntiqo.com',
  website: 'https://www.zyntiqo.com',

  /** WhatsApp business number in international format, no "+" or spaces. */
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
  whatsappEnabled: Boolean(import.meta.env.VITE_WHATSAPP_NUMBER),

  /** Default consultation duration in minutes. */
  consultationDurationMinutes: 30,

  /** When true, a real Resend key is deployed — emails actually send. */
  emailEnabled: bool(import.meta.env.VITE_EMAIL_ENABLED),

  /** When true, a real calendar provider is configured. */
  calendarEnabled: bool(import.meta.env.VITE_CALENDAR_ENABLED),
  calendarProvider: (import.meta.env.VITE_CALENDAR_PROVIDER ?? 'none') as
    | 'google'
    | 'microsoft'
    | 'calendly'
    | 'calcom'
    | 'none',

  /** When true, a real AI provider key is deployed — AI features actually work. */
  aiEnabled: bool(import.meta.env.VITE_AI_ENABLED),

  /** When true, AI image generation is configured. */
  imageGenEnabled: bool(import.meta.env.VITE_IMAGE_GEN_ENABLED),

  /** Social media profile URLs. Only set ones that actually exist. */
  socialLinks: {
    instagram: import.meta.env.VITE_SOCIAL_INSTAGRAM ?? '',
    facebook: import.meta.env.VITE_SOCIAL_FACEBOOK ?? '',
    linkedin: import.meta.env.VITE_SOCIAL_LINKEDIN ?? '',
    youtube: import.meta.env.VITE_SOCIAL_YOUTUBE ?? '',
    x: import.meta.env.VITE_SOCIAL_X ?? '',
  },
} as const;

export type LeadSource = 'contact_form' | 'quote_request' | 'consultation' | 'get_started';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Meeting Scheduled'
  | 'Proposal Sent'
  | 'Won'
  | 'Lost';

export const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Qualified',
  'Meeting Scheduled',
  'Proposal Sent',
  'Won',
  'Lost',
];
