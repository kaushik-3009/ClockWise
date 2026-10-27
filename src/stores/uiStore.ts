import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

interface UiState {
  sidebarCollapsed: boolean;
  theme: ThemePreference;
  /** Title of the current page, used for document.title when the timer is idle. */
  pageTitle: string;
}

interface UiActions {
  toggleSidebar: () => void;
  setTheme: (theme: ThemePreference) => void;
  setPageTitle: (title: string) => void;
}

export const THEME_STORAGE_KEY = 'clockwise-ui';

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'system',
      pageTitle: '',

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setPageTitle: (pageTitle) => set({ pageTitle }),
    }),
    {
      name: THEME_STORAGE_KEY,
      version: 1,
      // v0 always stored 'light' as the default; let those users follow the system.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<UiState>;
        if (version === 0 && state.theme === 'light') state.theme = 'system';
        return state as UiState & UiActions;
      },
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, theme: state.theme }),
    }
  )
);

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  return pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref;
}

/** Apply the theme to <html> and keep the browser chrome colour in sync. */
export function applyTheme(pref: ThemePreference): void {
  const theme = resolveTheme(pref);
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  const bg = theme === 'dark' ? '#0a0a0a' : '#ffffff';
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', bg));
}
