import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Mail, Phone, Building2, Trash2, Users } from 'lucide-react';
import { contactsApi, activitiesApi, type Contact } from '@/lib/services/platform';
import { Card, CardHeader, EmptyState } from './DashboardPage';

const statusColors: Record<string, string> = {
  lead: 'bg-brand-500/15 text-brand-300',
  customer: 'bg-emerald-500/15 text-emerald-300',
  churned: 'bg-red-500/15 text-red-300',
};

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setContacts(await contactsApi.list());
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async (data: Partial<Contact>) => {
    try {
      await contactsApi.create(data);
      await activitiesApi.create({
        type: 'contact',
        description: `New contact added: ${data.name}`,
      });
    } catch {
      // best-effort
    }
    setShowAdd(false);
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await contactsApi.remove(id);
      await activitiesApi.create({
        type: 'contact',
        description: `Contact deleted: ${name}`,
      });
    } catch {
      // best-effort
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">CRM</h1>
          <p className="mt-1 text-sm text-ink-400">Manage your contacts, leads, and customers.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full rounded-xl border border-white/10 bg-ink-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
        />
      </div>

      {/* Contacts grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No contacts yet"
            subtitle="Add your first contact or import leads from your website."
            action={
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950"
              >
                <Plus className="h-4 w-4" /> Add Contact
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-sm font-semibold text-white">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    {c.company && <p className="text-xs text-ink-400">{c.company}</p>}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[c.status] ?? statusColors.lead}`}>
                  {c.status}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <Mail className="h-3.5 w-3.5" /> {c.email}
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <Phone className="h-3.5 w-3.5" /> {c.phone}
                  </div>
                )}
                {c.title && (
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <Building2 className="h-3.5 w-3.5" /> {c.title}
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex flex-wrap gap-1">
                  {(c.tags ?? []).slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-ink-300">{tag}</span>
                  ))}
                </div>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="rounded-lg p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Delete contact"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}

function AddContactModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: Partial<Contact>) => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', title: '', status: 'lead', source: 'manual' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Add Contact</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Input label="Full Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Input label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none"
            >
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-ink-300 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 py-2.5 text-sm font-semibold text-ink-950">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, required, value, onChange }: { label: string; required?: boolean; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}{required && <span className="ml-1 text-brand-400">*</span>}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
      />
    </div>
  );
}
