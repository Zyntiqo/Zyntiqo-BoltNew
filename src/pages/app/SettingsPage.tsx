import { Settings, Sparkles, Mail, Calendar, MessageCircle, Bot, Check, X } from 'lucide-react';
import { siteConfig } from '@/lib/config';
import { isAIConfigured } from '@/lib/services/ai';
import { isEmailConfigured } from '@/lib/services/email';
import { isCalendarConfigured } from '@/lib/services/calendar';

export default function SettingsPage() {
  const integrations = [
    {
      name: 'AI Assistant',
      icon: Bot,
      configured: isAIConfigured(),
      description: 'Power content generation, lead qualification, and smart recommendations.',
      envVars: ['VITE_AI_ENABLED', 'AI_API_KEY (edge function secret)'],
    },
    {
      name: 'Email Notifications',
      icon: Mail,
      configured: isEmailConfigured(),
      description: 'Send lead, quote, and consultation notifications via Resend.',
      envVars: ['VITE_EMAIL_ENABLED', 'RESEND_API_KEY (edge function secret)'],
    },
    {
      name: 'Calendar Integration',
      icon: Calendar,
      configured: isCalendarConfigured(),
      description: 'Connect Google Calendar, Microsoft, Calendly, or Cal.com for real availability.',
      envVars: ['VITE_CALENDAR_ENABLED', 'VITE_CALENDAR_PROVIDER', 'Calendar credentials (edge function secret)'],
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      configured: siteConfig.whatsappEnabled,
      description: 'Enable WhatsApp click-to-chat CTAs with contextual messages.',
      envVars: ['VITE_WHATSAPP_NUMBER'],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-400">Manage your integrations and platform configuration.</p>
      </div>

      {/* Integrations */}
      <div className="space-y-4">
        {integrations.map((int) => {
          const Icon = int.icon;
          return (
            <div key={int.name} className="rounded-2xl border border-white/5 bg-ink-900/40 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${int.configured ? 'bg-emerald-500/10' : 'bg-ink-500/10'}`}>
                    <Icon className={`h-6 w-6 ${int.configured ? 'text-emerald-400' : 'text-ink-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{int.name}</p>
                      {int.configured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          <Check className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink-500/15 px-2 py-0.5 text-[10px] font-medium text-ink-400">
                          <X className="h-3 w-3" /> Not Connected
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-400">{int.description}</p>
                    <div className="mt-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-500">Required env vars:</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {int.envVars.map((v) => (
                          <code key={v} className="rounded-md bg-ink-950/60 px-2 py-0.5 text-[10px] text-ink-300">{v}</code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Brand info */}
      <div className="rounded-2xl border border-white/5 bg-ink-900/40 p-5">
        <h3 className="text-sm font-semibold text-white">Brand Information</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow label="Brand" value={siteConfig.brand} />
          <InfoRow label="Tagline" value={siteConfig.tagline} />
          <InfoRow label="Email" value={siteConfig.email} />
          <InfoRow label="Website" value={siteConfig.website} />
          <InfoRow label="Consultation Duration" value={`${siteConfig.consultationDurationMinutes} minutes`} />
          <InfoRow label="Calendar Provider" value={siteConfig.calendarProvider} />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-400/20 bg-brand-500/5 p-4">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
        <div>
          <p className="text-sm font-medium text-brand-200">About Zyntiqo Pro</p>
          <p className="mt-0.5 text-xs text-ink-400">
            Zyntiqo Pro is your AI-powered business operating platform. Manage CRM, automate
            workflows, create campaigns, schedule meetings, and let AI help you run your business.
            All integrations are modular — connect what you need, when you need it.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm text-white">{value}</p>
    </div>
  );
}
