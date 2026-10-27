import { createContext } from 'react';
import type { Project, Session, Task, TimerSettings, TimerTemplate } from '@/types';

export interface DataContextValue {
  projects: Project[];
  tasks: Task[];
  templates: TimerTemplate[];
  /** Sessions started on or after `sessionsSince` (newest first). */
  sessions: Session[];
  settings: TimerSettings;
  loading: {
    projects: boolean;
    tasks: boolean;
    templates: boolean;
    sessions: boolean;
    settings: boolean;
  };
  /** Set when a listener fails (permissions, missing index, dead IndexedDB). */
  error: string | null;
  sessionsSince: number;
  /** Widen the session window by another year (History "load older"). */
  loadOlderSessions: () => void;
}

export const DataContext = createContext<DataContextValue | null>(null);
