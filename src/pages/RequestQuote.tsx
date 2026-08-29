import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { usePageMeta } from '@/lib/hooks';
import { track } from '@/lib/services/analytics';
import { createLead, createQuoteRequest } from '@/lib/services/leads';
import { sendEmail } from '@/lib/services/email';
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

const budgets = [
  'Under ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,50,000',
  '₹2,50,000+',
  'Not Sure',
];

const timelines = ['ASAP', 'Within 1 Week', '2–4 Weeks', '1–3 Months', 'Flexible'];

type FormState = {
  service: string;
  requirements: string;
  budget: string;
  timeline: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  websiteUrl: string; // honeypot
};

const initialState: FormState = {
  service: '',
  requirements: '',
  budget: '',
  timeline: '',
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  whatsapp: '',
  website: '',
  websiteUrl: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const stepLabels = ['Service', 'Requirements', 'Budget', 'Timeline', 'Contact'];

export default function RequestQuote() {
  usePageMeta(
    'Request a Quote — Zyntiqo',
    'Request a quote from Zyntiqo. Tell us about your project, budget and timeline, and we will get back to you with a tailored solution.',
  );

  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const param = searchParams.get('service');
    if (param) {
      const matched = services.find(
        (s) => s.toLowerCase().replace(/\s+/g, '-') === param.toLowerCase(),
      );
      if (matched) setForm((prev) => ({ ...prev, service: matched }));
    }
    track('quote_request_started');
  }, [searchParams]);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (): boolean => {
    const next: Record<string, string> = {};
    if (step === 0 && !form.service) next.service = 'Please select a service.';
    if (step === 1 && !form.requirements.trim()) next.requirements = 'Please describe your project.';
    if (step === 3 && !form.timeline) next.timeline = 'Please select a timeline.';
    if (step === 4) {
      if (!form.fullName.trim()) next.fullName = 'Please enter your name.';
      if (!form.email.trim()) next.email = 'Please enter your email.';
      else if (!emailRegex.test(form.email)) next.email = 'Please enter a valid email.';
      if (!form.phone.trim()) next.phone = 'Please enter your phone number.';
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
    if (form.websiteUrl) return; // honeypot
    if (!validateStep()) return;
    setStatus('submitting');
    setSubmitMessage('');

    const leadResult = await createLead({
      full_name: form.fullName,
      business_name: form.businessName,
      email: form.email,
      phone: form.phone,
      whatsapp: form.whatsapp || form.phone,
      website: form.website,
      service: form.service,
      requirements: form.requirements,
      budget: form.budget,
      timeline: form.timeline,
      lead_source: 'quote_request',
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

    const quoteResult = await createQuoteRequest({
      lead_id: leadResult.leadId,
      service: form.service,
      requirements: form.requirements,
      budget: form.budget,
      timeline: form.timeline,
    });

    await sendEmail({
      to: siteConfig.email,
      template: 'quote_request',
      data: { name: form.fullName, service: form.service, budget: form.budget, timeline: form.timeline },
    });

    if (!quoteResult.ok) {
      setStatus('error');
      setSubmitMessage("We couldn't save your quote request. Please try again or reach us on WhatsApp.");
      return;
    }

    track('quote_request_submitted', { service: form.service });
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <section className="relative pt-32 pb-20 sm:pt-40">
        <div className="container-page max-w-2xl">
          <div className="rounded-3xl border border-accent-500/30 bg-accent-500/5 p-10 text-center sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/15">
              <CheckCircle2 className="h-8 w-8 text-accent-400" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
              Thank you. We've received your project requirements.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-ink-300">
              Our team will review your request and get back to you with a tailored solution.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to="/book-consultation" size="md">
                Book a Consultation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <WhatsAppButton label="WhatsApp Zyntiqo" service={form.service} size="md" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative pt-28 pb-20 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-20" style={{ backgroundSize: '60px 60px' }} />
      <div className="container-page relative">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-ink-200">
              <FileText className="h-3.5 w-3.5 text-brand-400" />
              Request a Quote
            </span>
            <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Get a <span className="text-gradient">tailored quote</span>
            </h1>
            <p className="mt-4 text-ink-300">
              Tell us about your project and we'll put together a solution that fits.
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

            {step === 0 && (
              <Step title="Which service do you need?">
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <SelectCard key={s} label={s} selected={form.service === s} onClick={() => update('service', s)} />
                  ))}
                </div>
                {errors.service && <p className="mt-3 text-xs text-red-400">{errors.service}</p>}
              </Step>
            )}

            {step === 1 && (
              <Step title="Tell us about your project">
                <FormField label="Project Requirements" required error={errors.requirements}>
                  <textarea
                    rows={6}
                    value={form.requirements}
                    onChange={(e) => update('requirements', e.target.value)}
                    placeholder="What are you trying to build, grow or automate? What problems are you solving?"
                    className={`${inputCls(errors.requirements)} resize-none`}
                  />
                </FormField>
              </Step>
            )}

            {step === 2 && (
              <Step title="What's your budget range?">
                <div className="grid gap-3 sm:grid-cols-2">
                  {budgets.map((b) => (
                    <SelectCard key={b} label={b} selected={form.budget === b} onClick={() => update('budget', b)} />
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-500">Not sure yet? Select "Not Sure" — that's completely fine.</p>
              </Step>
            )}

            {step === 3 && (
              <Step title="What's your timeline?">
                <div className="grid gap-3 sm:grid-cols-2">
                  {timelines.map((t) => (
                    <SelectCard key={t} label={t} selected={form.timeline === t} onClick={() => update('timeline', t)} />
                  ))}
                </div>
                {errors.timeline && <p className="mt-3 text-xs text-red-400">{errors.timeline}</p>}
              </Step>
            )}

            {step === 4 && (
              <Step title="Your contact details">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Full Name" required error={errors.fullName}>
                    <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Jane Doe" className={inputCls(errors.fullName)} />
                  </FormField>
                  <FormField label="Business Name">
                    <input type="text" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Acme Inc." className={inputCls()} />
                  </FormField>
                  <FormField label="Email" required error={errors.email}>
                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@acme.com" className={inputCls(errors.email)} />
                  </FormField>
                  <FormField label="Phone" required error={errors.phone}>
                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls(errors.phone)} />
                  </FormField>
                  <FormField label="WhatsApp (if different)">
                    <input type="tel" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls()} />
                  </FormField>
                  <FormField label="Company Website (optional)">
                    <input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://acme.com" className={inputCls()} />
                  </FormField>
                </div>
              </Step>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              {step > 0 ? (
                <button type="button" onClick={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-300 transition-colors hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <Link to="/contact" className="text-sm text-ink-500 hover:text-ink-300">
                  Cancel
                </Link>
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
                      Submit Quote Request
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

function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
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

function inputCls(error?: string) {
  return `w-full rounded-xl border bg-ink-900/60 px-4 py-3 text-sm text-white placeholder-ink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/40 ${
    error ? 'border-red-500/50' : 'border-white/10 focus:border-brand-400/50'
  }`;
}
