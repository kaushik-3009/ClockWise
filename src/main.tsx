import '@fontsource/barlow-condensed/700-italic.css';
import '@fontsource/barlow-condensed/900-italic.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/dm-mono/500.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { seedDatabase } from '@/db/seed';
import './index.css';

// Seed DB before rendering so all pages have data on first paint
seedDatabase()
  .catch((err) => console.error('[main] Seed failed:', err))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  });
