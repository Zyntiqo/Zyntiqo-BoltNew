import { useEffect, useState, useCallback } from 'react';
import { Plus, Workflow, Play, Pause, Trash2, Zap, GitBranch, Clock, Bot, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import {
  automationsApi,
  automationRunsApi,
  activitiesApi,
  type Automation,
  type AutomationStep,
  type AutomationRun,
} from '@/lib/services/platform';
import { triggerAutomation } from '@/lib/services/automation';
import { Card, CardHeader, EmptyState } from './DashboardPage';

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  condition: GitBranch,
  ai_action: Bot,
  action: Zap,
  delay: Clock,
  branch: GitBranch,
};

const templates = [
  {
    name: 'New Lead Follow-Up',
    trigger: 'new_lead',
    description: 'Create a follow-up task and update the lead status to Contacted.',
    steps: [
      { id: 's1', type: 'action', label: 'Create follow-up task', config: { action: 'create_task', task_title: 'Follow up with new lead', task_description: 'Reach out to the new lead within 24 hours.', priority: 'high' } },
      { id: 's2', type: 'action', label: 'Update lead status', config: { action: 'update_lead_status', status: 'Contacted' } },
      { id: 's3', type: 'action', label: 'Log notification', config: { action: 'internal_notification', message: 'New lead received and assigned for follow-up.' } },
    ] as AutomationStep[],
  },
  {
    name: 'New Lead with AI Qualification',
    trigger: 'new_lead',
    description: 'Use AI to qualify the lead, then create a task and update status. Requires AI to be configured.',
    steps: [
      { id: 's1', type: 'ai_action', label: 'Qualify lead with AI', config: { ai_task: 'qualify_lead', prompt: 'Qualify this lead and provide a brief assessment.' } },
      { id: 's2', type: 'action', label: 'Create follow-up task', config: { action: 'create_task', task_title: 'Contact qualified lead', priority: 'high' } },
      { id: 's3', type: 'action', label: 'Update lead status', config: { action: 'update_lead_status', status: 'Qualified' } },
    ] as AutomationStep[],
  },
  {
    name: 'Lead Status Change Alert',
    trigger: 'deal_status_changed',
    description: 'Log a notification and add a note when a deal changes stage.',
    steps: [
      { id: 's1', type: 'action', label: 'Log notification', config: { action: 'internal_notification', message: 'Deal stage changed — review pipeline.' } },
      { id: 's2', type: 'action', label: 'Add note', config: { action: 'add_note', note: 'Deal stage changed by automation.' } },
    ] as AutomationStep[],
  },
  {
    name: 'Inactive Customer Re-engagement',
    trigger: 'customer_inactive',
    description: 'Generate a re-engagement message with AI and create a follow-up task. Requires AI to be configured.',
    steps: [
      { id: 's1', type: 'condition', label: 'Check: inactive 30+ days', config: { field: 'days_inactive', operator: 'gt', value: '30' } },
      { id: 's2', type: 'ai_action', label: 'Generate re-engagement message', config: { ai_task: 'generate_content', prompt: 'Write a re-engagement message for an inactive customer.' } },
      { id: 's3', type: 'action', label: 'Create follow-up task', config: { action: 'create_task', task_title: 'Re-engage inactive customer', priority: 'medium' } },
    ] as AutomationStep[],
  },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  const [running, setRunning] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [a, r] = await Promise.all([automationsApi.list(), automationRunsApi.list()]);
      setAutomations(a);
      setRuns(r);
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleEnabled = async (auto: Automation) => {
    try { await automationsApi.update(auto.id, { enabled: !auto.enabled }); } catch {}
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await automationsApi.remove(id);
      await activitiesApi.create({ type: 'automation', description: `Automation deleted: ${name}` });
    } catch {}
    load();
  };

  const handleCreateFromTemplate = async (tpl: typeof templates[number]) => {
    try {
      await automationsApi.create({
        name: tpl.name,
        trigger: tpl.trigger,
        enabled: true,
        steps: tpl.steps,
      });
      await activitiesApi.create({ type: 'automation', description: `Automation created: ${tpl.name}` });
    } catch {}
    setShowTemplates(false);
    load();
  };

  const handleRun = async (auto: Automation) => {
    if (running) return;
    setRunning(auto.id);
    try {
      const result = await triggerAutomation(auto.id, { manual: true });
      if (!result.ok) {
        alert(result.message);
      }
    } catch {
      alert('Something went wrong running the automation. Please try again.');
    } finally {
      setRunning(null);
      load();
    }
  };

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
          <h1 className="text-2xl font-semibold text-white">Automations</h1>
          <p className="mt-1 text-sm text-ink-400">Build workflows that run your business on autopilot.</p>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> New Automation
        </button>
      </div>

      {automations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Workflow}
            title="No automations yet"
            subtitle="Create your first workflow from a template or build one from scratch."
            action={
              <button onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950">
                <Plus className="h-4 w-4" /> Browse Templates
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {automations.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{a.name}</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    Trigger: <span className="text-brand-300">{a.trigger.replace(/_/g, ' ')}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRun(a)}
                    disabled={running === a.id}
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
                    title="Run now"
                  >
                    {running === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleEnabled(a)}
                    className={`rounded-lg p-1.5 ${a.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-ink-500 hover:bg-white/5'}`}
                    title={a.enabled ? 'Pause' : 'Enable'}
                  >
                    {a.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setSelectedAutomation(a)}
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5 hover:text-white"
                    title="View details"
                  >
                    <Workflow className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id, a.name)}
                    className="rounded-lg p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Steps preview */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className="rounded-lg bg-brand-500/10 px-2 py-1 text-[10px] font-medium text-brand-300">
                  {a.trigger.replace(/_/g, ' ')}
                </span>
                <ArrowRight className="h-3 w-3 text-ink-600" />
                {(a.steps ?? []).slice(0, 4).map((s, i) => {
                  const Icon = stepIcons[s.type] ?? Zap;
                  return (
                    <span key={s.id ?? i} className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-ink-300">
                      <Icon className="h-3 w-3" />
                      {s.label.length > 20 ? s.label.slice(0, 18) + '…' : s.label}
                    </span>
                  );
                })}
                {(a.steps ?? []).length > 4 && (
                  <span className="text-[10px] text-ink-500">+{(a.steps ?? []).length - 4} more</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent runs */}
      {runs.length > 0 && (
        <Card>
          <CardHeader title="Execution History" />
          <div className="space-y-1 px-3 pb-3">
            {runs.slice(0, 10).map((r) => {
              const auto = automations.find((a) => a.id === r.automation_id);
              return (
                <div key={r.id} className="rounded-lg px-2 py-2 hover:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${r.status === 'completed' ? 'bg-emerald-400' : r.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'}`} />
                      <span className="text-sm text-ink-200 capitalize">{r.status}</span>
                      {auto && <span className="text-xs text-ink-500">{auto.name}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {r.duration_ms != null && <span className="text-[10px] text-ink-600">{r.duration_ms}ms</span>}
                      <span className="text-xs text-ink-500">{new Date(r.started_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {r.status === 'failed' && r.error_message && (
                    <div className="mt-1 flex items-center gap-1.5 pl-5 text-xs text-red-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{r.error_message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Template picker */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowTemplates(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-ink-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">Choose a Template</h2>
            <p className="mt-1 text-sm text-ink-400">Start from a proven workflow. You can customize it after.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleCreateFromTemplate(tpl)}
                  className="rounded-xl border border-white/5 bg-ink-950/40 p-4 text-left transition-all hover:border-brand-400/30 hover:bg-brand-500/5"
                >
                  <p className="text-sm font-semibold text-white">{tpl.name}</p>
                  <p className="mt-1 text-xs text-ink-400">{tpl.description}</p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-brand-300">
                    {tpl.steps.length} steps <ArrowRight className="h-3 w-3" /> Use this
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowTemplates(false)} className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-sm text-ink-300 hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selectedAutomation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedAutomation(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">{selectedAutomation.name}</h2>
            <p className="mt-1 text-xs text-ink-400">Trigger: {selectedAutomation.trigger.replace(/_/g, ' ')}</p>
            <div className="mt-4 space-y-2">
              {(selectedAutomation.steps ?? []).map((s, i) => {
                const Icon = stepIcons[s.type] ?? Zap;
                return (
                  <div key={s.id ?? i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-950/40 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
                      <Icon className="h-4 w-4 text-brand-300" />
                    </div>
                    <div>
                      <p className="text-sm text-white">{s.label}</p>
                      <p className="text-[10px] capitalize text-ink-500">{s.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSelectedAutomation(null)} className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-sm text-ink-300 hover:bg-white/5">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
