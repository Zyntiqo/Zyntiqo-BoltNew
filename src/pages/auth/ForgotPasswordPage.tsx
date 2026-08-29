import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 font-display text-lg font-semibold text-ink-950">Z</span>
            <span className="font-display text-xl font-semibold text-white">Zyntiqo <span className="text-accent-400">Pro</span></span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/5 bg-ink-900/40 p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-white">Check your email</h1>
              <p className="mt-2 text-sm text-ink-400">We've sent a password reset link to {email}. Follow the link in the email to reset your password.</p>
              <Link to="/login" className="mt-6 inline-block text-sm text-brand-300 hover:text-brand-200">← Back to login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white">Forgot password</h1>
              <p className="mt-1 text-sm text-ink-400">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-200">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 py-3 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <>Send Reset Link <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-ink-500">
                <Link to="/login" className="text-brand-300 hover:text-brand-200">← Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
