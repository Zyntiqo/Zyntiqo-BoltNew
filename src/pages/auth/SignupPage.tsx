import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Mail, Lock, User, ArrowRight, Phone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If user is already logged in, redirect to portal
  useEffect(() => {
    if (user && !loading) {
      navigate('/portal', { replace: true });
    }
  }, [user, loading, navigate]);

  // Safety: never stay loading more than 15 seconds
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      setLoading(false);
      if (!success) {
        setError('Registration is taking too long. Please check your connection and try again.');
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [loading, success]);

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    const { error: signUpError } = await signUp(email, password, fullName);

    if (signUpError) {
      let msg = signUpError;
      if (signUpError.toLowerCase().includes('already registered') || signUpError.toLowerCase().includes('already been registered')) {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (signUpError.toLowerCase().includes('password')) {
        msg = 'Password does not meet requirements. Please use at least 6 characters.';
      } else if (signUpError.toLowerCase().includes('rate limit')) {
        msg = 'Too many attempts. Please wait a moment and try again.';
      }
      setError(msg);
      setLoading(false);
      return;
    }

    // Signup succeeded. If phone was provided, update the profile.
    if (phone.trim()) {
      try {
        await supabase.from('profiles').update({ phone: phone.trim() }).eq('email', email);
      } catch {
        // Non-critical — profile exists, phone is optional
      }
    }

    // Check if we got a session back (email confirmation might be required)
    const { data: sessionData } = await supabase.auth.getSession();

    if (sessionData.session?.user) {
      // Session is active — onAuthStateChange will fire and set user.
      // The useEffect above will redirect to /portal.
      setSuccess(true);
      // Give onAuthStateChange a moment to fire
      setTimeout(() => {
        navigate('/portal', { replace: true });
      }, 500);
    } else {
      // No session — email confirmation may be required
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 font-display text-lg font-semibold text-ink-950">Z</span>
              <span className="font-display text-xl font-semibold text-white">Zyntiqo <span className="text-accent-400">Pro</span></span>
            </Link>
          </div>
          <div className="rounded-2xl border border-white/5 bg-ink-900/40 p-6 sm:p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-white">Account created</h1>
            <p className="mt-2 text-sm text-ink-400">
              Your account has been created. If email verification is enabled, please check your inbox for a verification link. Otherwise, you can sign in now.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-6 py-2.5 text-sm font-semibold text-ink-950"
            >
              Go to Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-ink-400">Get access to your customer portal.</p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" autoComplete="name" className="w-full rounded-xl border border-white/10 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="w-full rounded-xl border border-white/10 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Phone <span className="text-ink-500">(optional)</span></label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" className="w-full rounded-xl border border-white/10 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" className="w-full rounded-xl border border-white/10 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Confirm Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" className="w-full rounded-xl border border-white/10 bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 py-3 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : <>Create Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-500">
            Already have an account? <Link to="/login" className="text-brand-300 hover:text-brand-200">Sign in</Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-ink-500">
          <Link to="/" className="hover:text-ink-300">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
