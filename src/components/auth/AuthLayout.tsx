import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';

/** Shared frame for the login and signup pages. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="safe-top safe-bottom flex min-h-[100dvh] items-center justify-center bg-bg-primary px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center" aria-label="ClockWise home">
          <Logo size="lg" />
        </Link>
        <div className="rounded-2xl border border-border-base bg-bg-card p-6 shadow-card sm:p-8">
          <h1 className="mb-1 text-xl font-semibold text-text-base">{title}</h1>
          <p className="mb-6 text-sm text-text-sub">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-text-sub">{footer}</p>
      </div>
    </main>
  );
}

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'That email and password don’t match an account.',
  'auth/user-not-found': 'That email and password don’t match an account.',
  'auth/wrong-password': 'That email and password don’t match an account.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-email': 'Enter your email address.',
  'auth/weak-password': 'Use at least 8 characters for your password.',
  'auth/missing-password': 'Enter your password.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'Can’t reach the server. Check your connection.',
};

// eslint-disable-next-line react-refresh/only-export-components
export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  return (code && AUTH_ERRORS[code]) || 'Something went wrong. Please try again.';
}
