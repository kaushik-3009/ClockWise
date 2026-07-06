import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  StickyNote,
} from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { formatDurationShort, formatDuration, formatDateKey } from '@/lib/time';
import { groupSessionsByDay } from '@/lib/stats';
import { PROJECT_COLORS } from '@/lib/constants';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SessionEditModal } from '@/components/ui/SessionEditModal';
import type { Session, PhaseType } from '@/types';

export function HistoryPage() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date');

  const { sessions, removeSession, editSession } = useSessions();
  const { projects } = useProjects();
  const { allTasks } = useTasks();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [daysFilter, setDaysFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Edit/delete
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    session: Session | null;
  }>({ open: false, session: null });
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const projectMap = useMemo(() => {
    const map = new Map<string, (typeof projects)[0]>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  const taskMap = useMemo(() => {
    const map = new Map<string, (typeof allTasks)[0]>();
    for (const t of allTasks) map.set(t.id, t);
    return map;
  }, [allTasks]);

  // Apply filters
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Date range
    if (daysFilter !== 'all') {
      const days = parseInt(daysFilter);
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter((s) => s.started_at >= cutoff);
    }

    // Project filter
    if (projectFilter !== 'all') {
      result = result.filter((s) => s.project_id === projectFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((s) => s.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        result = result.filter((s) => s.completed);
      } else {
        result = result.filter((s) => !s.completed);
      }
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((s) => {
        const project = s.project_id ? projectMap.get(s.project_id) : undefined;
        const task = s.task_id ? taskMap.get(s.task_id) : undefined;
        return (
          project?.name.toLowerCase().includes(q) || task?.name.toLowerCase().includes(q) || false
        );
      });
    }

    // If URL has ?date=, show only that date
    if (initialDate) {
      result = result.filter((s) => {
        const key = formatDateKey(new Date(s.started_at));
        return key === initialDate;
      });
    }

    return result;
  }, [
    sessions,
    daysFilter,
    projectFilter,
    typeFilter,
    statusFilter,
    searchQuery,
    projectMap,
    taskMap,
    initialDate,
  ]);

  // Summary stats for filtered set
  const summary = useMemo(() => {
    const focus = filteredSessions
      .filter((s) => s.type === 'focus' && s.completed)
      .reduce((sum, s) => sum + s.duration_seconds, 0);
    const total = filteredSessions.reduce((sum, s) => sum + s.duration_seconds, 0);
    const started = filteredSessions.length;
    const completed = filteredSessions.filter((s) => s.completed).length;
    return { focusSeconds: focus, totalSeconds: total, started, completed };
  }, [filteredSessions]);

  const sessionsByDay = useMemo(() => groupSessionsByDay(filteredSessions), [filteredSessions]);
  const sortedDays = useMemo(
    () => Array.from(sessionsByDay.keys()).sort((a, b) => b.localeCompare(a)),
    [sessionsByDay]
  );

  const formatDateLabel = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const typeLabel = (type: PhaseType) => {
    switch (type) {
      case 'focus':
        return 'Focus';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
    }
  };

  return (
    <div className="p-6 lg:p-12 w-full 2xl:max-w-[1600px] 2xl:mx-auto animate-[page-enter_200ms_ease]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text-base">
          {initialDate ? `Sessions on ${initialDate}` : 'History'}
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border-base text-sm text-text-sub hover:text-text-base hover:bg-bg-secondary transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(projectFilter !== 'all' ||
            typeFilter !== 'all' ||
            statusFilter !== 'all' ||
            daysFilter !== 'all' ||
            searchQuery) && <span className="w-2 h-2 rounded-full bg-brand" />}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-bg-card border border-border-base rounded-lg p-4 mb-6 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project or task..."
              className="w-full h-10 pl-9 pr-3 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-text-sub mb-1">Date range</label>
              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-border-base bg-bg-secondary text-sm text-text-base outline-none focus:border-brand"
              >
                <option value="all">All time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-sub mb-1">Project</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-border-base bg-bg-secondary text-sm text-text-base outline-none focus:border-brand"
              >
                <option value="all">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-sub mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-border-base bg-bg-secondary text-sm text-text-base outline-none focus:border-brand"
              >
                <option value="all">All types</option>
                <option value="focus">Focus</option>
                <option value="short_break">Short Break</option>
                <option value="long_break">Long Break</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-sub mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-border-base bg-bg-secondary text-sm text-text-base outline-none focus:border-brand"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
          </div>

          {/* Clear filters */}
          {(projectFilter !== 'all' ||
            typeFilter !== 'all' ||
            statusFilter !== 'all' ||
            daysFilter !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setProjectFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
                setDaysFilter('all');
              }}
              className="flex items-center gap-1.5 text-xs text-text-sub hover:text-error self-start"
            >
              <X className="w-3.5 h-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Summary bar */}
      {filteredSessions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-bg-card border border-border-base rounded-md p-3">
            <p className="text-xs text-text-sub mb-1">Sessions</p>
            <p className="text-lg font-semibold text-text-base">{summary.started}</p>
          </div>
          <div className="bg-bg-card border border-border-base rounded-md p-3">
            <p className="text-xs text-text-sub mb-1">Completion</p>
            <p className="text-lg font-semibold text-text-base">
              {summary.started > 0 ? Math.round((summary.completed / summary.started) * 100) : 0}%
            </p>
          </div>
          <div className="bg-bg-card border border-border-base rounded-md p-3">
            <p className="text-xs text-text-sub mb-1">Focus time</p>
            <p className="text-lg font-semibold text-text-base">
              {formatDuration(summary.focusSeconds)}
            </p>
          </div>
          <div className="bg-bg-card border border-border-base rounded-md p-3">
            <p className="text-xs text-text-sub mb-1">Total time</p>
            <p className="text-lg font-semibold text-text-base">
              {formatDuration(summary.totalSeconds)}
            </p>
          </div>
        </div>
      )}

      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Clock className="w-12 h-12 mb-4 opacity-80" />
          <p className="text-lg font-medium mb-2">
            {sessions.length === 0 ? 'No sessions yet' : 'No matching sessions'}
          </p>
          <p className="text-sm">
            {sessions.length === 0
              ? 'Complete a focus session to see your history'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sortedDays.map((day) => {
            const daySessions = sessionsByDay.get(day) ?? [];
            return (
              <div key={day}>
                <h2 className="text-sm font-semibold text-text-sub uppercase tracking-wide mb-3">
                  {formatDateLabel(day)}
                </h2>
                <div className="flex flex-col gap-2">
                  {daySessions.map((session) => {
                    const project = session.project_id
                      ? projectMap.get(session.project_id)
                      : undefined;
                    const task = session.task_id ? taskMap.get(session.task_id) : undefined;
                    const color = project ? PROJECT_COLORS[project.color] : 'var(--text-muted)';

                    const isExpanded = expandedNotes.has(session.id);

                    return (
                      <div key={session.id}>
                        <div className="flex items-center gap-3 p-3 bg-bg-card border border-border-base rounded-md group">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-text-base truncate">
                                {task?.name ?? project?.name ?? 'Focus Session'}
                              </span>
                              <span className="text-xs text-text-sub">
                                {project?.name ?? 'No project'} · {typeLabel(session.type)}
                              </span>
                            </div>
                          </div>

                          <span className="font-mono text-sm text-text-base shrink-0">
                            {formatDurationShort(session.duration_seconds)}
                          </span>

                          {session.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-error shrink-0" />
                          )}

                          {/* Note toggle */}
                          {session.note && (
                            <button
                              onClick={() => {
                                setExpandedNotes((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(session.id)) next.delete(session.id);
                                  else next.add(session.id);
                                  return next;
                                });
                              }}
                              className="p-1.5 rounded text-text-sub hover:text-brand hover:bg-brand-alpha transition-colors shrink-0"
                              aria-label={isExpanded ? 'Hide note' : 'Show note'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingSession(session)}
                              className="p-1.5 rounded text-text-sub hover:text-brand hover:bg-brand-alpha transition-colors"
                              aria-label="Edit session"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDialog({ open: true, session })}
                              className="p-1.5 rounded text-text-sub hover:text-error hover:bg-error/10 transition-colors"
                              aria-label="Delete session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded note */}
                        {isExpanded && session.note && (
                          <div className="mx-3 -mt-1 mb-1 px-3 py-2.5 bg-bg-secondary border border-t-0 border-border-base rounded-b-md">
                            <div className="flex items-start gap-2">
                              <StickyNote className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                              <p className="text-sm text-text-sub whitespace-pre-wrap">
                                {session.note}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SessionEditModal
        open={editingSession !== null}
        session={editingSession}
        onClose={() => setEditingSession(null)}
        onSave={(changes) => {
          if (editingSession) {
            editSession(editingSession.id, changes);
            setEditingSession(null);
          }
        }}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, session: null })}
        onConfirm={() => {
          if (confirmDialog.session) {
            removeSession(confirmDialog.session.id);
          }
        }}
        title="Delete Session"
        description={`Are you sure you want to delete this ${confirmDialog.session?.type ?? ''} session? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
