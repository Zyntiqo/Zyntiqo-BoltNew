import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth, isStaff } from '@/lib/auth';

export default function LoginPage() {
  const { signIn, user, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from;

  // If user is already logged in (e.g. page refresh), redirect immediately
  useEffect(() => {
    if (user && !loading) {
      const target = from ?? (isStaff(user.role) ? '/app' : '/portal');
      navigate(target, { replace: true });
    }
  }, [user, loading, from, navigate]);

  // Show auth context errors (e.g. profile load failure)
  useEffect(() => {
    if (authError) {
      setError(authError);
      setLoading(false);
    }
  }, [authError]);

  // When user becomes available after sign-in, redirect
  useEffect(() => {
    if (user && loading) {
      const target = from ?? (isStaff(user.role) ? '/app' : '/portal');
      navigate(target, { replace: true });
    }
  }, [user, loading, from, navigate]);

  // Safety: never stay loading more than 10 seconds
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      setLoading(false);
      if (!user) {
        setError('Sign-in is taking too long. Please check your connection and try again.');
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [loading, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      // Map common Supabase auth errors to user-friendly messages
      let msg = signInError;
      if (signInError.toLowerCase().includes('invalid login credentials')) {
        msg = 'Invalid email or password.';
      } else if (signInError.toLowerCase().includes('email not confirmed')) {
        msg = 'Please verify your email before signing in.';
      } else if (signInError.toLowerCase().includes('too many requests')) {
        msg = 'Too many attempts. Please wait a moment and try again.';
      }
      setError(msg);
      setLoading(false);
      return;
    }

    // signIn succeeded — onAuthStateChange will fire and set user.
    // The useEffect above will redirect when user becomes available.
    // If profile fails to load, authError will be set and we'll show it.
    // The 10-second safety timeout ensures we never stay stuck.
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
          <h1 className="text-xl font-semibold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-400">Sign in to your account.</p>

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
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <Link to="/forgot-password" className="text-brand-300 hover:text-brand-200">Forgot password?</Link>
              <Link to="/signup" className="text-ink-400 hover:text-white">Need an account?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 py-3 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-ink-500">
          <Link to="/" className="hover:text-ink-300">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
