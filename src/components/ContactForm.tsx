import { useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle, Send } from 'lucide-react';
import { createLeadWithAutomation as createLead, updateLeadEmailStatus } from '@/lib/services/leads';
import { sendEmail } from '@/lib/services/email';
import { track } from '@/lib/services/analytics';
import { siteConfig } from '@/lib/config';

const serviceOptions = [
  'Website Development',
  'E-commerce',
  'Digital Marketing',
  'AI Agent',
  'Business Automation',
  'Branding',
  'Custom Software',
  'General Consultation',
  'Other',
];

const budgetRanges = [
  'Under ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,50,000',
  '₹2,50,000+',
  'Not sure yet',
];

const timelines = ['ASAP', 'Within 1 Week', '2–4 Weeks', '1–3 Months', 'Flexible'];

type FormState = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  whatsapp: string;
  serviceNeeded: string;
  budgetRange: string;
  timeline: string;
  projectDetails: string;
  websiteUrl: string; // honeypot
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  whatsapp: '',
  serviceNeeded: '',
  budgetRange: '',
  timeline: '',
  projectDetails: '',
  websiteUrl: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+\d\s()\-]{7,20}$/;

export default function ContactForm() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<FormState>({
    ...initialState,
    serviceNeeded: searchParams.get('interest') ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.fullName.trim()) next.fullName = 'Please enter your name.';
    if (!form.email.trim()) next.email = 'Please enter your email.';
    else if (!emailRegex.test(form.email)) next.email = 'Please enter a valid email.';
    if (!form.phone.trim()) next.phone = 'Please enter your phone number.';
    else if (!phoneRegex.test(form.phone)) next.phone = 'Please enter a valid phone number.';
    if (!form.serviceNeeded) next.serviceNeeded = 'Please select a service.';
    if (!form.projectDetails.trim()) next.projectDetails = 'Tell us a bit about your project.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.websiteUrl) return; // honeypot
    if (!validate()) return;
    if (status === 'submitting') return;
    setStatus('submitting');
    setSubmitMessage('');

    const result = await createLead({
      full_name: form.fullName,
      business_name: form.businessName,
      email: form.email,
      phone: form.phone,
      whatsapp: form.whatsapp || form.phone,
      service: form.serviceNeeded,
      requirements: form.projectDetails,
      budget: form.budgetRange,
      timeline: form.timeline,
      lead_source: 'contact_form',
    });

    if (!result.ok) {
      setStatus('error');
      setSubmitMessage(
        result.offline
          ? result.message
          : "We couldn't submit your request right now. Please try again or contact us on WhatsApp.",
      );
      return;
    }

    const emailData = {
      lead_id: result.leadId,
      full_name: form.fullName,
      business_name: form.businessName,
      email: form.email,
      phone: form.phone,
      whatsapp: form.whatsapp || form.phone,
      service: form.serviceNeeded,
      budget: form.budgetRange,
      timeline: form.timeline,
      requirements: form.projectDetails,
      submitted_at: new Date().toLocaleString(),
    };

    const [adminResult, customerResult] = await Promise.all([
      sendEmail({
        to: siteConfig.email,
        template: 'new_lead',
        data: emailData,
      }),
      sendEmail({
        to: form.email,
        template: 'enquiry_confirmation',
        data: emailData,
      }),
    ]);

    const emailOk = adminResult.ok && customerResult.ok;
    const emailStatus = emailOk ? 'sent' : adminResult.ok || customerResult.ok ? 'partial' : 'failed';

    try {
      await updateLeadEmailStatus(result.leadId, emailStatus);
    } catch {
      // email status update is best-effort
    }

    if (!emailOk) {
      track('contact_form_submitted', { service: form.serviceNeeded, email_status: emailStatus });
      setStatus('success');
      setForm(initialState);
      return;
    }

    track('contact_form_submitted', { service: form.serviceNeeded });
    setStatus('success');
    setForm(initialState);
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-accent-500/30 bg-accent-500/5 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/15">
          <CheckCircle2 className="h-7 w-7 text-accent-400" />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-white">Project request sent</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-300">
          Thank you for reaching out to Zyntiqo. We've received your requirements
          and will review them shortly. Our team will respond within one business day.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm font-medium text-brand-300 transition-colors hover:text-brand-200"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{submitMessage}</span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Full Name" required error={errors.fullName} htmlFor="fullName">
          <input id="fullName" type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Jane Doe" className={inputCls(errors.fullName)} />
        </Field>
        <Field label="Business Name" htmlFor="businessName">
          <input id="businessName" type="text" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Acme Inc." className={inputCls()} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Email" required error={errors.email} htmlFor="email">
          <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@acme.com" className={inputCls(errors.email)} />
        </Field>
        <Field label="Phone" required error={errors.phone} htmlFor="phone">
          <input id="phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls(errors.phone)} />
        </Field>
      </div>

      <Field label="WhatsApp Number (if different)" htmlFor="whatsapp">
        <input id="whatsapp" type="tel" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls()} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="What do you need?" required error={errors.serviceNeeded} htmlFor="serviceNeeded">
          <select id="serviceNeeded" value={form.serviceNeeded} onChange={(e) => update('serviceNeeded', e.target.value)} className={inputCls(errors.serviceNeeded)}>
            <option value="">Select a service</option>
            {serviceOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
        </Field>
        <Field label="Budget Range" htmlFor="budgetRange">
          <select id="budgetRange" value={form.budgetRange} onChange={(e) => update('budgetRange', e.target.value)} className={inputCls()}>
            <option value="">Select a range</option>
            {budgetRanges.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
        </Field>
      </div>

      <Field label="Project Timeline" htmlFor="timeline">
        <select id="timeline" value={form.timeline} onChange={(e) => update('timeline', e.target.value)} className={inputCls()}>
          <option value="">Select a timeline</option>
          {timelines.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
        </select>
      </Field>

      <Field label="Tell us about your project" required error={errors.projectDetails} htmlFor="projectDetails">
        <textarea id="projectDetails" rows={5} value={form.projectDetails} onChange={(e) => update('projectDetails', e.target.value)} placeholder="Share your goals, what you're trying to build, and any details that help..." className={`${inputCls(errors.projectDetails)} resize-none`} />
      </Field>

      <div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-8 py-4 text-base font-semibold text-ink-950 shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
        >
          {status === 'submitting' ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
          ) : (
            <><Send className="h-4 w-4" /> Send Project Request</>
          )}
        </button>
      </div>
    </form>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-xl border bg-ink-900/60 px-4 py-3 text-sm text-white placeholder-ink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/40 ${
    error ? 'border-red-500/50' : 'border-white/10 focus:border-brand-400/50'
  }`;
}

function Field({ label, htmlFor, required, error, children }: { label: string; htmlFor: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-ink-200">
        {label}
        {required && <span className="ml-1 text-brand-400">*</span>}
      </label>
      {children}
      {error && <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-400" role="alert">{error}</p>}
    </div>
  );
}
