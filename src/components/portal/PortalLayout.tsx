import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  FileText,
  Receipt,
  LifeBuoy,
  FolderOpen,
  User,
  Menu,
  Bell,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/projects', label: 'Projects', icon: FolderKanban },
  { to: '/portal/meetings', label: 'Meetings', icon: Calendar },
  { to: '/portal/quotes', label: 'Quotes', icon: FileText },
  { to: '/portal/invoices', label: 'Invoices', icon: Receipt },
  { to: '/portal/support', label: 'Support', icon: LifeBuoy },
  { to: '/portal/files', label: 'Files', icon: FolderOpen },
  { to: '/portal/profile', label: 'Profile', icon: User },
];

export default function PortalLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/5 bg-ink-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <NavLink to="/portal" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 font-display text-sm font-semibold text-ink-950">Z</span>
            <span className="font-display text-base font-semibold text-white">Customer Portal</span>
          </NavLink>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Close sidebar">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-brand-500/15 to-accent-500/10 text-white'
                      : 'text-ink-400 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/5 px-3 py-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-ink-950">
              {user?.full_name?.charAt(0) ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.full_name ?? 'User'}</p>
              <p className="truncate text-[10px] text-ink-500">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-500/10 hover:text-red-400" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <NavLink to="/" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-ink-500 transition-colors hover:bg-white/5 hover:text-ink-300">
            <ChevronLeft className="h-4 w-4" /> Back to Website
          </NavLink>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-ink-950/80 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-ink-300 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm text-ink-400">Welcome back, <span className="font-medium text-white">{user?.full_name?.split(' ')[0] ?? 'there'}</span></p>
          <button className="relative rounded-lg p-2 text-ink-300 hover:bg-white/5 hover:text-white" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
