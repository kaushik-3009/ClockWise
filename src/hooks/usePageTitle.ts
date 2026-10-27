import { useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';

/** Set the page's title (shown in the browser tab when the timer isn't running). */
export function usePageTitle(title: string) {
  const setPageTitle = useUiStore((s) => s.setPageTitle);
  useEffect(() => {
    setPageTitle(title);
    // Outside the app shell (landing/login) nothing else manages the title.
    document.title = title ? `${title} — ClockWise` : 'ClockWise';
  }, [title, setPageTitle]);
}
