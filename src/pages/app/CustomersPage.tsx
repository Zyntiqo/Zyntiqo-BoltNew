import { useEffect, useState, useCallback } from 'react';
import { Users, Loader2, Mail, Phone, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, EmptyState, timeAgo } from './DashboardPage';

type Customer = {
  id: string;
  full_name: string;
  email: string;
  business_name: string | null;
  phone: string | null;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, business_name, phone, created_at')
        .eq('role', 'CUSTOMER')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCustomers((data ?? []) as Customer[]);
    } catch {
      setLoadError(true);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.business_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customers</h1>
          <p className="mt-1 text-sm text-ink-400">All registered customer accounts.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers…"
          className="w-full max-w-xs rounded-full border border-white/10 bg-ink-950 px-4 py-2 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : loadError ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Couldn't load customers"
            subtitle="Something went wrong. Please try again."
            action={<button onClick={load} className="rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-xs font-semibold text-ink-950">Retry</button>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={search ? "No matching customers" : "No customers yet"}
            subtitle={search ? "Try a different search term." : "Customer registrations will appear here once they sign up."}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title={`All Customers (${filtered.length})`} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 text-xs text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-300">
                          {c.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-white">{c.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-ink-300">
                        <Mail className="h-3.5 w-3.5 text-ink-500" />{c.email}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {c.business_name ? (
                        <span className="inline-flex items-center gap-1.5 text-ink-300">
                          <Building2 className="h-3.5 w-3.5 text-ink-500" />{c.business_name}
                        </span>
                      ) : <span className="text-ink-500">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-ink-300">
                          <Phone className="h-3.5 w-3.5 text-ink-500" />{c.phone}
                        </span>
                      ) : <span className="text-ink-500">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-500">{timeAgo(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
