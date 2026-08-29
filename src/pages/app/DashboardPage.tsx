import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Activity as ActivityIcon,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  contactsApi,
  dealsApi,
  tasksApi,
  meetingsApi,
  activitiesApi,
  recommendationsApi,
  type Contact,
  type Deal,
  type Task,
  type Meeting,
  type Activity as ActivityRecord,
  type AIRecommendation,
} from '@/lib/services/platform';
import { isAIConfigured } from '@/lib/services/ai';

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [recs, setRecs] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [c, d, t, m, a, r] = await Promise.all([
          contactsApi.list(),
          dealsApi.list(),
          tasksApi.list(),
          meetingsApi.list(),
          activitiesApi.list(),
          recommendationsApi.list(),
        ]);
        setContacts(c);
        setDeals(d);
        setTasks(t);
        setMeetings(m);
        setActivities(a);
        setRecs(r);
      } catch {
        // data stays empty — empty states will show
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    const leads = contacts.filter((c) => c.status === 'lead');
    const customers = contacts.filter((c) => c.status === 'customer');
    const wonDeals = deals.filter((d) => d.stage === 'won');
    const pipelineValue = deals
      .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
      .reduce((sum, d) => sum + Number(d.value || 0), 0);
    const revenue = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const openTasks = tasks.filter((t) => t.status !== 'done');
    const upcomingMeetings = meetings
      .filter((m) => m.status === 'scheduled' && new Date(m.scheduled_at) >= new Date())
      .slice(0, 5);

    return {
      leadCount: leads.length,
      customerCount: customers.length,
      pipelineValue,
      revenue,
      openTasks: openTasks.length,
      conversionRate: contacts.length > 0 ? Math.round((customers.length / contacts.length) * 100) : 0,
      upcomingMeetings,
    };
  }, [contacts, deals, tasks, meetings]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-400">What's happening in your business today.</p>
      </div>

      {/* AI status banner */}
      {!isAIConfigured() && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-200">AI features are not connected</p>
            <p className="mt-0.5 text-xs text-amber-300/80">
              Add an AI API key in Settings to unlock AI-powered content generation, lead
              qualification, and smart recommendations.
            </p>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Leads"
          value={metrics.leadCount.toString()}
          icon={Users}
        />
        <MetricCard
          label="Pipeline Value"
          value={`₹${formatNum(metrics.pipelineValue)}`}
          icon={DollarSign}
        />
        <MetricCard
          label="Revenue (Won)"
          value={`₹${formatNum(metrics.revenue)}`}
          icon={TrendingUp}
        />
        <MetricCard
          label="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          icon={Target}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Activity + Pipeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pipeline overview */}
          <Card>
            <CardHeader title="Sales Pipeline" action={<Link to="/app/pipeline" className="text-xs text-brand-300 hover:text-brand-200">View all →</Link>} />
            <div className="grid grid-cols-5 gap-2 px-5 pb-5">
              {['lead', 'qualified', 'proposal', 'negotiation', 'won'].map((stage) => {
                const stageDeals = deals.filter((d) => d.stage === stage);
                const value = stageDeals.reduce((s, d) => s + Number(d.value || 0), 0);
                return (
                  <div key={stage} className="rounded-xl border border-white/5 bg-ink-900/40 p-3 text-center">
                    <p className="text-xs capitalize text-ink-400">{stage}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{stageDeals.length}</p>
                    <p className="text-xs text-ink-500">₹{formatNum(value)}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader title="Recent Activity" />
            <div className="space-y-1 px-3 pb-3">
              {activities.length === 0 ? (
                <EmptyState
                  icon={ActivityIcon}
                  title="No activity yet"
                  subtitle="Actions across CRM, campaigns, and automations will appear here."
                />
              ) : (
                activities.slice(0, 8).map((a) => (
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

        {/* Right: AI recs + meetings + tasks */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <Card>
            <CardHeader title="AI Recommendations" icon={Sparkles} />
            <div className="space-y-2 px-3 pb-3">
              {recs.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No recommendations yet"
                  subtitle={isAIConfigured() ? "AI will suggest actions as your data grows." : "Connect AI to get smart suggestions."}
                />
              ) : (
                recs.filter((r) => r.status === 'pending').slice(0, 4).map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/5 bg-ink-900/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white">{r.title}</p>
                      <PriorityBadge priority={r.priority} />
                    </div>
                    <p className="mt-1 text-xs text-ink-400">{r.description}</p>
                    {r.action_label && r.action_target && (
                      <Link
                        to={r.action_target}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
                      >
                        {r.action_label}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Upcoming meetings */}
          <Card>
            <CardHeader title="Upcoming Meetings" icon={Calendar} />
            <div className="space-y-2 px-3 pb-3">
              {metrics.upcomingMeetings.length === 0 ? (
                <EmptyState icon={Calendar} title="No meetings scheduled" subtitle="Book a consultation to get started." />
              ) : (
                metrics.upcomingMeetings.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-ink-900/40 px-3 py-2.5">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-500/10">
                      <span className="text-xs font-semibold text-brand-300">
                        {new Date(m.scheduled_at).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{m.title}</p>
                      <p className="text-xs text-ink-500">
                        {new Date(m.scheduled_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Open tasks */}
          <Card>
            <CardHeader title="Open Tasks" icon={CheckSquare} action={<Link to="/app/tasks" className="text-xs text-brand-300 hover:text-brand-200">All →</Link>} />
            <div className="space-y-2 px-3 pb-3">
              {tasks.filter((t) => t.status !== 'done').length === 0 ? (
                <EmptyState icon={CheckSquare} title="All caught up" subtitle="No pending tasks right now." />
              ) : (
                tasks.filter((t) => t.status !== 'done').slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-ink-900/40 px-3 py-2.5">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${t.priority === 'high' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-amber-400' : 'bg-brand-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-200">{t.title}</p>
                      {t.due_date && <p className="text-xs text-ink-500">Due {t.due_date}</p>}
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

// --- Shared UI components ---

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-ink-900/40 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-brand-300" />}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
          <Icon className="h-5 w-5 text-brand-300" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-ink-400">{label}</p>
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: 'bg-red-500/15 text-red-300',
    medium: 'bg-amber-500/15 text-amber-300',
    low: 'bg-brand-500/15 text-brand-300',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[priority] ?? styles.low}`}>
      {priority}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
        <Icon className="h-6 w-6 text-ink-500" />
      </div>
      <p className="mt-3 text-sm font-medium text-ink-200">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-ink-500">{subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function formatNum(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
