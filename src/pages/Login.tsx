import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AuthCard, friendlyAuthError } from '@/components/auth/AuthLayout';

export function LoginPage() {
  usePageTitle('Log in');
  const { logIn, resetPassword } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      // The auth layout redirects to where the user was heading once signed in.
      await logIn(email.trim(), password);
    } catch (err) {
      setMessage({ kind: 'error', text: friendlyAuthError(err) });
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setMessage({
        kind: 'error',
        text: 'Enter your email above, then choose “Forgot password?”.',
      });
      return;
    }
    setMessage(null);
    try {
      await resetPassword(email.trim());
      setMessage({
        kind: 'info',
        text: `If an account exists for ${email.trim()}, a reset link is on its way.`,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Same answer whether or not the account exists (no account enumeration).
      if (code === 'auth/user-not-found') {
        setMessage({
          kind: 'info',
          text: `If an account exists for ${email.trim()}, a reset link is on its way.`,
        });
      } else {
        setMessage({ kind: 'error', text: friendlyAuthError(err) });
      }
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New to ClockWise?{' '}
          <Link
            to="/signup"
            state={location.state}
            className="font-semibold text-brand-text hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-text-base">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-text-base">
              Password
            </label>
            <button
              type="button"
              onClick={handlePasswordReset}
              className="min-h-9 text-sm font-medium text-brand-text hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </div>

        {message && (
          <p
            role={message.kind === 'error' ? 'alert' : 'status'}
            className={
              message.kind === 'error'
                ? 'rounded-md bg-error-light px-3 py-2 text-sm text-error-text'
                : 'rounded-md bg-success-light px-3 py-2 text-sm text-success-text'
            }
          >
            {message.text}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary h-12 w-full">
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthCard>
  );
}
