export type ProjectColor =
  | 'blue'
  | 'teal'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'slate';

export type PhaseType = 'focus' | 'short_break' | 'long_break';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'phase_complete' | 'session_complete';

export type TimerStyle = 'digital' | 'clock_numeric' | 'analog';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: ProjectColor;
  status: 'active' | 'archived';
  created_at: number;
}

export interface Task {
  id: string;
  project_id?: string;
  name: string;
  is_completed: boolean;
  created_at: number;
  priority?: 'low' | 'medium' | 'high';
  note?: string;
  estimated_pomodoros?: number;
}

export interface Session {
  id: string;
  project_id?: string;
  task_id?: string;
  type: PhaseType;
  started_at: number;
  ended_at?: number;
  duration_seconds: number;
  phase_number: number;
  completed: boolean;
  note?: string;
}

export interface TimerSettings {
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  phases_per_session: number;
  long_break_after_n: number;
  auto_start: boolean;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  timer_style: TimerStyle;
  accent_color: string;
  ambient_sound: 'off' | 'rain' | 'white' | 'brown' | 'cafe';
  ambient_volume: number;
  weekly_goal_hours: number;
  warn_before_seconds: number;
}

export interface DailyStreak {
  date: string;
  focus_seconds: number;
  sessions_started: number;
  sessions_completed: number;
  goal_met: boolean;
}

export interface TimerTemplate {
  id: string;
  name: string;
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  phases_per_session: number;
  long_break_after_n: number;
  created_at: number;
}

export interface TimerState {
  status: TimerStatus;
  phase_type: PhaseType;
  phase_number: number;
  total_phases: number;
  remaining_seconds: number;
  elapsed_seconds: number;
  active_project_id?: string;
  active_task_id?: string;
  active_session_id?: string;
  settings: TimerSettings;
}

export interface ExportData {
  version: 1;
  exported_at: string;
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  streaks: DailyStreak[];
  settings: TimerSettings | null;
}

export interface BackupRecord {
  id: 'auto';
  data: ExportData;
  created_at: number;
}
