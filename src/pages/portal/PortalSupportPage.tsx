import { useEffect, useState } from 'react';
import { LifeBuoy, Plus, Send, MessageSquare, X, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, EmptyState, timeAgo } from '@/pages/app/DashboardPage';
import { useAuth } from '@/lib/auth';
import {
  ticketsApi,
  ticketMessagesApi,
  type SupportTicket,
  type TicketMessage,
} from '@/lib/services/portal';

export default function PortalSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      const t = await ticketsApi.list();
      setTickets(t);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const msgs = await ticketMessagesApi.forTicket(selected.id);
      setMessages(msgs);
    })();
  }, [selected]);

  async function createTicket() {
    if (!subject.trim() || !user) return;
    setCreating(true);
    const t = await ticketsApi.create({
      customer_id: user.id,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      status: 'Open',
    });
    if (t) {
      setTickets((prev) => [t, ...prev]);
      setSubject('');
      setDescription('');
      setPriority('medium');
      setShowNew(false);
    }
    setCreating(false);
  }

  async function sendReply() {
    if (!reply.trim() || !selected || !user) return;
    setSending(true);
    const msg = await ticketMessagesApi.create({
      ticket_id: selected.id,
      author_id: user.id,
      message: reply.trim(),
      is_staff: false,
    });
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setReply('');
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  // Ticket detail view
  if (selected) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to tickets
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-white">{selected.subject}</h1>
            <StatusBadge status={selected.status} />
          </div>
          <p className="mt-1 text-sm text-ink-400">Opened {timeAgo(selected.created_at)} · {selected.priority} priority</p>
        </div>

        {selected.description && (
          <Card>
            <div className="px-5 py-4">
              <p className="text-sm text-ink-200">{selected.description}</p>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Conversation" icon={MessageSquare} />
          <div className="space-y-3 px-4 pb-4">
            {messages.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No messages yet" subtitle="Start the conversation by replying below." />
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.is_staff ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.is_staff ? 'bg-ink-900/60 border border-white/5' : 'bg-gradient-to-r from-brand-500/20 to-accent-500/20 border border-brand-500/20'}`}>
                    <p className="text-sm text-ink-100">{m.message}</p>
                    <p className="mt-1 text-xs text-ink-500">{timeAgo(m.created_at)} · {m.is_staff ? 'Staff' : 'You'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-white/5 px-4 py-3">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendReply()}
              placeholder="Type a reply…"
              className="flex-1 rounded-xl border border-white/5 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder-ink-500 focus:border-brand-500/30 focus:outline-none"
            />
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Support</h1>
          <p className="mt-1 text-sm text-ink-400">Get help from the Zyntiqo team.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* New ticket form */}
      {showNew && (
        <Card>
          <CardHeader title="Create a Support Ticket" icon={Plus} action={
            <button onClick={() => setShowNew(false)} className="text-ink-500 hover:text-white"><X className="h-4 w-4" /></button>
          } />
          <div className="space-y-4 px-5 pb-5">
            <div>
              <label className="text-xs font-medium text-ink-400">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe the issue"
                className="mt-1 w-full rounded-xl border border-white/5 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder-ink-500 focus:border-brand-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-400">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Provide details about your issue…"
                className="mt-1 w-full rounded-xl border border-white/5 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder-ink-500 focus:border-brand-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/5 bg-ink-950/60 px-3 py-2 text-sm text-white focus:border-brand-500/30 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button
              onClick={createTicket}
              disabled={creating || !subject.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Submit Ticket'}
            </button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="My Tickets" icon={LifeBuoy} />
        {tickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No support tickets"
            subtitle="Need help? Create a new ticket and our team will assist you."
            action={
              <button
                onClick={() => setShowNew(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> New Ticket
              </button>
            }
          />
        ) : (
          <div className="space-y-2 px-3 pb-3">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-ink-900/40 px-3 py-3 text-left transition hover:border-white/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{t.subject}</p>
                  <p className="text-xs text-ink-500">Updated {timeAgo(t.updated_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: 'bg-brand-500/15 text-brand-300',
    In_Progress: 'bg-indigo-500/15 text-indigo-300',
    Resolved: 'bg-emerald-500/15 text-emerald-300',
    Closed: 'bg-ink-500/15 text-ink-300',
  };
  const normalized = status?.replace(/\s+/g, '_') ?? '';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[normalized] ?? 'bg-ink-500/15 text-ink-300'}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
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
