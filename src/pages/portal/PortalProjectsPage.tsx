import { useEffect, useState } from 'react';
import { FolderKanban, ChevronDown, Calendar, User, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/pages/app/DashboardPage';
import { projectsApi, milestonesApi, type Project, type Milestone } from '@/lib/services/portal';

export default function PortalProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestonesByProject, setMilestonesByProject] = useState<Record<string, Milestone[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await projectsApi.list();
      setProjects(p);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    if (milestonesByProject[expanded]) return;
    (async () => {
      const ms = await milestonesApi.forProject(expanded);
      setMilestonesByProject((prev) => ({ ...prev, [expanded]: ms }));
    })();
  }, [expanded, milestonesByProject]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">My Projects</h1>
        <p className="mt-1 text-sm text-ink-400">Track the progress of your active and completed projects.</p>
      </div>

      <Card>
        <CardHeader title="All Projects" icon={FolderKanban} />
        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects yet" subtitle="Projects assigned to your account will appear here." />
        ) : (
          <div className="space-y-2 px-3 pb-3">
            {projects.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/5 bg-ink-900/40">
                <button
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-white">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                      {p.service && <span>{p.service}</span>}
                      {p.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(p.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {p.expected_completion && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due {new Date(p.expected_completion).toLocaleDateString()}
                        </span>
                      )}
                      {p.assigned_staff && p.assigned_staff.length > 0 && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {p.assigned_staff.join(', ')}
                        </span>
                      )}
                    </div>
                    {p.website && (
                      <a href={p.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200">
                        <ExternalLink className="h-3 w-3" /> {p.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                          style={{ width: `${p.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-400">{p.progress ?? 0}%</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${expanded === p.id ? 'rotate-180' : ''}`}
                  />
                </button>

                {expanded === p.id && (
                  <div className="border-t border-white/5 px-4 py-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Milestones</p>
                    {milestonesByProject[p.id] === undefined ? (
                      <p className="text-sm text-ink-500">Loading milestones…</p>
                    ) : milestonesByProject[p.id].length === 0 ? (
                      <p className="text-sm text-ink-500">No milestones defined for this project.</p>
                    ) : (
                      <div className="space-y-2">
                        {milestonesByProject[p.id].map((m) => (
                          <div key={m.id} className="flex items-start gap-3 rounded-lg bg-ink-950/40 px-3 py-2.5">
                            {m.completed ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm ${m.completed ? 'text-ink-300 line-through' : 'text-white'}`}>{m.title}</p>
                              {m.description && <p className="mt-0.5 text-xs text-ink-500">{m.description}</p>}
                              {m.due_date && (
                                <p className="mt-0.5 text-xs text-ink-500">Due {new Date(m.due_date).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-300',
    in_progress: 'bg-brand-500/15 text-brand-300',
    completed: 'bg-ink-500/15 text-ink-300',
    on_hold: 'bg-amber-500/15 text-amber-300',
    planning: 'bg-indigo-500/15 text-indigo-300',
  };
  const normalized = status?.replace(/\s+/g, '_').toLowerCase() ?? '';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[normalized] ?? 'bg-ink-500/15 text-ink-300'}`}>
      {status}
    </span>
  );
}
