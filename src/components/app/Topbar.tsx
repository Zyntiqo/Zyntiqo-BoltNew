import { useState, useEffect } from 'react';
import { Menu, Bell, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { notificationsApi, type Notification } from '@/lib/services/portal';

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const [showNotif, setShowNotif] = useState(false);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    notificationsApi.list().then((n) => setNotifications(n)).catch(() => {});
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-ink-950/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-ink-300 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/app/assistant"
          className="inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-500/5 px-3 py-1.5 text-xs font-medium text-accent-300 transition-colors hover:bg-accent-500/10"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask AI
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="relative rounded-lg p-2 text-ink-300 hover:bg-white/5 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" />
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl backdrop-blur-xl">
              <p className="text-sm font-semibold text-white">Notifications</p>
              {notifications.length === 0 ? (
                <p className="mt-3 text-xs text-ink-500">No notifications yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className={`rounded-lg border px-3 py-2 text-xs ${n.read ? 'border-white/5 bg-white/5 text-ink-400' : 'border-brand-400/20 bg-brand-500/5 text-ink-200'}`}>
                      {n.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-semibold text-ink-950">
          {user?.full_name?.charAt(0) ?? 'Z'}
        </div>
      </div>
    </header>
  );
}
