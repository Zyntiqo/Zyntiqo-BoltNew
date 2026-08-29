import { useEffect, useState } from 'react';
import { FileText, Check, X, Calendar } from 'lucide-react';
import { Card, CardHeader, EmptyState, formatNum } from '@/pages/app/DashboardPage';
import { quotesApi, type Quote } from '@/lib/services/portal';

export default function PortalQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const q = await quotesApi.list();
      setQuotes(q);
      setLoading(false);
    }
    load();
  }, []);

  async function approve(id: string) {
    setActingId(id);
    await quotesApi.update(id, { status: 'Approved', customer_approved_at: new Date().toISOString() });
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'Approved', customer_approved_at: new Date().toISOString() } : q)));
    setActingId(null);
  }

  async function reject(id: string) {
    setActingId(id);
    await quotesApi.update(id, { status: 'Rejected', customer_rejected_at: new Date().toISOString() });
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'Rejected', customer_rejected_at: new Date().toISOString() } : q)));
    setActingId(null);
  }

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
        <h1 className="text-2xl font-semibold text-white">Quotes</h1>
        <p className="mt-1 text-sm text-ink-400">Review and respond to quotes sent by Zyntiqo.</p>
      </div>

      <Card>
        <CardHeader title="All Quotes" icon={FileText} />
        {quotes.length === 0 ? (
          <EmptyState icon={FileText} title="No quotes yet" subtitle="Quotes prepared for your account will appear here." />
        ) : (
          <div className="space-y-2 px-3 pb-3">
            {quotes.map((q) => {
              const canAct = q.status === 'Sent' || q.status === 'Viewed';
              return (
                <div key={q.id} className="rounded-xl border border-white/5 bg-ink-900/40 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{q.quote_number}</p>
                        <StatusBadge status={q.status} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-ink-300">{q.subject ?? 'Quote'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                        <span className="font-semibold text-ink-300">₹{formatNum(Number(q.total ?? 0))}</span>
                        {q.valid_until && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Valid until {new Date(q.valid_until).toLocaleDateString()}
                          </span>
                        )}
                        {q.customer_approved_at && (
                          <span className="text-emerald-400">Approved {new Date(q.customer_approved_at).toLocaleDateString()}</span>
                        )}
                        {q.customer_rejected_at && (
                          <span className="text-red-400">Rejected {new Date(q.customer_rejected_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {canAct && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => approve(q.id)}
                          disabled={actingId === q.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => reject(q.id)}
                          disabled={actingId === q.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Draft: 'bg-ink-500/15 text-ink-300',
    Sent: 'bg-brand-500/15 text-brand-300',
    Viewed: 'bg-indigo-500/15 text-indigo-300',
    Approved: 'bg-emerald-500/15 text-emerald-300',
    Rejected: 'bg-red-500/15 text-red-300',
    Expired: 'bg-amber-500/15 text-amber-300',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? 'bg-ink-500/15 text-ink-300'}`}>
      {status}
    </span>
  );
}
