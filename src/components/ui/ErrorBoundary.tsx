import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** When this value changes (e.g. the route), a caught error is cleared. */
  resetKey?: string;
}

interface State {
  hasError: boolean;
}

const RELOAD_FLAG = 'clockwise-chunk-reload';

/**
 * After a deploy, an already-open app may ask for code-split chunks that no
 * longer exist. That isn't a real bug — reloading picks up the new build.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    message
  );
}

/** Reload once for a stale chunk; returns false if we already tried recently. */
// eslint-disable-next-line react-refresh/only-export-components
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  } catch {
    // storage blocked — still try once
  }
  window.location.reload();
  return true;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (isChunkLoadError(error) && reloadForNewVersion()) return;
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[100dvh] flex-col items-center justify-center p-8 text-center">
            <h1 className="mb-2 text-xl font-semibold text-text-base">Something went wrong</h1>
            <p className="mb-4 text-sm text-text-sub">
              An unexpected error occurred. Reloading usually fixes it — your data is safe.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-11 rounded-md bg-brand-solid px-5 text-sm font-medium text-white hover:opacity-90"
            >
              Reload
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
