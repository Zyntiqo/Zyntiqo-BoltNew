import { useEffect, useState } from 'react';
import { Receipt, ChevronDown, CreditCard, Calendar } from 'lucide-react';
import { Card, CardHeader, EmptyState, formatNum } from '@/pages/app/DashboardPage';
import { invoicesApi, paymentsApi, type Invoice, type Payment } from '@/lib/services/portal';

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentsByInvoice, setPaymentsByInvoice] = useState<Record<string, Payment[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const inv = await invoicesApi.list();
      setInvoices(inv);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!expanded || paymentsByInvoice[expanded]) return;
    (async () => {
      const pays = await paymentsApi.forInvoice(expanded);
      setPaymentsByInvoice((prev) => ({ ...prev, [expanded]: pays }));
    })();
  }, [expanded, paymentsByInvoice]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled')
    .reduce((sum, i) => sum + Number(i.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Invoices</h1>
        <p className="mt-1 text-sm text-ink-400">View your invoices and payment history.</p>
      </div>

      {totalOutstanding > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div>
            <p className="text-sm font-medium text-amber-200">Outstanding Balance</p>
            <p className="mt-0.5 text-xs text-amber-300/80">You have unpaid invoices totaling the amount below.</p>
          </div>
          <p className="text-xl font-semibold text-amber-200">₹{formatNum(totalOutstanding)}</p>
        </div>
      )}

      <Card>
        <CardHeader title="All Invoices" icon={Receipt} />
        {invoices.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices yet" subtitle="Invoices for your projects will appear here." />
        ) : (
          <div className="space-y-2 px-3 pb-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-white/5 bg-ink-900/40">
                <button
                  onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{inv.invoice_number}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                      <span className="font-semibold text-ink-300">₹{formatNum(Number(inv.amount ?? 0))}</span>
                      {inv.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due {new Date(inv.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${expanded === inv.id ? 'rotate-180' : ''}`} />
                </button>

                {expanded === inv.id && (
                  <div className="border-t border-white/5 px-4 py-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Payment History</p>
                    {paymentsByInvoice[inv.id] === undefined ? (
                      <p className="text-sm text-ink-500">Loading payments…</p>
                    ) : paymentsByInvoice[inv.id].length === 0 ? (
                      <p className="text-sm text-ink-500">No payments recorded for this invoice.</p>
                    ) : (
                      <div className="space-y-2">
                        {paymentsByInvoice[inv.id].map((pay) => (
                          <div key={pay.id} className="flex items-center justify-between rounded-lg bg-ink-950/40 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-brand-300" />
                              <div>
                                <p className="text-sm text-ink-200">₹{formatNum(Number(pay.amount ?? 0))}</p>
                                <p className="text-xs text-ink-500">
                                  {pay.method ?? '—'} · {pay.paid_at ? new Date(pay.paid_at).toLocaleDateString() : 'Pending'}
                                </p>
                              </div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              pay.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' :
                              pay.status === 'pending' ? 'bg-amber-500/15 text-amber-300' :
                              'bg-ink-500/15 text-ink-300'
                            }`}>
                              {pay.status}
                            </span>
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
    Paid: 'bg-emerald-500/15 text-emerald-300',
    Unpaid: 'bg-amber-500/15 text-amber-300',
    Overdue: 'bg-red-500/15 text-red-300',
    Cancelled: 'bg-ink-500/15 text-ink-300',
    Partial: 'bg-indigo-500/15 text-indigo-300',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? 'bg-ink-500/15 text-ink-300'}`}>
      {status}
    </span>
  );
}
