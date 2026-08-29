import { siteConfig } from '../config';

/**
 * Email notification abstraction.
 *
 * Real sending happens through a Resend edge function when VITE_EMAIL_ENABLED
 * is true and RESEND_API_KEY is deployed as a secret. Otherwise this is a
 * no-op — the UI must NOT claim an email was sent.
 */

export type EmailTemplate =
  | 'new_lead'
  | 'enquiry_confirmation'
  | 'consultation_request'
  | 'quote_request'
  | 'quote_approved'
  | 'quote_rejected'
  | 'support_ticket'
  | 'ticket_reply'
  | 'meeting_booked'
  | 'meeting_cancelled'
  | 'meeting_reminder'
  | 'meeting_rescheduled'
  | 'invoice_created'
  | 'payment_confirmation';

export type EmailPayload = {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
};

export type EmailResult =
  | { ok: true; id?: string }
  | { ok: false; reason: 'not_configured' | 'error'; message: string };

/**
 * Send a notification email. When email is not configured, returns honestly.
 * The actual send is performed by an edge function holding the Resend key.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (!siteConfig.emailEnabled) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'Email notifications are not configured yet.',
    };
  }

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok || body.ok === false) {
      const msg = body?.error ?? `Email service error (${res.status})`;
      return { ok: false, reason: 'error', message: msg };
    }

    return { ok: true, id: body.id };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Unexpected error',
    };
  }
}

export function isEmailConfigured(): boolean {
  return siteConfig.emailEnabled;
}
