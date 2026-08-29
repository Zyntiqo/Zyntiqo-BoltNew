import { siteConfig } from '../config';

/**
 * Build a WhatsApp click-to-chat URL with a pre-filled, contextual message.
 * Uses wa.me deep links — no fake chat functionality.
 */
export function buildWhatsAppUrl(message: string): string {
  const number = siteConfig.whatsappNumber;
  if (!number) return '';
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Contextual WhatsApp messages per service / context.
 */
export function whatsappMessageFor(service?: string): string {
  if (!service || service === 'General Consultation') {
    return "Hello Zyntiqo, I'd like to discuss my project with your team.";
  }
  return `Hello Zyntiqo, I'm interested in ${service}. I'd like to discuss my project.`;
}

export const genericWhatsAppMessage =
  "Hello Zyntiqo, I'd like to talk about my business needs.";
