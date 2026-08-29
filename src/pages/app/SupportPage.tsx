import { useEffect, useState, useCallback } from 'react';
import { Plus, LifeBuoy, Loader2, Send, UserCircle } from 'lucide-react';
import { ticketsApi, ticketMessagesApi, type SupportTicket, type TicketMessage } from '@/lib/services/portal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, EmptyState, timeAgo } from './DashboardPage';

type Profile = { id: string; full_name: string; email: string };

const statusColors: Record<string, string> = {
  open: 'bg-brand-500/15 text-brand-300',
  in_progress: 'bg-amber-500/15 text-amber-300',
  resolved: 'bg-emerald-500/15 text-emerald-300',
  closed: 'bg-ink-500/15 text-ink-300',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-300',
  high: 'bg-amber-500/15 text-amber-300',
  normal: 'bg-brand-500/15 text-brand-300',
  low: 'bg-ink-500/15 text-ink-300',
};

type Filter = 'all' | 'open' | 'assigned' | 'urgent';

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [t, s] = await Promise.all([
        ticketsApi.list(),
        supabase.from('profiles').select('id, full_name, email').in('role', ['SUPER_ADMIN', 'ADMIN', 'SALES', 'PROJECT_MANAGER', 'SUPPORT']).order('full_name'),
      ]);
      setTickets(t);
      setStaff((s.data ?? []) as Profile[]);
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter((t) => {
    if (filter === 'open') return t.status === 'open' || t.status === 'in_progress';
    if (filter === 'assigned') return Boolean(t.assigned_to);
    if (filter === 'urgent') return t.priority === 'urgent';
    return true;
  });

  const handleAssign = async (ticket: SupportTicket, staffId: string) => {
    try { await ticketsApi.update(ticket.id, { assigned_to: staffId || null }); } catch {}
    load();
    setSelected((prev) => (prev && prev.id === ticket.id ? { ...prev, assigned_to: staffId || null } : prev));
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tickets.length },
    { key: 'open', label: 'Open', count: tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length },
    { key: 'assigned', label: 'Assigned', count: tickets.filter((t) => Boolean(t.assigned_to)).length },
    { key: 'urgent', label: 'Urgent', count: tickets.filter((t) => t.priority === 'urgent').length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Support</h1>
        <p className="mt-1 text-sm text-ink-400">Manage customer support tickets and respond to inquiries.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-ink-950' : 'border border-white/10 text-ink-300 hover:bg-white/5'
            }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === f.key ? 'bg-ink-950/20' : 'bg-white/5'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={LifeBuoy} title="No tickets found" subtitle={filter === 'all' ? 'Customer support tickets will appear here.' : `No ${filter} tickets right now.`} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const assignee = staff.find((s) => s.id === t.assigned_to);
            return (
              <Card key={t.id} className="cursor-pointer p-5 transition-colors hover:bg-white/5" >
                <div className="flex items-start justify-between gap-2" onClick={() => setSelected(t)}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{t.subject}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{timeAgo(t.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[t.status] ?? statusColors.open}`}>{t.status}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[t.priority] ?? priorityColors.normal}`}>{t.priority}</span>
                  </div>
                </div>
                {t.description && <p className="mt-2 line-clamp-2 text-xs text-ink-400">{t.description}</p>}
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-ink-500">{assignee ? `Assigned: ${assignee.full_name}` : 'Unassigned'}</span>
                  <select
                    value={t.assigned_to ?? ''}
                    onChange={(e) => { e.stopPropagation(); handleAssign(t, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg border border-white/10 bg-ink-950 px-2 py-1 text-xs text-white focus:border-brand-400/40 focus:outline-none"
                  >
                    <option value="">Assign…</option>
                    {staff.map((s) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
                  </select>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <TicketDetailModal
          ticket={selected}
          staff={staff}
          currentUserId={user?.id ?? null}
          onClose={() => setSelected(null)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

function TicketDetailModal({
  ticket,
  staff,
  currentUserId,
  onClose,
  onAssign,
}: {
  ticket: SupportTicket;
  staff: Profile[];
  currentUserId: string | null;
  onClose: () => void;
  onAssign: (t: SupportTicket, staffId: string) => void;
}) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    ticketMessagesApi.forTicket(ticket.id).then((m) => {
      setMessages(m);
      setLoadingMsgs(false);
    }).catch(() => setLoadingMsgs(false));
  }, [ticket.id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !currentUserId || sending) return;
    setSending(true);
    try {
      const msg = await ticketMessagesApi.create({
        ticket_id: ticket.id,
        author_id: currentUserId,
        message: reply.trim(),
        is_staff: true,
      });
      if (msg) setMessages((prev) => [...prev, msg]);
      setReply('');
    } catch {
      // best-effort
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-ink-900 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{ticket.subject}</h2>
            <p className="mt-0.5 text-xs text-ink-500">Created {timeAgo(ticket.created_at)}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[ticket.status] ?? statusColors.open}`}>{ticket.status}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[ticket.priority] ?? priorityColors.normal}`}>{ticket.priority}</span>
          </div>
        </div>

        {ticket.description && (
          <div className="mt-4 rounded-xl border border-white/5 bg-ink-950/40 p-3">
            <p className="text-sm text-ink-200">{ticket.description}</p>
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-ink-400">Assigned To</label>
          <select
            value={ticket.assigned_to ?? ''}
            onChange={(e) => onAssign(ticket, e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white focus:border-brand-400/40 focus:outline-none"
          >
            <option value="">Unassigned</option>
            {staff.map((s) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
          </select>
        </div>

        {/* Messages */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-white">Messages</h3>
          {loadingMsgs ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="mt-2 text-xs text-ink-500">No messages yet. Start the conversation below.</p>
          ) : (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.is_staff ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.is_staff ? 'bg-accent-500/15' : 'bg-brand-500/15'}`}>
                    <UserCircle className="h-4 w-4 text-ink-300" />
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${m.is_staff ? 'bg-accent-500/10 text-ink-100' : 'bg-ink-950/60 text-ink-200'}`}>
                    <p className="text-sm">{m.message}</p>
                    <p className="mt-1 text-[10px] text-ink-500">{timeAgo(m.created_at)}{m.is_staff && ' · Staff'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply */}
        <form onSubmit={sendReply} className="mt-4 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply as staff…"
            className="flex-1 rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
          />
          <button type="submit" disabled={sending || !reply.trim()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-ink-300 hover:bg-white/5">Close</button>
        </div>
      </div>
    </div>
  );
}
