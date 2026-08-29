import { useEffect, useState, useCallback } from 'react';
import { Plus, Megaphone, Trash2, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import {
  campaignsApi,
  activitiesApi,
  type Campaign,
} from '@/lib/services/platform';
import { callAI, isAIConfigured } from '@/lib/services/ai';
import { Card, CardHeader, EmptyState } from './DashboardPage';

const channelIcons: Record<string, string> = {
  email: '✉',
  social: '◎',
  ad: '⬚',
  blog: '☰',
};

const statusColors: Record<string, string> = {
  draft: 'bg-ink-500/15 text-ink-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  paused: 'bg-amber-500/15 text-amber-300',
  completed: 'bg-brand-500/15 text-brand-300',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCampaigns(await campaignsApi.list());
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await campaignsApi.remove(id);
      await activitiesApi.create({ type: 'campaign', description: `Campaign deleted: ${name}` });
    } catch {}
    load();
  };

  const handleCreate = async (data: Partial<Campaign>) => {
    try {
      await campaignsApi.create(data);
      await activitiesApi.create({ type: 'campaign', description: `Campaign created: ${data.name}` });
    } catch {}
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-ink-400">Create and manage your marketing campaigns with AI.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {!isAIConfigured() && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-200">
            AI content generation is not connected. You can still create campaigns manually —
            connect AI in Settings to unlock AI-generated copy and creative suggestions.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            subtitle="Create your first campaign and let AI help you generate copy, CTAs, and content."
            action={
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950">
                <Plus className="h-4 w-4" /> Create Campaign
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-lg">
                    {channelIcons[c.channel] ?? '◎'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs capitalize text-ink-400">{c.channel}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[c.status] ?? statusColors.draft}`}>
                  {c.status}
                </span>
              </div>
              {c.content && (
                <p className="mt-3 line-clamp-2 text-xs text-ink-400">{c.content}</p>
              )}
              {c.cta && (
                <div className="mt-2">
                  <span className="rounded-lg bg-brand-500/10 px-2 py-1 text-[10px] font-medium text-brand-300">CTA: {c.cta}</span>
                </div>
              )}
              {c.audience && (
                <p className="mt-2 text-xs text-ink-500">Audience: {c.audience}</p>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-xs text-ink-500">₹{Number(c.budget || 0).toLocaleString()}</span>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="rounded-lg p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}

function CreateCampaignModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<Campaign>) => void }) {
  const [form, setForm] = useState({ name: '', channel: 'email', audience: '', budget: '0', status: 'draft' });
  const [generated, setGenerated] = useState<{ content: string; cta: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!form.name.trim()) return;
    setGenerating(true);
    setAiError('');
    setGenerated(null);

    const result = await callAI({
      task: 'generate_content',
      context: { campaign: form.name, channel: form.channel, audience: form.audience },
      prompt: `Generate marketing copy and a CTA for a ${form.channel} campaign called "${form.name}" targeting "${form.audience || 'general audience'}". Return as JSON: {"content": "...", "cta": "..."}`,
    });

    if (result.ok) {
      try {
        const parsed = JSON.parse(result.content);
        setGenerated({ content: parsed.content ?? result.content, cta: parsed.cta ?? 'Learn More' });
      } catch {
        setGenerated({ content: result.content, cta: 'Learn More' });
      }
    } else {
      setAiError(result.message);
    }
    setGenerating(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onCreate({
      name: form.name,
      channel: form.channel,
      audience: form.audience || null,
      budget: Number(form.budget) || 0,
      status: form.status,
      content: generated?.content ?? null,
      cta: generated?.cta ?? null,
    });
  };

  const copyContent = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be blocked
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Create Campaign</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Campaign Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Channel</label>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none">
                <option value="email">Email</option>
                <option value="social">Social Media</option>
                <option value="ad">Advertisement</option>
                <option value="blog">Blog</option>
              </select>
            </div>
            <Field label="Budget (₹)" type="number" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
          </div>
          <Field label="Target Audience" value={form.audience} onChange={(v) => setForm({ ...form, audience: v })} />

          {/* AI generation */}
          <div className="rounded-xl border border-accent-400/20 bg-accent-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-400" />
                <span className="text-sm font-medium text-white">AI Content Generation</span>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !form.name.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-accent-500/15 px-4 py-1.5 text-xs font-medium text-accent-300 transition-colors hover:bg-accent-500/20 disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
            {aiError && <p className="mt-2 text-xs text-amber-300">{aiError}</p>}
            {generated && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg bg-ink-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-400">Generated Copy</span>
                    <button onClick={copyContent} className="text-ink-400 hover:text-white">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-ink-200">{generated.content}</p>
                </div>
                <div className="rounded-lg bg-ink-950/60 p-2">
                  <span className="text-xs text-ink-400">CTA: </span>
                  <span className="text-sm font-medium text-brand-300">{generated.cta}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-ink-300 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 py-2.5 text-sm font-semibold text-ink-950">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, type = 'text', value, onChange }: { label: string; required?: boolean; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}{required && <span className="ml-1 text-brand-400">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
      />
    </div>
  );
}
