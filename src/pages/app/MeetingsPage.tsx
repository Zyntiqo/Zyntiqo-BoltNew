import { useEffect, useState, useCallback } from 'react';
import { Plus, Calendar as CalIcon, Clock, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { meetingsApi, contactsApi, activitiesApi, type Meeting, type Contact } from '@/lib/services/platform';
import { Card, CardHeader, EmptyState } from './DashboardPage';

const statusColors: Record<string, string> = {
  scheduled: 'bg-brand-500/15 text-brand-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  cancelled: 'bg-red-500/15 text-red-300',
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [m, c] = await Promise.all([meetingsApi.list(), contactsApi.list()]);
      setMeetings(m);
      setContacts(c);
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, title: string) => {
    try { await meetingsApi.remove(id); await activitiesApi.create({ type: 'meeting', description: `Meeting cancelled: ${title}` }); } catch {}
    load();
  };

  const handleStatus = async (m: Meeting, status: string) => {
    try { await meetingsApi.update(m.id, { status }); await activitiesApi.create({ type: 'meeting', description: `Meeting "${m.title}" marked ${status}` }); } catch {}
    load();
  };

  const handleAdd = async (data: Partial<Meeting>) => {
    try { await meetingsApi.create(data); await activitiesApi.create({ type: 'meeting', description: `Meeting scheduled: ${data.title}` }); } catch {}
    setShowAdd(false);
    load();
  };

  const contactName = (id: string | null) => contacts.find((c) => c.id === id)?.name ?? '—';

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
          <h1 className="text-2xl font-semibold text-white">Meetings</h1>
          <p className="mt-1 text-sm text-ink-400">Schedule and manage your consultations and meetings.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Schedule Meeting
        </button>
      </div>

      {meetings.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalIcon}
            title="No meetings scheduled"
            subtitle="Schedule your first meeting or sync with your consultation bookings."
            action={
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950">
                <Plus className="h-4 w-4" /> Schedule Meeting
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-brand-500/10">
                    <span className="text-xs font-semibold text-brand-300">
                      {new Date(m.scheduled_at).toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {new Date(m.scheduled_at).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{m.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(m.scheduled_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span>{m.duration_minutes}min</span>
                      <span>with {contactName(m.contact_id)}</span>
                    </div>
                    {m.agenda && <p className="mt-1 text-xs text-ink-500">{m.agenda}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[m.status] ?? statusColors.scheduled}`}>
                    {m.status}
                  </span>
                  {m.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleStatus(m, 'completed')}
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                        title="Mark completed"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatus(m, 'cancelled')}
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-red-500/10 hover:text-red-400"
                        title="Cancel"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(m.id, m.title)}
                    className="rounded-lg p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && <AddMeetingModal contacts={contacts} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}

function AddMeetingModal({ contacts, onClose, onAdd }: { contacts: Contact[]; onClose: () => void; onAdd: (data: Partial<Meeting>) => void }) {
  const [form, setForm] = useState({ title: '', contact_id: '', date: '', time: '10:00', duration: '30', agenda: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();
    onAdd({
      title: form.title,
      contact_id: form.contact_id || null,
      scheduled_at: scheduledAt,
      duration_minutes: Number(form.duration) || 30,
      status: 'scheduled',
      agenda: form.agenda || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Schedule Meeting</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Contact</label>
            <select value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })} className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none">
              <option value="">No contact</option>
              {contacts.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" type="date" required value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
          </div>
          <Field label="Duration (min)" type="number" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
          <Field label="Agenda" value={form.agenda} onChange={(v) => setForm({ ...form, agenda: v })} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-ink-300 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 py-2.5 text-sm font-semibold text-ink-950">Schedule</button>
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
