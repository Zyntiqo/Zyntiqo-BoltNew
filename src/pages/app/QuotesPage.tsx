import { useEffect, useState, useCallback } from 'react';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { quotesApi, type Quote } from '@/lib/services/portal';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, EmptyState, formatNum, timeAgo } from './DashboardPage';

type Profile = { id: string; full_name: string; email: string };

const statusColors: Record<string, string> = {
  draft: 'bg-ink-500/15 text-ink-300',
  sent: 'bg-brand-500/15 text-brand-300',
  approved: 'bg-emerald-500/15 text-emerald-300',
  rejected: 'bg-red-500/15 text-red-300',
  expired: 'bg-amber-500/15 text-amber-300',
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [q, c] = await Promise.all([
        quotesApi.list(),
        supabase.from('profiles').select('id, full_name, email').order('full_name'),
      ]);
      setQuotes(q);
      setCustomers((c.data ?? []) as Profile[]);
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const nextQuoteNumber = () => {
    const max = quotes.reduce((m, q) => {
      const n = parseInt(q.quote_number.replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `Q-${String(max + 1).padStart(3, '0')}`;
  };

  const handleCreate = async (data: Partial<Quote>) => {
    const { error } = await supabase.from('quotes').insert(data);
    if (error) {
      alert('Could not create the quote. Please try again.');
      return;
    }
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Quotes</h1>
          <p className="mt-1 text-sm text-ink-400">Create and manage price quotes for your customers.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> New Quote
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : quotes.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No quotes yet"
            subtitle="Create your first quote to send a pricing proposal to a customer."
            action={
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950">
                <Plus className="h-4 w-4" /> Create Quote
              </button>
            }
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title={`All Quotes (${quotes.length})`} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 text-xs text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Quote #</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Valid Until</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {quotes.map((q) => {
                  const customer = customers.find((c) => c.id === q.customer_id);
                  return (
                    <tr key={q.id} className="hover:bg-white/5">
                      <td className="px-5 py-3 font-medium text-white">{q.quote_number}</td>
                      <td className="px-5 py-3 text-ink-200">{customer?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-ink-300">{q.subject ?? '—'}</td>
                      <td className="px-5 py-3 font-medium text-white">₹{formatNum(Number(q.total) || 0)}</td>
                      <td className="px-5 py-3 text-ink-400">{q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[q.status] ?? statusColors.draft}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-ink-500">{timeAgo(q.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateQuoteModal
          customers={customers}
          nextNumber={nextQuoteNumber()}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

function CreateQuoteModal({
  customers,
  nextNumber,
  onClose,
  onCreate,
}: {
  customers: Profile[];
  nextNumber: string;
  onClose: () => void;
  onCreate: (data: Partial<Quote>) => void;
}) {
  const [form, setForm] = useState({
    customer_id: '',
    subject: '',
    description: '',
    amount: '0',
    tax: '0',
    discount: '0',
    valid_until: '',
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);

  const amount = Number(form.amount) || 0;
  const tax = Number(form.tax) || 0;
  const discount = Number(form.discount) || 0;
  const total = Math.max(0, amount + tax - discount);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) return;
    setSaving(true);
    await onCreate({
      quote_number: nextNumber,
      customer_id: form.customer_id,
      subject: form.subject || null,
      description: form.description || null,
      amount,
      tax,
      discount,
      total,
      valid_until: form.valid_until || null,
      status: form.status,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Create Quote</h2>
        <p className="mt-1 text-xs text-ink-400">Quote number: <span className="font-mono text-brand-300">{nextNumber}</span></p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Customer<span className="ml-1 text-brand-400">*</span></label>
            <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none">
              <option value="">Select customer…</option>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" placeholder="Website redesign quote" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" placeholder="Scope of work…" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Amount (₹)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Tax (₹)</label>
              <input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Discount (₹)</label>
              <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" />
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-ink-950/40 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400">Total</span>
              <span className="font-semibold text-white">₹{formatNum(total)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Valid Until</label>
              <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-ink-300 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
