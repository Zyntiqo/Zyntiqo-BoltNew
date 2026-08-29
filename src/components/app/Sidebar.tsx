import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Workflow,
  Megaphone,
  Calendar,
  CheckSquare,
  Sparkles,
  Settings,
  ChevronLeft,
  FolderKanban,
  FileText,
  Receipt,
  LifeBuoy,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/app/crm', label: 'CRM', icon: Users },
      { to: '/app/pipeline', label: 'Pipeline', icon: KanbanSquare },
      { to: '/app/quotes', label: 'Quotes', icon: FileText },
      { to: '/app/invoices', label: 'Invoices', icon: Receipt },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/app/projects', label: 'Projects', icon: FolderKanban },
      { to: '/app/meetings', label: 'Meetings', icon: Calendar },
      { to: '/app/tasks', label: 'Tasks', icon: CheckSquare },
      { to: '/app/support', label: 'Support', icon: LifeBuoy },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/app/automations', label: 'Automations', icon: Workflow },
      { to: '/app/campaigns', label: 'Campaigns', icon: Megaphone },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/app/customers', label: 'Customers', icon: Users },
      { to: '/app/users', label: 'Users', icon: UserCircle },
    ],
  },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/5 bg-ink-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <NavLink to="/app" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 font-display text-sm font-semibold text-ink-950">
              Z
            </span>
            <span className="font-display text-base font-semibold text-white">
              Zyntiqo <span className="text-accent-400">Pro</span>
            </span>
          </NavLink>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={'end' in item ? item.end : undefined}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-gradient-to-r from-brand-500/15 to-accent-500/10 text-white'
                            : 'text-ink-400 hover:bg-white/5 hover:text-white',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 px-3 py-3">
          <NavLink
            to="/app/assistant"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-accent-500/15 to-brand-500/10 text-white'
                  : 'text-ink-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            AI Assistant
          </NavLink>
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              cn(
                'mt-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/5 text-white'
                  : 'text-ink-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </NavLink>
        </div>

        <div className="border-t border-white/5 px-3 py-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-ink-950">
              {user?.full_name?.charAt(0) ?? 'Z'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.full_name ?? 'Admin'}</p>
              <p className="truncate text-[10px] text-ink-500">{user?.role}</p>
            </div>
            <button onClick={handleSignOut} className="rounded-lg p-1 text-ink-400 hover:bg-red-500/10 hover:text-red-400" aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          <NavLink
            to="/"
            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-ink-500 transition-colors hover:bg-white/5 hover:text-ink-300"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Website
          </NavLink>
        </div>
      </aside>
    </>
  );
}
