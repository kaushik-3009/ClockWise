import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';
import { seedNewUser } from '@/db/seed';
import { Clock } from 'lucide-react';

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
};

function getFriendlyError(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: string }).code;
    if (code && FIREBASE_ERROR_MAP[code]) return FIREBASE_ERROR_MAP[code];
    return err.message;
  }
  return 'An unexpected error occurred.';
}

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seedDemo, setSeedDemo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setSubmitting(true);
      try {
        const credential = await signUp(email, password);
        try {
          await seedNewUser(credential.user.uid, seedDemo);
        } catch (seedErr) {
          console.error('[signup] Seed failed:', seedErr);
          // If full demo seed fails, try seeding just defaults (templates + settings)
          try {
            const { seedDefaultsOnly } = await import('@/db/seed');
            await seedDefaultsOnly(credential.user.uid);
          } catch (fallbackErr) {
            console.error('[signup] Fallback seed also failed:', fallbackErr);
          }
        }
        navigate('/timer');
      } catch (err) {
        setError(getFriendlyError(err));
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, confirmPassword, seedDemo, signUp, navigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Clock className="w-8 h-8 text-brand" />
          <span className="text-2xl font-semibold text-text-base">ClockWise</span>
        </div>

        <div className="bg-bg-card border border-border-base rounded-2xl p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-text-base mb-2">Create an account</h1>
          <p className="text-sm text-text-sub mb-6">
            Start tracking your focus time across devices.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-base mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-base rounded-lg text-sm text-text-base placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-base mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-base rounded-lg text-sm text-text-base placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-base mb-1"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-base rounded-lg text-sm text-text-base placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="••••••••"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-text-base cursor-pointer">
              <input
                type="checkbox"
                checked={seedDemo}
                onChange={(e) => setSeedDemo(e.target.checked)}
                className="w-4 h-4 rounded border-border-base text-brand focus:ring-brand"
              />
              Seed demo data so I can explore the app
            </label>

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-sub">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
