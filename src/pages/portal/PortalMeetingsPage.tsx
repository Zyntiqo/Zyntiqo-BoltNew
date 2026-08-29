import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Clock, Video } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/pages/app/DashboardPage';
import { meetingsApi, type Meeting } from '@/lib/services/platform';

export default function PortalMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const m = await meetingsApi.list();
      setMeetings(m);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduled_at) >= now && m.status === 'scheduled');
  const past = meetings.filter((m) => new Date(m.scheduled_at) < now || m.status !== 'scheduled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Meetings</h1>
          <p className="mt-1 text-sm text-ink-400">Your scheduled and past consultations with Zyntiqo.</p>
        </div>
        <Link
          to="/book-consultation"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Book a Consultation
        </Link>
      </div>

      {/* Upcoming */}
      <Card>
        <CardHeader title="Upcoming Meetings" icon={Calendar} />
        <div className="space-y-2 px-3 pb-3">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming meetings"
              subtitle="Book a consultation to schedule your next meeting."
              action={
                <Link
                  to="/book-consultation"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Book a Consultation
                </Link>
              }
            />
          ) : (
            upcoming.map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-ink-900/40 px-3 py-3">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-500/10">
                  <span className="text-[10px] uppercase text-brand-300">{new Date(m.scheduled_at).toLocaleString(undefined, { month: 'short' })}</span>
                  <span className="text-base font-semibold text-white">{new Date(m.scheduled_at).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{m.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(m.scheduled_at).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="h-3 w-3" /> {m.duration_minutes ?? 30} min
                    </span>
                  </div>
                  {m.agenda && <p className="mt-1.5 text-xs text-ink-400">{m.agenda}</p>}
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Past */}
      <Card>
        <CardHeader title="Past Meetings" icon={Clock} />
        <div className="space-y-2 px-3 pb-3">
          {past.length === 0 ? (
            <EmptyState icon={Clock} title="No past meetings" subtitle="Your meeting history will appear here." />
          ) : (
            past.map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-ink-900/40 px-3 py-3">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white/5">
                  <span className="text-[10px] uppercase text-ink-400">{new Date(m.scheduled_at).toLocaleString(undefined, { month: 'short' })}</span>
                  <span className="text-base font-semibold text-ink-300">{new Date(m.scheduled_at).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-200">{m.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {new Date(m.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  {m.notes && <p className="mt-1.5 text-xs text-ink-400">{m.notes}</p>}
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: 'bg-brand-500/15 text-brand-300',
    completed: 'bg-emerald-500/15 text-emerald-300',
    cancelled: 'bg-red-500/15 text-red-300',
    rescheduled: 'bg-amber-500/15 text-amber-300',
    no_show: 'bg-ink-500/15 text-ink-300',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? 'bg-ink-500/15 text-ink-300'}`}>
      {status}
    </span>
  );
}
