import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Clock,
  User,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { usePageMeta } from '@/lib/hooks';
import { track } from '@/lib/services/analytics';
import { createLead, createConsultation } from '@/lib/services/leads';
import { calendarProvider, isCalendarConfigured } from '@/lib/services/calendar';
import { sendEmail, isEmailConfigured } from '@/lib/services/email';
import { siteConfig } from '@/lib/config';

const services = [
  'Website Development',
  'E-commerce',
  'Digital Marketing',
  'AI Agent',
  'Business Automation',
  'Branding',
  'Custom Software',
  'General Consultation',
];

const meetingTypes = [
  { id: 'discovery', label: 'Discovery Call', description: 'Understand your goals and explore options.' },
  { id: 'project', label: 'Project Consultation', description: 'Discuss a specific project in detail.' },
  { id: 'technical', label: 'Technical Consultation', description: 'Architecture, integrations and tech decisions.' },
  { id: 'marketing', label: 'Marketing Consultation', description: 'Growth, campaigns and strategy.' },
  { id: 'ai', label: 'AI & Automation Consultation', description: 'AI agents and workflow automation.' },
];

type FormState = {
  service: string;
  meetingType: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  website: string;
  requirements: string;
  date: string;
  time: string;
  // honeypot
  websiteUrl: string;
};

