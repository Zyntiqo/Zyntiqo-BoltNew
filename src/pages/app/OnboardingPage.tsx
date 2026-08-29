import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Sparkles, Building2, Target, Users, Zap } from 'lucide-react';
import { automationsApi, activitiesApi } from '@/lib/services/platform';

const industries = [
  'Technology / SaaS',
  'E-commerce / Retail',
  'Marketing / Agency',
  'Healthcare',
  'Education',
  'Finance',
  'Manufacturing',
  'Real Estate',
  'Other',
];

const goals = [
  'Get more customers',
  'Automate repetitive work',
  'Improve marketing',
  'Manage leads better',
  'Schedule more meetings',
  'Use AI for my business',
  'Grow revenue',
  'Streamline operations',
];

const teamSizes = ['Just me', '2-5', '6-20', '21-50', '50+'];

const channels = ['Email', 'WhatsApp', 'Phone', 'Social Media', 'Website', 'In-person'];

const recommendedAutomations: { name: string; trigger: string; steps: { id: string; type: 'condition' | 'ai_action' | 'action' | 'delay' | 'branch'; label: string }[] }[] = [
  { name: 'New Lead Qualification', trigger: 'new_lead', steps: [
    { id: 's1', type: 'ai_action', label: 'Qualify lead with AI' },
    { id: 's2', type: 'action', label: 'Assign to sales rep' },
    { id: 's3', type: 'action', label: 'Send welcome message' },
    { id: 's4', type: 'delay', label: 'Wait 24 hours' },
    { id: 's5', type: 'action', label: 'Create follow-up task' },
  ] },
  { name: 'Customer Onboarding', trigger: 'new_customer', steps: [
    { id: 's1', type: 'action', label: 'Create CRM record' },
    { id: 's2', type: 'action', label: 'Send welcome email' },
    { id: 's3', type: 'delay', label: 'Wait 2 days' },
    { id: 's4', type: 'action', label: 'Schedule onboarding call' },
  ] },
  { name: 'Meeting Reminder', trigger: 'meeting_scheduled', steps: [
    { id: 's1', type: 'action', label: 'Send confirmation' },
    { id: 's2', type: 'ai_action', label: 'Prepare meeting brief' },
    { id: 's3', type: 'delay', label: 'Wait until 1 hour before' },
    { id: 's4', type: 'action', label: 'Send reminder' },
  ] },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessName: '',
    industry: '',
    goals: [] as string[],
    teamSize: '',
    channels: [] as string[],
    currentTools: '',
  });
  const [settingUp, setSettingUp] = useState(false);

  const toggleArray = (field: 'goals' | 'channels', value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const finish = async () => {
    setSettingUp(true);
    // Create recommended automations based on selected goals
    const toCreate: typeof recommendedAutomations = [];
    if (form.goals.some((g) => g.includes('customers') || g.includes('leads'))) {
      toCreate.push(recommendedAutomations[0]);
    }
    if (form.goals.some((g) => g.includes('Automate') || g.includes('operations'))) {
      toCreate.push(recommendedAutomations[1]);
    }
    if (form.goals.some((g) => g.includes('meetings'))) {
      toCreate.push(recommendedAutomations[2]);
    }
    // Default: create at least the lead qualification automation
    if (toCreate.length === 0) toCreate.push(recommendedAutomations[0]);

    for (const auto of toCreate) {
      await automationsApi.create({
        name: auto.name,
        trigger: auto.trigger,
        enabled: true,
        steps: auto.steps,
      });
    }
    await activitiesApi.create({
      type: 'contact',
      description: `Onboarding completed for ${form.businessName || 'your business'}`,
    });
    setSettingUp(false);
    navigate('/app');
  };

  const steps = ['Business', 'Goals', 'Team', 'Channels', 'Review'];
  const canProceed = [
    form.businessName.trim().length > 0,
    form.goals.length > 0,
    form.teamSize.length > 0,
    true,
    true,
  ];

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        {/* Logo */}
        <div className="mb-10 text-center">
          <span className="font-display text-2xl font-semibold text-white">
            Zyntiqo <span className="text-accent-400">Pro</span>
          </span>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i <= step
                    ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-ink-950'
                    : 'border border-white/10 text-ink-500'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-1 h-px w-6 sm:w-10 ${i < step ? 'bg-brand-400/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/5 bg-ink-900/40 p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <StepHeader icon={Building2} title="Tell us about your business" subtitle="This helps us tailor your Zyntiqo Pro experience." />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-200">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Acme Inc."
                  className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-200">Industry</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {industries.map((ind) => (
                    <Chip key={ind} label={ind} selected={form.industry === ind} onClick={() => setForm({ ...form, industry: ind })} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <StepHeader icon={Target} title="What are your main goals?" subtitle="Select all that apply — we'll recommend the right modules." />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {goals.map((g) => (
                  <Chip key={g} label={g} selected={form.goals.includes(g)} onClick={() => toggleArray('goals', g)} />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <StepHeader icon={Users} title="How big is your team?" subtitle="This helps us configure the right collaboration features." />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {teamSizes.map((s) => (
                  <Chip key={s} label={s} selected={form.teamSize === s} onClick={() => setForm({ ...form, teamSize: s })} />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <StepHeader icon={Zap} title="How do you communicate with customers?" subtitle="Select your main channels." />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {channels.map((c) => (
                  <Chip key={c} label={c} selected={form.channels.includes(c)} onClick={() => toggleArray('channels', c)} />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <StepHeader icon={Sparkles} title="Ready to set up your workspace" subtitle="We'll configure your dashboard and recommended automations based on your answers." />
              <div className="rounded-xl border border-white/5 bg-ink-950/40 p-4">
                <dl className="space-y-2 text-sm">
                  <Row label="Business" value={form.businessName || '—'} />
                  <Row label="Industry" value={form.industry || '—'} />
                  <Row label="Goals" value={form.goals.join(', ') || '—'} />
                  <Row label="Team Size" value={form.teamSize || '—'} />
                  <Row label="Channels" value={form.channels.join(', ') || '—'} />
                </dl>
              </div>
              <div className="rounded-xl border border-accent-400/20 bg-accent-500/5 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-400" />
                  <p className="text-sm font-medium text-white">AI will set up:</p>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-ink-300">
                  <li>• Your dashboard with relevant widgets</li>
                  <li>• Recommended automations based on your goals</li>
                  <li>• CRM module ready for your contacts</li>
                  <li>• Campaign tools for your marketing</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <span />}

            {step < 4 ? (
              <button
                onClick={() => canProceed[step] && setStep((s) => s + 1)}
                disabled={!canProceed[step]}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-6 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-40"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={settingUp}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-6 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {settingUp ? (
                  <>Setting up...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Let AI Set Up My Workspace</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-brand-300" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-ink-400">{subtitle}</p>
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
        selected
          ? 'border-brand-400 bg-brand-500/15 text-white'
          : 'border-white/10 bg-ink-900/40 text-ink-300 hover:border-white/20 hover:text-white'
      }`}
    >
      {selected && <Check className="absolute right-2 top-2 h-3 w-3 text-brand-400" />}
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-400">{label}</dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}
