import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/lib/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { seedNewUser } from '@/db/seed';
import { AuthCard, friendlyAuthError } from '@/components/auth/AuthLayout';

const MIN_PASSWORD = 8;

export function SignupPage() {
  usePageTitle('Create account');
  const { signUp } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [seedDemo, setSeedDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    setSubmitting(true);
    try {
      const credential = await signUp(email.trim(), password);
      // Best effort: none of this should block getting into the app. Missing
      // defaults are also re-created by the data layer on first load.
      void sendEmailVerification(credential.user).catch(() => {});
      await seedNewUser(credential.user.uid, seedDemo).catch((err) =>
        console.error('[signup] Seeding failed:', err)
      );
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Free, no ads. Your sessions sync across your devices."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            state={location.state}
            className="font-semibold text-brand-text hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              className="min-h-9 text-sm font-medium text-brand-text hover:underline"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            aria-describedby="password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
          <p id="password-hint" className="text-xs text-text-sub">
            At least {MIN_PASSWORD} characters.
          </p>
        </div>

        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-text-base">
          <input
            type="checkbox"
            checked={seedDemo}
            onChange={(e) => setSeedDemo(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[var(--color-brand-solid)]"
          />
          <span>
            Add sample projects and 90 days of example sessions to explore the app
            <span className="block text-xs text-text-sub">
              You can remove them later in Settings.
            </span>
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-md bg-error-light px-3 py-2 text-sm text-error-text">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary h-12 w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}
