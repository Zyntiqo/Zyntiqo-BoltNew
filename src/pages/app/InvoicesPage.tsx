import { useEffect, useState, useCallback } from 'react';
import { Plus, Receipt, Loader2 } from 'lucide-react';
import { invoicesApi, type Invoice } from '@/lib/services/portal';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, EmptyState, formatNum, timeAgo } from './DashboardPage';

type Profile = { id: string; full_name: string; email: string };
type Project = { id: string; name: string; customer_id: string };

const statusColors: Record<string, string> = {
  draft: 'bg-ink-500/15 text-ink-300',
  sent: 'bg-brand-500/15 text-brand-300',
  paid: 'bg-emerald-500/15 text-emerald-300',
  overdue: 'bg-red-500/15 text-red-300',
  cancelled: 'bg-amber-500/15 text-amber-300',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [inv, c, p] = await Promise.all([
        invoicesApi.list(),
        supabase.from('profiles').select('id, full_name, email').order('full_name'),
        supabase.from('projects').select('id, name, customer_id').order('name'),
      ]);
      setInvoices(inv);
      setCustomers((c.data ?? []) as Profile[]);
      setProjects((p.data ?? []) as Project[]);
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const nextInvoiceNumber = () => {
    const max = invoices.reduce((m, i) => {
      const n = parseInt(i.invoice_number.replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `INV-${String(max + 1).padStart(3, '0')}`;
  };

  const handleCreate = async (data: Partial<Invoice>) => {
    const { error } = await supabase.from('invoices').insert(data);
    if (error) {
      alert('Could not create the invoice. Please try again.');
      return;
    }
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Invoices</h1>
          <p className="mt-1 text-sm text-ink-400">Create and track customer invoices and payments.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            subtitle="Create your first invoice to bill a customer for a project."
            action={
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950">
                <Plus className="h-4 w-4" /> Create Invoice
              </button>
            }
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title={`All Invoices (${invoices.length})`} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 text-xs text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice #</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Due Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => {
                  const customer = customers.find((c) => c.id === inv.customer_id);
                  const project = projects.find((p) => p.id === inv.project_id);
                  return (
                    <tr key={inv.id} className="hover:bg-white/5">
                      <td className="px-5 py-3 font-medium text-white">{inv.invoice_number}</td>
                      <td className="px-5 py-3 text-ink-200">{customer?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-ink-300">{project?.name ?? '—'}</td>
                      <td className="px-5 py-3 font-medium text-white">₹{formatNum(Number(inv.amount) || 0)}</td>
                      <td className="px-5 py-3 text-ink-400">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[inv.status] ?? statusColors.draft}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-ink-500">{timeAgo(inv.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateInvoiceModal
          customers={customers}
          projects={projects}
          nextNumber={nextInvoiceNumber()}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

function CreateInvoiceModal({
  customers,
  projects,
  nextNumber,
  onClose,
  onCreate,
}: {
  customers: Profile[];
  projects: Project[];
  nextNumber: string;
  onClose: () => void;
  onCreate: (data: Partial<Invoice>) => void;
}) {
  const [form, setForm] = useState({
    customer_id: '',
    project_id: '',
    amount: '0',
    due_date: '',
    status: 'draft',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const filteredProjects = projects.filter((p) => !form.customer_id || p.customer_id === form.customer_id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) return;
    setSaving(true);
    await onCreate({
      invoice_number: nextNumber,
      customer_id: form.customer_id,
      project_id: form.project_id || null,
      amount: Number(form.amount) || 0,
      due_date: form.due_date || null,
      status: form.status,
      notes: form.notes || null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Create Invoice</h2>
        <p className="mt-1 text-xs text-ink-400">Invoice number: <span className="font-mono text-brand-300">{nextNumber}</span></p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Customer<span className="ml-1 text-brand-400">*</span></label>
            <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value, project_id: '' })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none">
              <option value="">Select customer…</option>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Project</label>
            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" disabled={!form.customer_id}>
              <option value="">No project</option>
              {filteredProjects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Amount (₹)<span className="ml-1 text-brand-400">*</span></label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" placeholder="Payment terms, bank details…" />
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
