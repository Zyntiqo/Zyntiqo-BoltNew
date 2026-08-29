import { useEffect, useState, useCallback } from 'react';
import { UserCog, Loader2, Mail, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, EmptyState, timeAgo } from './DashboardPage';
import type { UserRole } from '@/lib/auth';

type StaffUser = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/15 text-red-300',
  ADMIN: 'bg-accent-500/15 text-accent-300',
  SALES: 'bg-brand-500/15 text-brand-300',
  PROJECT_MANAGER: 'bg-emerald-500/15 text-emerald-300',
  SUPPORT: 'bg-amber-500/15 text-amber-300',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SALES: 'Sales',
  PROJECT_MANAGER: 'Project Manager',
  SUPPORT: 'Support',
};

const STAFF_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'SALES', 'PROJECT_MANAGER', 'SUPPORT'];

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .in('role', STAFF_ROLES)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers((data ?? []) as StaffUser[]);
    } catch {
      setLoadError(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Users</h1>
          <p className="mt-1 text-sm text-ink-400">All staff and admin team members.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
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
            icon={UserCog}
            title="Couldn't load users"
            subtitle="Something went wrong. Please try again."
            action={<button onClick={load} className="rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-xs font-semibold text-ink-950">Retry</button>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={UserCog}
            title={search ? "No matching users" : "No staff users yet"}
            subtitle={search ? "Try a different search term." : "Staff and admin accounts will appear here once they're added."}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title={`Team Members (${filtered.length})`} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 text-xs text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-xs font-semibold text-brand-300">
                          {u.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-white">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-ink-300">
                        <Mail className="h-3.5 w-3.5 text-ink-500" />{u.email}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${roleColors[u.role] ?? 'bg-ink-500/15 text-ink-300'}`}>
                        <Shield className="h-3 w-3" />
                        {roleLabels[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-500">{timeAgo(u.created_at)}</td>
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
