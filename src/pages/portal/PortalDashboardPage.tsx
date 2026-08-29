import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Calendar,
  FileText,
  Receipt,
  LifeBuoy,
  Activity as ActivityIcon,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, EmptyState, formatNum, timeAgo } from '@/pages/app/DashboardPage';
import { useAuth } from '@/lib/auth';
import {
  projectsApi,
  quotesApi,
  invoicesApi,
  ticketsApi,
  type Project,
  type Quote,
  type Invoice,
  type SupportTicket,
} from '@/lib/services/portal';
import { meetingsApi, activitiesApi, type Meeting, type Activity as ActivityRecord } from '@/lib/services/platform';

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, m, q, i, t, a] = await Promise.all([
        projectsApi.list(),
        meetingsApi.list(),
        quotesApi.list(),
        invoicesApi.list(),
        ticketsApi.list(),
        activitiesApi.list(),
      ]);
      setProjects(p);
      setMeetings(m);
      setQuotes(q);
      setInvoices(i);
      setTickets(t);
      setActivities(a);
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

  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'in_progress');
  const upcomingMeetings = meetings
    .filter((m) => m.status === 'scheduled' && new Date(m.scheduled_at) >= new Date())
    .slice(0, 5);
  const pendingQuotes = quotes.filter((q) => q.status === 'Sent' || q.status === 'Viewed');
  const outstandingInvoices = invoices.filter(
    (inv) => inv.status !== 'Paid' && inv.status !== 'Cancelled',
  );
  const openTickets = tickets.filter((t) => t.status !== 'Closed' && t.status !== 'Resolved');

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-ink-400">Here's an overview of your account with Zyntiqo.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Active Projects" value={activeProjects.length} icon={FolderKanban} to="/portal/projects" />
        <SummaryCard label="Upcoming Meetings" value={upcomingMeetings.length} icon={Calendar} to="/portal/meetings" />
        <SummaryCard label="Pending Quotes" value={pendingQuotes.length} icon={FileText} to="/portal/quotes" />
        <SummaryCard label="Outstanding Invoices" value={outstandingInvoices.length} icon={Receipt} to="/portal/invoices" />
        <SummaryCard label="Open Tickets" value={openTickets.length} icon={LifeBuoy} to="/portal/support" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active projects */}
          <Card>
            <CardHeader
              title="Active Projects"
              icon={FolderKanban}
              action={<Link to="/portal/projects" className="text-xs text-brand-300 hover:text-brand-200">View all →</Link>}
            />
            <div className="space-y-2 px-3 pb-3">
              {activeProjects.length === 0 ? (
                <EmptyState icon={FolderKanban} title="No active projects" subtitle="Projects you're working on with Zyntiqo will appear here." />
              ) : (
                activeProjects.slice(0, 5).map((p) => (
                  <div key={p.id} className="rounded-lg border border-white/5 bg-ink-900/40 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-white">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                          style={{ width: `${p.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-400">{p.progress ?? 0}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Pending quotes */}
          <Card>
            <CardHeader
              title="Pending Quotes"
              icon={FileText}
              action={<Link to="/portal/quotes" className="text-xs text-brand-300 hover:text-brand-200">View all →</Link>}
            />
            <div className="space-y-2 px-3 pb-3">
              {pendingQuotes.length === 0 ? (
                <EmptyState icon={FileText} title="No pending quotes" subtitle="Quotes awaiting your review will show here." />
              ) : (
                pendingQuotes.slice(0, 4).map((q) => (
                  <div key={q.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-900/40 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{q.quote_number}</p>
                      <p className="truncate text-xs text-ink-500">{q.subject ?? 'Quote'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">₹{formatNum(Number(q.total ?? 0))}</p>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Outstanding invoices */}
          <Card>
            <CardHeader
              title="Outstanding Invoices"
              icon={Receipt}
              action={<Link to="/portal/invoices" className="text-xs text-brand-300 hover:text-brand-200">View all →</Link>}
            />
            <div className="space-y-2 px-3 pb-3">
              {outstandingInvoices.length === 0 ? (
                <EmptyState icon={Receipt} title="No outstanding invoices" subtitle="All your invoices are paid or cancelled." />
              ) : (
                outstandingInvoices.slice(0, 4).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-900/40 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{inv.invoice_number}</p>
                      {inv.due_date && <p className="text-xs text-ink-500">Due {new Date(inv.due_date).toLocaleDateString()}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">₹{formatNum(Number(inv.amount ?? 0))}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming meetings */}
          <Card>
            <CardHeader
              title="Upcoming Meetings"
              icon={Calendar}
              action={<Link to="/portal/meetings" className="text-xs text-brand-300 hover:text-brand-200">All →</Link>}
            />
            <div className="space-y-2 px-3 pb-3">
              {upcomingMeetings.length === 0 ? (
                <EmptyState icon={Calendar} title="No meetings scheduled" subtitle="Book a consultation to get started." />
              ) : (
                upcomingMeetings.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-ink-900/40 px-3 py-2.5">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-500/10">
                      <span className="text-xs font-semibold text-brand-300">{new Date(m.scheduled_at).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{m.title}</p>
                      <p className="text-xs text-ink-500">
                        {new Date(m.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Open tickets */}
          <Card>
            <CardHeader
              title="Open Support Tickets"
              icon={LifeBuoy}
              action={<Link to="/portal/support" className="text-xs text-brand-300 hover:text-brand-200">All →</Link>}
            />
            <div className="space-y-2 px-3 pb-3">
              {openTickets.length === 0 ? (
                <EmptyState icon={LifeBuoy} title="No open tickets" subtitle="Everything looks good. Create a ticket if you need help." />
              ) : (
                openTickets.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-900/40 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-200">{t.subject}</p>
                      <p className="text-xs text-ink-500">{timeAgo(t.updated_at)}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader title="Recent Activity" icon={ActivityIcon} />
            <div className="space-y-1 px-3 pb-3">
              {activities.length === 0 ? (
                <EmptyState icon={ActivityIcon} title="No activity yet" subtitle="Updates from your projects and account will appear here." />
              ) : (
                activities.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-white/5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                      <ActivityIcon className="h-3.5 w-3.5 text-brand-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-200">{a.description}</p>
                      <p className="text-xs text-ink-500">{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, to }: {
  label: string; value: number;
  icon: React.ComponentType<{ className?: string }>; to: string;
}) {
  return (
    <Link to={to} className="group rounded-2xl border border-white/5 bg-ink-900/40 p-5 transition hover:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
          <Icon className="h-5 w-5 text-brand-300" />
        </div>
        <ArrowRight className="h-4 w-4 text-ink-500 transition group-hover:text-brand-300" />
      </div>
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-ink-400">{label}</p>
    </Link>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300', in_progress: 'bg-brand-500/15 text-brand-300',
  completed: 'bg-ink-500/15 text-ink-300', on_hold: 'bg-amber-500/15 text-amber-300',
  Sent: 'bg-brand-500/15 text-brand-300', Viewed: 'bg-indigo-500/15 text-indigo-300',
  Approved: 'bg-emerald-500/15 text-emerald-300', Rejected: 'bg-red-500/15 text-red-300',
  Draft: 'bg-ink-500/15 text-ink-300', Paid: 'bg-emerald-500/15 text-emerald-300',
  Unpaid: 'bg-amber-500/15 text-amber-300', Overdue: 'bg-red-500/15 text-red-300',
  Cancelled: 'bg-ink-500/15 text-ink-300', Open: 'bg-brand-500/15 text-brand-300',
  In_Progress: 'bg-indigo-500/15 text-indigo-300', Resolved: 'bg-emerald-500/15 text-emerald-300',
  Closed: 'bg-ink-500/15 text-ink-300',
};
function StatusBadge({ status }: { status: string }) {
  const k = status?.replace(/\s+/g, '_') ?? '';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[k] ?? 'bg-ink-500/15 text-ink-300'}`}>{status}</span>;
}
