import { useEffect, useState, useCallback } from 'react';
import { Plus, FolderKanban, Loader2, ExternalLink } from 'lucide-react';
import { projectsApi, type Project } from '@/lib/services/portal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, EmptyState, formatNum, timeAgo } from './DashboardPage';

type Profile = { id: string; full_name: string; email: string };

const statusColors: Record<string, string> = {
  planning: 'bg-ink-500/15 text-ink-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  in_progress: 'bg-brand-500/15 text-brand-300',
  on_hold: 'bg-amber-500/15 text-amber-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  cancelled: 'bg-red-500/15 text-red-300',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [p, c] = await Promise.all([
        projectsApi.list(),
        supabase.from('profiles').select('id, full_name, email').order('full_name'),
      ]);
      setProjects(p);
      setCustomers((c.data ?? []) as Profile[]);
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Partial<Project>) => {
    const { error } = await supabase.from('projects').insert(data);
    if (error) {
      alert('Could not create the project. Please try again.');
      return;
    }
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="mt-1 text-sm text-ink-400">Manage all client projects and track progress.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            subtitle="Create your first project to start tracking deliverables and progress."
            action={
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950">
                <Plus className="h-4 w-4" /> Create Project
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const customer = customers.find((c) => c.id === p.customer_id);
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                    <p className="mt-0.5 text-xs text-ink-400">{customer?.full_name ?? 'Unassigned'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[p.status] ?? statusColors.planning}`}>
                    {p.status}
                  </span>
                </div>
                {p.service && <p className="mt-2 text-xs text-ink-500">{p.service}</p>}
                {p.website && (
                  <a href={p.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200">
                    <ExternalLink className="h-3 w-3" /> {p.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-400">Progress</span>
                    <span className="font-medium text-white">{p.progress ?? 0}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-950">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${p.progress ?? 0}%` }} />
                  </div>
                </div>
                {p.assigned_staff && p.assigned_staff.length > 0 && (
                  <p className="mt-2 text-xs text-ink-500">Staff: {p.assigned_staff.join(', ')}</p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-ink-500">{timeAgo(p.created_at)}</span>
                  {p.expected_completion && (
                    <span className="text-xs text-ink-500">Due {new Date(p.expected_completion).toLocaleDateString()}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          customers={customers}
          staffId={user?.id ?? null}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

function CreateProjectModal({
  customers,
  staffId,
  onClose,
  onCreate,
}: {
  customers: Profile[];
  staffId: string | null;
  onClose: () => void;
  onCreate: (data: Partial<Project>) => void;
}) {
  const [form, setForm] = useState({
    customer_id: '',
    name: '',
    service: '',
    status: 'planning',
    start_date: '',
    expected_completion: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.name.trim()) return;
    setSaving(true);
    await onCreate({
      customer_id: form.customer_id,
      name: form.name,
      service: form.service || null,
      status: form.status,
      progress: 0,
      start_date: form.start_date || null,
      expected_completion: form.expected_completion || null,
      assigned_staff: staffId ? [staffId] : [],
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Create Project</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Customer<span className="ml-1 text-brand-400">*</span></label>
            <select
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none"
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Project Name<span className="ml-1 text-brand-400">*</span></label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
              placeholder="Website Redesign"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Service</label>
            <input
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
              placeholder="Web Development"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none"
            >
              <option value="planning">Planning</option>
              <option value="active">Active (LIVE)</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Expected Completion</label>
              <input type="date" value={form.expected_completion} onChange={(e) => setForm({ ...form, expected_completion: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none" />
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
