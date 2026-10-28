import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Archive, ArchiveRestore, Plus, Play } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { usePageTitle } from '@/hooks/usePageTitle';
import { timerSetContext } from '@/lib/timerController';
import { TaskRow } from '@/components/projects/TaskRow';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaskForm } from '@/components/projects/TaskForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { PROJECT_COLORS } from '@/lib/constants';
import { completedFocusCountBy, focusSecondsBy } from '@/lib/stats';
import { formatDuration } from '@/lib/time';
import type { Task } from '@/types';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

const headerBtn =
  'flex h-11 w-11 items-center justify-center rounded-md text-text-sub transition-colors hover:bg-bg-secondary hover:text-text-base';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, activeProjects, loading, editProject, removeProject, archive, unarchive } =
    useProjects();
  const { tasks, addTask, editTask, removeTask, setCompleted } = useTasks(id);
  const { sessions } = useSessions(id);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    label: string;
    onConfirm: () => void;
  } | null>(null);

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  usePageTitle(project?.name ?? 'Project');

  const totalFocusSeconds = useMemo(
    () =>
      sessions.filter((s) => s.type === 'focus').reduce((sum, s) => sum + s.duration_seconds, 0),
    [sessions]
  );
  const completedCount = useMemo(
    () => sessions.filter((s) => s.type === 'focus' && s.completed).length,
    [sessions]
  );
  const taskTotals = useMemo(() => focusSecondsBy(sessions, (s) => s.task_id), [sessions]);
  const taskPomodoros = useMemo(
    () => completedFocusCountBy(sessions, (s) => s.task_id),
    [sessions]
  );

  // Open tasks first (by priority), completed tasks last.
  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        const pa = a.priority ? PRIORITY_ORDER[a.priority] : 3;
        const pb = b.priority ? PRIORITY_ORDER[b.priority] : 3;
        return pa - pb || b.created_at - a.created_at;
      }),
    [tasks]
  );

  if (loading) return <PageSpinner />;

  if (!project) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-text-base">Project not found</h1>
        <p className="mt-1 text-sm text-text-sub">It may have been deleted.</p>
        <Link to="/projects" className="btn-secondary mt-6">
          Back to projects
        </Link>
      </div>
    );
  }

  const color = PROJECT_COLORS[project.color];
  const archived = project.status === 'archived';

  const focusOn = (taskId?: string) => {
    timerSetContext(project.id, taskId);
    navigate('/timer');
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 lg:p-12">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/projects" className={headerBtn} aria-label="Back to projects">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setEditProjectOpen(true)}
            className={headerBtn}
            aria-label="Edit project"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {archived ? (
            <button
              type="button"
              onClick={() => {
                unarchive(project.id);
                toast.success(`"${project.name}" restored.`);
              }}
              className={headerBtn}
              aria-label="Restore project"
            >
              <ArchiveRestore className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                archive(project.id);
                toast.info(`"${project.name}" archived.`, {
                  label: 'Undo',
                  onClick: () => unarchive(project.id),
                });
                navigate('/projects');
              }}
              className={headerBtn}
              aria-label="Archive project"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setConfirm({
                title: `Delete "${project.name}"?`,
                description:
                  'The project and its tasks will be deleted. Focus time you already logged stays in your history and stats.',
                label: 'Delete project',
                onConfirm: () => {
                  removeProject(project.id);
                  navigate('/projects');
                },
              })
            }
            className={`${headerBtn} hover:bg-error-light hover:text-error-text`}
            aria-label="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-lg border border-border-base bg-bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <h1 className="min-w-0 break-words text-xl font-semibold text-text-base">
              {project.name}
            </h1>
            {archived && (
              <span className="rounded bg-bg-tertiary px-2 py-0.5 text-xs font-semibold text-text-sub">
                Archived
              </span>
            )}
          </div>
          {project.description && <p className="text-sm text-text-sub">{project.description}</p>}
          <p className="mt-3 text-sm text-text-sub">
            <span className="font-display text-3xl font-bold italic text-text-base">
              {formatDuration(totalFocusSeconds)}
            </span>{' '}
            focused · {completedCount} completed {completedCount === 1 ? 'pomodoro' : 'pomodoros'}
          </p>
        </div>
        {!archived && (
          <button type="button" onClick={() => focusOn()} className="btn-primary shrink-0">
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            Focus on this project
          </button>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-base">
          Tasks{' '}
          <span className="text-text-muted">{tasks.filter((t) => !t.is_completed).length}</span>
        </h2>
        <button type="button" onClick={() => setAddTaskOpen(true)} className="btn-secondary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add task
        </button>
      </div>

      {sortedTasks.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-base p-6 text-center text-sm text-text-sub">
          No tasks yet. Break the project into tasks to see where the time goes.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              totalFocusSeconds={taskTotals.get(task.id) ?? 0}
              completedPomodoros={taskPomodoros.get(task.id) ?? 0}
              onToggleComplete={(done) => setCompleted(task.id, done)}
              onEdit={() => setEditingTask(task)}
              onDelete={() =>
                setConfirm({
                  title: `Delete "${task.name}"?`,
                  description:
                    'The task will be deleted. Focus time you logged on it stays in your history.',
                  label: 'Delete task',
                  onConfirm: () => removeTask(task.id),
                })
              }
              onPlay={archived ? undefined : () => focusOn(task.id)}
            />
          ))}
        </div>
      )}

      <ProjectForm
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        onSubmit={(data) => editProject(project.id, data)}
        initialData={project}
      />

      <TaskForm
        open={addTaskOpen || editingTask !== null}
        onClose={() => {
          setAddTaskOpen(false);
          setEditingTask(null);
        }}
        onSubmit={(data) => {
          if (editingTask) editTask(editingTask.id, data);
          else addTask(data);
        }}
        projects={archived ? [project, ...activeProjects] : activeProjects}
        initialData={editingTask ?? undefined}
        defaultProjectId={project.id}
      />

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.label}
        variant="danger"
      />
    </div>
  );
}
