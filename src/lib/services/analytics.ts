/**
 * Lightweight analytics event tracking.
 *
 * No analytics platform is wired up by default. These functions are safe
 * no-ops that can be connected to GA4, Plausible, PostHog, etc. later by
 * replacing the `dispatch` function.
 */

export type AnalyticsEvent =
  | 'service_view'
  | 'get_started_click'
  | 'quote_request_started'
  | 'quote_request_submitted'
  | 'consultation_started'
  | 'consultation_submitted'
  | 'whatsapp_click'
  | 'contact_form_submitted';

function dispatch(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  // Future: window.gtag?.('event', event, properties) or similar.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, properties);
  }
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  dispatch(event, properties);
}
