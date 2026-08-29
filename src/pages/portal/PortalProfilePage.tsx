import { useEffect, useState } from 'react';
import { User, Mail, Phone, Globe, Building2, Save, Check } from 'lucide-react';
import { Card, CardHeader } from '@/pages/app/DashboardPage';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function PortalProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setBusinessName(user.business_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setWebsite(user.website || '');
    }
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        business_name: businessName || null,
        phone: phone || null,
        website: website || null,
      })
      .eq('id', user.id);
    if (!error) {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Profile</h1>
        <p className="mt-1 text-sm text-ink-400">Manage your account information.</p>
      </div>

      {/* Profile summary */}
      <Card>
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20">
            <span className="text-xl font-semibold text-white">
              {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user.full_name || 'Unnamed'}</p>
            <p className="text-sm text-ink-400">{user.email}</p>
            {user.business_name && <p className="mt-0.5 text-xs text-ink-500">{user.business_name}</p>}
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader title="Edit Details" icon={User} />
        <div className="space-y-4 px-5 pb-5">
          <Field icon={User} label="Full Name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder-ink-500 focus:border-brand-500/30 focus:outline-none"
            />
          </Field>
          <Field icon={Building2} label="Business Name">
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your company"
              className="w-full rounded-xl border border-white/5 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder-ink-500 focus:border-brand-500/30 focus:outline-none"
            />
          </Field>
          <Field icon={Mail} label="Email">
            <input
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-ink-950/30 px-3 py-2 text-sm text-ink-400"
            />
          </Field>
          <Field icon={Phone} label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-white/5 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder-ink-500 focus:border-brand-500/30 focus:outline-none"
            />
          </Field>
          <Field icon={Globe} label="Website">
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full rounded-xl border border-white/5 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder-ink-500 focus:border-brand-500/30 focus:outline-none"
            />
          </Field>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving || !fullName.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
