import { useEffect, useState, useCallback } from 'react';
import { Plus, CheckSquare, Trash2, Calendar } from 'lucide-react';
import { tasksApi, activitiesApi, type Task } from '@/lib/services/platform';
import { Card, EmptyState, PriorityBadge } from './DashboardPage';

const priorityColors: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-brand-400',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setTasks(await tasksApi.list());
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleDone = async (t: Task) => {
    const newStatus = t.status === 'done' ? 'todo' : 'done';
    try {
      await tasksApi.update(t.id, { status: newStatus });
      if (newStatus === 'done') {
        await activitiesApi.create({ type: 'task', description: `Task completed: ${t.title}` });
      }
    } catch {}
    load();
  };

  const handleDelete = async (id: string) => {
    try { await tasksApi.remove(id); } catch {}
    load();
  };

  const handleAdd = async (data: Partial<Task>) => {
    try {
      await tasksApi.create(data);
      await activitiesApi.create({ type: 'task', description: `Task created: ${data.title}` });
    } catch {}
    setShowAdd(false);
    load();
  };

  const filtered = tasks.filter((t) => filter === 'all' || t.status === filter);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tasks</h1>
          <p className="mt-1 text-sm text-ink-400">Track your follow-ups and to-dos.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'todo', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === f ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : 'Done'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckSquare}
            title={filter === 'done' ? 'No completed tasks' : 'No tasks'}
            subtitle={filter === 'done' ? 'Completed tasks will appear here.' : 'Add a task to track your follow-ups.'}
            action={
              filter !== 'done' ? (
                <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950">
                  <Plus className="h-4 w-4" /> Add Task
                </button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card key={t.id} className="flex items-center gap-3 p-4">
              <button
                onClick={() => toggleDone(t)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                  t.status === 'done' ? 'border-emerald-400 bg-emerald-500/20' : 'border-white/20 hover:border-brand-400'
                }`}
              >
                {t.status === 'done' && <CheckSquare className="h-4 w-4 text-emerald-400" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${t.status === 'done' ? 'text-ink-500 line-through' : 'text-white'}`}>
                  {t.title}
                </p>
                {t.description && <p className="mt-0.5 text-xs text-ink-400">{t.description}</p>}
                {t.due_date && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                    <Calendar className="h-3 w-3" />
                    Due {t.due_date}
                  </div>
                )}
              </div>
              <PriorityBadge priority={t.priority} />
              <span className={`h-2 w-2 shrink-0 rounded-full ${priorityColors[t.priority] ?? priorityColors.low}`} />
              <button
                onClick={() => handleDelete(t.id)}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: Partial<Task>) => void }) {
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: 'todo',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Add Task</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full resize-none rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due Date" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
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

function Field({ label, required, type = 'text', value, onChange }: { label: string; required?: boolean; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}{required && <span className="ml-1 text-brand-400">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" />
    </div>
  );
}
