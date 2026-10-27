import '@fontsource/barlow-condensed/700-italic.css';
import '@fontsource/barlow-condensed/900-italic.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/dm-mono/500.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import {
  ErrorBoundary,
  isChunkLoadError,
  reloadForNewVersion,
} from '@/components/ui/ErrorBoundary';
import { AuthProvider } from '@/lib/auth';
import { applyTheme, useUiStore } from '@/stores/uiStore';
import { toast } from '@/components/ui/Toast';
import { isFatalFirestoreError } from '@/lib/firebase';
import './index.css';

// Theme: apply now, on preference change, and when the OS switches light/dark.
applyTheme(useUiStore.getState().theme);
useUiStore.subscribe((s, prev) => {
  if (s.theme !== prev.theme) applyTheme(s.theme);
});
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  applyTheme(useUiStore.getState().theme);
});

// Service worker: offer updates instead of swapping code under a running timer.
// iOS rarely checks for SW updates on its own, so poll hourly and on resume.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast.info('A new version of ClockWise is ready.', {
        label: 'Update',
        onClick: () => void updateSW(true),
      });
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => void registration.update().catch(() => {});
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
}

// Last-resort handlers for errors outside React's render cycle.
window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    reloadForNewVersion();
  } else if (isFatalFirestoreError(event.reason)) {
    toast.error('Local storage stopped responding. Reload to reconnect.', {
      label: 'Reload',
      onClick: () => window.location.reload(),
    });
  }
});
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadForNewVersion();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
