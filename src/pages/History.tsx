import { useState, useMemo, useDeferredValue } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  Trash2,
  Pencil,
  SlidersHorizontal,
  Search,
  X,
  StickyNote,
  Plus,
} from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDuration, formatDateKey, formatTime } from '@/lib/time';
import { groupSessionsByDay } from '@/lib/stats';
import { PROJECT_COLORS } from '@/lib/constants';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SessionEditModal } from '@/components/ui/SessionEditModal';
import { TaskRowSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import type { Session, PhaseType } from '@/types';

const TYPE_LABEL: Record<PhaseType, string> = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
};

const DAYS_PER_PAGE = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function dayLabel(key: string): string {
  const today = formatDateKey(new Date());
  const yd = new Date();
  yd.setDate(yd.getDate() - 1); // calendar arithmetic: correct across DST
  const yesterday = formatDateKey(yd);
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const full = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
  if (key === today) return `Today · ${full}`;
  if (key === yesterday) return `Yesterday · ${full}`;
  return full;
}

export function HistoryPage() {
  usePageTitle('History');
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const {
    sessions,
    loading,
    sessionsSince,
    loadOlderSessions,
    addSession,
    removeSession,
    editSession,
  } = useSessions();
  const { projects } = useProjects();
  const { allTasks } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  // Keeps typing responsive with thousands of sessions: the list catches up after.
  const deferredQuery = useDeferredValue(searchQuery);
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [daysFilter, setDaysFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [daysShown, setDaysShown] = useState(DAYS_PER_PAGE);

  const [editing, setEditing] = useState<Session | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Session | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const taskMap = useMemo(() => new Map(allTasks.map((t) => [t.id, t])), [allTasks]);

  const filtersActive =
    projectFilter !== 'all' ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    daysFilter !== 'all' ||
    searchQuery.trim() !== '';

  const filteredSessions = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const cutoff = daysFilter === 'all' ? 0 : Date.now() - Number(daysFilter) * DAY_MS;
    return sessions.filter((s) => {
      if (s.started_at < cutoff) return false;
      if (
        projectFilter === 'none'
          ? s.project_id
          : projectFilter !== 'all' && s.project_id !== projectFilter
      )
        return false;
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (statusFilter === 'completed' && !s.completed) return false;
      if (statusFilter === 'unfinished' && s.completed) return false;
      if (dateParam && formatDateKey(new Date(s.started_at)) !== dateParam) return false;
      if (q) {
        const project = s.project_id ? projectMap.get(s.project_id) : undefined;
        const task = s.task_id ? taskMap.get(s.task_id) : undefined;
        const haystack = `${project?.name ?? ''} ${task?.name ?? ''} ${s.note ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    sessions,
    daysFilter,
    projectFilter,
    typeFilter,
    statusFilter,
    deferredQuery,
    projectMap,
    taskMap,
    dateParam,
  ]);

  // Same definitions as Statistics: focus time counts every focus session.
  const summary = useMemo(() => {
    const focus = filteredSessions.filter((s) => s.type === 'focus');
    return {
      focusSessions: focus.length,
      completedFocus: focus.filter((s) => s.completed).length,
      focusSeconds: focus.reduce((sum, s) => sum + s.duration_seconds, 0),
      breakSeconds: filteredSessions
        .filter((s) => s.type !== 'focus')
        .reduce((sum, s) => sum + s.duration_seconds, 0),
    };
  }, [filteredSessions]);

  const sessionsByDay = useMemo(() => groupSessionsByDay(filteredSessions), [filteredSessions]);
  const sortedDays = useMemo(
    () => Array.from(sessionsByDay.keys()).sort((a, b) => b.localeCompare(a)),
    [sessionsByDay]
  );
  const visibleDays = sortedDays.slice(0, daysShown);

  const clearFilters = () => {
    setSearchQuery('');
    setProjectFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setDaysFilter('all');
  };

  const editingSession = editing === 'new' ? null : editing;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:p-12">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold text-text-base">History</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="btn-secondary flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Log time
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="history-filters"
            className="btn-secondary flex-1 sm:flex-none"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {filtersActive && (
              <span className="h-2 w-2 rounded-full bg-brand" aria-label="(active)" />
            )}
          </button>
        </div>
      </div>

      {dateParam && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md bg-bg-secondary px-4 py-2 text-sm text-text-sub">
          <span>Showing {dayLabel(dateParam)}</span>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="min-h-11 font-medium text-brand-text hover:underline"
          >
            Show all days
          </button>
        </div>
      )}

      {showFilters && (
        <div
          id="history-filters"
          className="mb-6 flex flex-col gap-3 rounded-lg border border-border-base bg-bg-card p-4"
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, tasks and notes…"
              aria-label="Search sessions"
              className="field pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Date range',
                value: daysFilter,
                set: setDaysFilter,
                options: [
                  ['all', 'All loaded'],
                  ['7', 'Last 7 days'],
                  ['30', 'Last 30 days'],
                  ['90', 'Last 90 days'],
                ],
              },
              {
                label: 'Project',
                value: projectFilter,
                set: setProjectFilter,
                options: [
                  ['all', 'All projects'],
                  ['none', 'No project'],
                  ...projects.map((p) => [p.id, p.name]),
                ],
              },
              {
                label: 'Type',
                value: typeFilter,
                set: setTypeFilter,
                options: [
                  ['all', 'All types'],
                  ['focus', 'Focus'],
                  ['short_break', 'Short break'],
                  ['long_break', 'Long break'],
                ],
              },
              {
                label: 'Status',
                value: statusFilter,
                set: setStatusFilter,
                options: [
                  ['all', 'Any'],
                  ['completed', 'Finished'],
                  ['unfinished', 'Skipped or reset'],
                ],
              },
            ].map((f) => (
              <label key={f.label} className="flex flex-col gap-1">
                <span className="text-xs text-text-sub">{f.label}</span>
                <select value={f.value} onChange={(e) => f.set(e.target.value)} className="field">
                  {f.options.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex min-h-11 items-center gap-1.5 self-start text-sm text-text-sub hover:text-text-base"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {filteredSessions.length > 0 && (
        <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Focus time', formatDuration(summary.focusSeconds)],
            ['Focus sessions', String(summary.focusSessions)],
            [
              'Finished',
              summary.focusSessions
                ? `${Math.round((summary.completedFocus / summary.focusSessions) * 100)}%`
                : '—',
            ],
            ['Break time', formatDuration(summary.breakSeconds)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-border-base bg-bg-card p-3">
              <dt className="mb-1 text-xs text-text-sub">{label}</dt>
              <dd className="text-lg font-semibold text-text-base">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <TaskRowSkeleton key={i} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <Clock className="mb-4 h-12 w-12 text-text-muted" aria-hidden="true" />
          <p className="mb-1 text-lg font-medium text-text-base">No sessions yet</p>
          <p className="mb-5 max-w-sm text-sm text-text-sub">
            Every focus session and break you run is logged here automatically. You can also log
            time you tracked elsewhere.
          </p>
          <Link to="/timer" className="btn-primary">
            Start a focus session
          </Link>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-1 text-lg font-medium text-text-base">No matching sessions</p>
          <p className="mb-4 text-sm text-text-sub">Try different filters.</p>
          {filtersActive && (
            <button type="button" className="btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {visibleDays.map((day) => {
            const daySessions = sessionsByDay.get(day) ?? [];
            const dayFocus = daySessions
              .filter((s) => s.type === 'focus')
              .reduce((sum, s) => sum + s.duration_seconds, 0);
            return (
              <section key={day} aria-labelledby={`day-${day}`}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 id={`day-${day}`} className="text-sm font-semibold text-text-base">
                    {dayLabel(day)}
                  </h2>
                  <span className="shrink-0 text-xs text-text-sub">
                    {formatDuration(dayFocus)} focus
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {daySessions.map((session) => {
                    const project = session.project_id
                      ? projectMap.get(session.project_id)
                      : undefined;
                    const task = session.task_id ? taskMap.get(session.task_id) : undefined;
                    const color = project ? PROJECT_COLORS[project.color] : 'var(--text-muted)';
                    const isExpanded = expandedNotes.has(session.id);
                    const end =
                      session.ended_at ?? session.started_at + session.duration_seconds * 1000;
                    const projectName = session.project_id
                      ? (project?.name ?? 'Deleted project')
                      : 'No project';
                    const title =
                      session.type === 'focus'
                        ? (task?.name ?? (session.task_id ? 'Deleted task' : projectName))
                        : TYPE_LABEL[session.type];

                    return (
                      <li
                        key={session.id}
                        className="rounded-md border border-border-base bg-bg-card"
                      >
                        <div className="flex items-center gap-2 py-1.5 pl-3 pr-1.5 sm:gap-3">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex min-w-0 flex-1 flex-col py-1">
                            <span className="truncate text-sm font-medium text-text-base">
                              {title}
                            </span>
                            <span className="truncate text-xs text-text-sub">
                              {formatTime(session.started_at)}–{formatTime(end)}
                              {session.type === 'focus' && ` · ${projectName}`}
                            </span>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-text-base">
                            {formatDuration(session.duration_seconds) === '0m'
                              ? '<1m'
                              : formatDuration(session.duration_seconds)}
                          </span>
                          {session.completed ? (
                            <CheckCircle2
                              className="h-4 w-4 shrink-0 text-success-text"
                              aria-label="Finished"
                            />
                          ) : (
                            <CircleDashed
                              className="h-4 w-4 shrink-0 text-text-muted"
                              aria-label="Skipped or reset early"
                            />
                          )}
                          <div className="flex shrink-0 items-center">
                            {session.note && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedNotes((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(session.id)) next.delete(session.id);
                                    else next.add(session.id);
                                    return next;
                                  })
                                }
                                aria-expanded={isExpanded}
                                className={cn(
                                  'flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-bg-secondary',
                                  isExpanded ? 'text-brand-text' : 'text-text-sub'
                                )}
                                aria-label={isExpanded ? 'Hide note' : 'Show note'}
                              >
                                <StickyNote className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditing(session)}
                              className="flex h-11 w-11 items-center justify-center rounded-full text-text-sub transition-colors hover:bg-bg-secondary hover:text-text-base"
                              aria-label="Edit session"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(session)}
                              className="flex h-11 w-11 items-center justify-center rounded-full text-text-sub transition-colors hover:bg-error-light hover:text-error-text"
                              aria-label="Delete session"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {isExpanded && session.note && (
                          <p className="whitespace-pre-wrap border-t border-border-base px-4 py-2.5 text-sm text-text-sub">
                            {session.note}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          <div className="flex flex-col items-center gap-2 pb-4">
            {sortedDays.length > daysShown ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDaysShown((n) => n + DAYS_PER_PAGE)}
              >
                Show more days
              </button>
            ) : (
              <>
                <p className="text-xs text-text-muted">
                  Showing sessions since{' '}
                  {new Date(sessionsSince).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <button type="button" className="btn-secondary" onClick={loadOlderSessions}>
                  Load older history
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <SessionEditModal
        open={editing !== null}
        session={editingSession}
        projects={projects}
        tasks={allTasks}
        onClose={() => setEditing(null)}
        onSave={(draft) => {
          if (editingSession) {
            editSession(editingSession.id, draft);
          } else {
            addSession({ ...draft, phase_number: 1 });
            toast.success('Session logged.');
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeSession(deleting.id)}
        title="Delete this session?"
        description="It will be removed from your history, stats and streaks. This can’t be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