const initialState: FormState = {
  service: '',
  meetingType: 'discovery',
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  website: '',
  requirements: '',
  date: '',
  time: '',
  websiteUrl: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function BookConsultation() {
  usePageMeta(
    'Book a Consultation — Zyntiqo',
    'Book a consultation with Zyntiqo. Select a service, pick a time, and tell us about your project. We will confirm your meeting shortly.',
  );

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [slots, setSlots] = useState<{ time: string; label: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirmedInfo, setConfirmedInfo] = useState<{
    date: string;
    time: string;
    meetingType: string;
    email: string;
  } | null>(null);

  const timezone = useMemo(localTimezone, []);
  const calendarConfigured = isCalendarConfigured();

  // Preselect service from URL param
  useEffect(() => {
    const param = searchParams.get('service');
    if (param) {
      const matched = services.find(
        (s) => s.toLowerCase().replace(/\s+/g, '-') === param.toLowerCase(),
      );
      if (matched) {
        setForm((prev) => ({ ...prev, service: matched }));
      }
    }
    track('consultation_started');
  }, [searchParams]);

  // Load illustrative slots when entering date step
  useEffect(() => {
    if (step !== 3) return;
    let active = true;
    setLoadingSlots(true);
    calendarProvider.getAvailability(new Date()).then((s) => {
      if (!active) return;
      setSlots(s.map(({ time, label }) => ({ time, label })));
      setLoadingSlots(false);
    });
    return () => {
      active = false;
    };
  }, [step]);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (): boolean => {
    const next: Record<string, string> = {};
    if (step === 0 && !form.service) next.service = 'Please select a service.';
    if (step === 1 && !form.meetingType) next.meetingType = 'Please select a meeting type.';
    if (step === 2) {
      if (!form.fullName.trim()) next.fullName = 'Please enter your name.';
      if (!form.email.trim()) next.email = 'Please enter your email.';
      else if (!emailRegex.test(form.email)) next.email = 'Please enter a valid email.';
      if (!form.phone.trim()) next.phone = 'Please enter your phone or WhatsApp number.';
    }
    if (step === 3) {
      if (!form.date) next.date = 'Please select a date.';
      if (!form.time) next.time = 'Please select a time.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 4));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    // honeypot
    if (form.websiteUrl) return;

    if (!validateStep()) return;
    setStatus('submitting');
    setSubmitMessage('');

    const leadResult = await createLead({
      full_name: form.fullName,
      business_name: form.businessName,
      email: form.email,
      phone: form.phone,
      whatsapp: form.phone,
      website: form.website,
      service: form.service,
      meeting_type: meetingTypes.find((m) => m.id === form.meetingType)?.label ?? form.meetingType,
      requirements: form.requirements,
      lead_source: 'consultation',
      meeting_date: form.date,
      meeting_time: form.time,
      timezone,
    });

    if (!leadResult.ok) {
      setStatus('error');
      setSubmitMessage(
        leadResult.offline
          ? leadResult.message
          : "We couldn't submit your request right now. Please try again or contact us on WhatsApp.",
      );
      return;
    }

    const bookingResult = await calendarProvider.createBooking({
      leadId: leadResult.leadId,
      service: form.service,
      meetingType: meetingTypes.find((m) => m.id === form.meetingType)?.label ?? form.meetingType,
      date: form.date,
      time: form.time,
      timezone,
      durationMinutes: siteConfig.consultationDurationMinutes,
      customerName: form.fullName,
      customerEmail: form.email,
    });

    const consultResult = await createConsultation({
      lead_id: leadResult.leadId,
      service: form.service,
      meeting_type: meetingTypes.find((m) => m.id === form.meetingType)?.label ?? form.meetingType,
      meeting_date: form.date,
      meeting_time: form.time,
      timezone,
      duration_minutes: siteConfig.consultationDurationMinutes,
    });

    // Email notification (no-op if not configured)
    await sendEmail({
      to: siteConfig.email,
      template: 'consultation_request',
      data: { name: form.fullName, service: form.service, date: form.date, time: form.time },
    });

    if (!consultResult.ok && !bookingResult.ok) {
      setStatus('error');
      setSubmitMessage(
        "We couldn't save your consultation request. Please try again or reach us on WhatsApp.",
      );
      return;
    }

    track('consultation_submitted', { service: form.service });
    setConfirmedInfo({
      date: form.date,
      time: form.time,
      meetingType: meetingTypes.find((m) => m.id === form.meetingType)?.label ?? form.meetingType,
      email: form.email,
    });
    setStatus('success');
  };

  if (status === 'success' && confirmedInfo) {
    return (
      <section className="relative pt-32 pb-20 sm:pt-40">
        <div className="container-page max-w-2xl">
          <div className="rounded-3xl border border-accent-500/30 bg-accent-500/5 p-10 text-center sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/15">
              <CheckCircle2 className="h-8 w-8 text-accent-400" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
              Your consultation request has been received.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-ink-300">
              We've received your request and will confirm the meeting shortly.
              {!isEmailConfigured() && ' A confirmation email will be sent once email notifications are configured.'}
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-ink-900/60 p-6 text-left">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <CalendarClock className="h-4 w-4 text-brand-300" />
                Requested slot
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Date" value={formatDateLabel(confirmedInfo.date)} />
                <Row label="Time" value={`${confirmedInfo.time} (${timezone})`} />
                <Row label="Meeting type" value={confirmedInfo.meetingType} />
                <Row label="Email" value={confirmedInfo.email} />
              </dl>
            </div>

            <p className="mt-6 text-xs text-ink-500">
              This is a request, not a confirmed booking. Our team will reach out to confirm.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to="/contact" variant="secondary" size="md">
                Share More Details
              </Button>
              <WhatsAppButton label="WhatsApp Zyntiqo" service={confirmedInfo.meetingType} size="md" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const stepLabels = ['Service', 'Meeting Type', 'Your Details', 'Date & Time', 'Confirm'];

  return (
    <section className="relative pt-28 pb-20 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-20" style={{ backgroundSize: '60px 60px' }} />
      <div className="container-page relative">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-ink-200">
              <Calendar className="h-3.5 w-3.5 text-brand-400" />
              Book a Consultation
            </span>
            <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Let's find a time to <span className="text-gradient">talk</span>
            </h1>
            <p className="mt-4 text-ink-300">
              Pick a service, choose a meeting type, and select a time that works for you.
            </p>
          </div>

          {/* Progress */}
          <div className="mt-10 flex items-center justify-center gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    i <= step
                      ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-ink-950'
                      : 'border border-white/10 text-ink-500'
                  }`}
                  aria-current={i === step ? 'step' : undefined}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`mx-1 h-px w-6 sm:w-10 ${i < step ? 'bg-brand-400/40' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/5 bg-ink-850/60 p-6 sm:p-8">
            {/* Honeypot */}
            <input
              type="text"
              name="website_url"
              value={form.websiteUrl}
              onChange={(e) => update('websiteUrl', e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {status === 'error' && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{submitMessage}</span>
              </div>
            )}

            {/* Step 0: Service */}
            {step === 0 && (
              <Step title="What do you need help with?">
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <SelectCard
                      key={s}
                      label={s}
                      selected={form.service === s}
                      onClick={() => update('service', s)}
                    />
                  ))}
                </div>
                {errors.service && <p className="mt-3 text-xs text-red-400">{errors.service}</p>}
              </Step>
            )}

            {/* Step 1: Meeting Type */}
            {step === 1 && (
              <Step title="What kind of meeting?">
                <div className="space-y-3">
                  {meetingTypes.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => update('meetingType', m.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        form.meetingType === m.id
                          ? 'border-brand-400/40 bg-brand-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="block text-sm font-medium text-white">{m.label}</span>
                      <span className="mt-0.5 block text-xs text-ink-400">{m.description}</span>
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <Step title="Your details">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Full Name" required error={errors.fullName}>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => update('fullName', e.target.value)}
                      placeholder="Jane Doe"
                      className={inputCls(errors.fullName)}
                    />
                  </FormField>
                  <FormField label="Business Name">
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => update('businessName', e.target.value)}
                      placeholder="Acme Inc."
                      className={inputCls()}
                    />
                  </FormField>
                  <FormField label="Email" required error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="jane@acme.com"
                      className={inputCls(errors.email)}
                    />
                  </FormField>
                  <FormField label="Phone / WhatsApp" required error={errors.phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className={inputCls(errors.phone)}
                    />
                  </FormField>
                  <div className="sm:col-span-2">
                    <FormField label="Company Website (optional)">
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => update('website', e.target.value)}
                        placeholder="https://acme.com"
                        className={inputCls()}
                      />
                    </FormField>
                  </div>
                  <div className="sm:col-span-2">
                    <FormField label="Project Requirements">
                      <textarea
                        rows={4}
                        value={form.requirements}
                        onChange={(e) => update('requirements', e.target.value)}
                        placeholder="Tell us what you're trying to build, grow or automate..."
                        className={`${inputCls()} resize-none`}
                      />
                    </FormField>
                  </div>
                </div>
              </Step>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <Step title="Pick a date and time">
                <p className="mb-4 text-xs text-ink-400">
                  All times are shown in your local timezone ({timezone}).
                </p>
                {!calendarConfigured && (
                  <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
                    These are preferred time slots. Our team will confirm the exact meeting time manually.
                  </p>
                )}
                <FormField label="Select a date" required error={errors.date}>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => update('date', e.target.value)}
                    className={inputCls(errors.date)}
                  />
                </FormField>

                <div className="mt-5">
                  <span className="mb-2 block text-sm font-medium text-ink-200">Available times</span>
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-ink-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading times...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => update('time', slot.time)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            form.time === slot.time
                              ? 'border-brand-400 bg-brand-500/15 text-white'
                              : 'border-white/10 text-ink-300 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.time && <p className="mt-2 text-xs text-red-400">{errors.time}</p>}
                </div>
              </Step>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <Step title="Review and confirm">
                <div className="rounded-xl border border-white/10 bg-ink-900/60 p-5">
                  <dl className="space-y-3 text-sm">
                    <Row label="Service" value={form.service} icon={<Sparkles className="h-4 w-4 text-brand-300" />} />
                    <Row
                      label="Meeting type"
                      value={meetingTypes.find((m) => m.id === form.meetingType)?.label ?? form.meetingType}
                      icon={<Clock className="h-4 w-4 text-brand-300" />}
                    />
                    <Row label="Date" value={formatDateLabel(form.date)} icon={<Calendar className="h-4 w-4 text-brand-300" />} />
                    <Row label="Time" value={`${form.time} (${timezone})`} icon={<Clock className="h-4 w-4 text-brand-300" />} />
                    <Row label="Name" value={form.fullName} icon={<User className="h-4 w-4 text-brand-300" />} />
                    <Row label="Email" value={form.email} icon={<User className="h-4 w-4 text-brand-300" />} />
                  </dl>
                </div>
                <p className="mt-4 text-xs text-ink-500">
                  By confirming, you're requesting a consultation. Our team will reach out to finalize.
                </p>
              </Step>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between gap-4">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-300 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <span />
              )}

              {step < 4 ? (
                <Button onClick={next} size="md">
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === 'submitting'}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-8 py-3.5 text-sm font-semibold text-ink-950 shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover disabled:opacity-60"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm Consultation
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-5 text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function SelectCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border px-4 py-4 text-left text-sm font-medium transition-all ${
        selected
          ? 'border-brand-400 bg-brand-500/15 text-white shadow-glow'
          : 'border-white/10 bg-ink-900/40 text-ink-300 hover:border-white/20 hover:text-white'
      }`}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-400">
          <Check className="h-2.5 w-2.5 text-ink-950" />
        </span>
      )}
      {label}
    </button>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">
        {label}
        {required && <span className="ml-1 text-brand-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-ink-400">{icon}{label}</dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-xl border bg-ink-900/60 px-4 py-3 text-sm text-white placeholder-ink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/40 ${
    error ? 'border-red-500/50' : 'border-white/10 focus:border-brand-400/50'
  }`;
}
