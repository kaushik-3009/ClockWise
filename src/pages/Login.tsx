import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { Clock } from 'lucide-react';

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/invalid-email': 'Please enter a valid email address.',
};

function getFriendlyError(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: string }).code;
    if (code && FIREBASE_ERROR_MAP[code]) return FIREBASE_ERROR_MAP[code];
    return err.message;
  }
  return 'An unexpected error occurred.';
}

export function LoginPage() {
  const { logIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setResetMessage(null);
      setSubmitting(true);
      try {
        await logIn(email, password);
        navigate('/timer');
      } catch (err) {
        setError(getFriendlyError(err));
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, logIn, navigate]
  );

  const handlePasswordReset = useCallback(async () => {
    if (!email) {
      setError('Enter your email above first, then click "Forgot password?"');
      return;
    }
    setError(null);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setResetMessage('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(getFriendlyError(err));
    }
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Clock className="w-8 h-8 text-brand" />
          <span className="text-2xl font-semibold text-text-base">ClockWise</span>
        </div>

        <div className="bg-bg-card border border-border-base rounded-2xl p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-text-base mb-2">Welcome back</h1>
          <p className="text-sm text-text-sub mb-6">Log in to continue your focus sessions.</p>

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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-text-base">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-xs text-brand hover:underline"
                >
                  Forgot password?
                </button>
              </div>
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

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>
            )}

            {resetMessage && (
              <div className="text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg">
                {resetMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-sub">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-brand hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
