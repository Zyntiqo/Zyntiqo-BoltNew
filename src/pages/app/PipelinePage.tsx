import { useEffect, useState, useCallback } from 'react';
import { Plus, GripVertical, DollarSign, KanbanSquare } from 'lucide-react';
import { dealsApi, contactsApi, activitiesApi, type Deal, type Contact } from '@/lib/services/platform';
import { Card, EmptyState, formatNum } from './DashboardPage';

const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
const stageColors: Record<string, string> = {
  lead: 'border-t-brand-400',
  qualified: 'border-t-cyan-400',
  proposal: 'border-t-amber-400',
  negotiation: 'border-t-purple-400',
  won: 'border-t-emerald-400',
  lost: 'border-t-red-400',
};

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [dragDeal, setDragDeal] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [d, c] = await Promise.all([dealsApi.list(), contactsApi.list()]);
      setDeals(d);
      setContacts(c);
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDrop = async (stage: string) => {
    if (!dragDeal) return;
    const deal = deals.find((d) => d.id === dragDeal);
    if (!deal || deal.stage === stage) return;
    const probs: Record<string, number> = { lead: 10, qualified: 30, proposal: 50, negotiation: 70, won: 100, lost: 0 };
    try {
      await dealsApi.update(dragDeal, { stage, probability: probs[stage] ?? deal.probability });
      await activitiesApi.create({ type: 'deal', description: `Deal "${deal.title}" moved to ${stage}` });
    } catch {}
    setDragDeal(null);
    load();
  };

  const handleAdd = async (data: Partial<Deal>) => {
    try {
      await dealsApi.create(data);
      await activitiesApi.create({ type: 'deal', description: `New deal created: ${data.title}` });
    } catch {}
    setShowAdd(false);
    load();
  };

  const contactName = (id: string | null) => contacts.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-ink-400">Drag deals between stages to update your pipeline.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Deal
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : deals.length === 0 ? (
        <Card>
          <EmptyState
            icon={KanbanSquare}
            title="No deals in your pipeline"
            subtitle="Add a deal to start tracking your sales pipeline."
            action={
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950">
                <Plus className="h-4 w-4" /> Add Deal
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2 overflow-x-auto">
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const total = stageDeals.reduce((s, d) => s + Number(d.value || 0), 0);
            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
                className={`rounded-2xl border border-t-2 border-white/5 bg-ink-900/30 ${stageColors[stage]}`}
              >
                <div className="px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize text-white">{stage}</span>
                    <span className="text-xs text-ink-500">{stageDeals.length}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">₹{formatNum(total)}</p>
                </div>
                <div className="space-y-2 px-2 pb-3">
                  {stageDeals.map((d) => (
                    <div
                      key={d.id}
                      draggable
                      onDragStart={() => setDragDeal(d.id)}
                      className="group cursor-grab rounded-xl border border-white/5 bg-ink-950/60 p-3 transition-all hover:border-white/10 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">{d.title}</p>
                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-600 opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="mt-1 text-xs text-ink-400">{contactName(d.contact_id)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <DollarSign className="h-3 w-3" />₹{formatNum(Number(d.value))}
                        </span>
                        <span className="text-xs text-ink-500">{d.probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddDealModal contacts={contacts} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}

function AddDealModal({ contacts, onClose, onAdd }: { contacts: Contact[]; onClose: () => void; onAdd: (data: Partial<Deal>) => void }) {
  const [form, setForm] = useState({ title: '', value: '0', stage: 'lead', contact_id: '', notes: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      title: form.title,
      value: Number(form.value) || 0,
      stage: form.stage,
      contact_id: form.contact_id || null,
      notes: form.notes || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Add Deal</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Deal Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Field label="Value (₹)" type="number" value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Contact</label>
            <select
              value={form.contact_id}
              onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none"
            >
              <option value="">No contact</option>
              {contacts.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none"
            >
              {stages.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-ink-300 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 py-2.5 text-sm font-semibold text-ink-950">Add Deal</button>
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
