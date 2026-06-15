import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Archive, Plus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { TaskRow } from '@/components/projects/TaskRow';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaskForm } from '@/components/projects/TaskForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PROJECT_COLORS } from '@/lib/constants';
import { formatHHMMSS } from '@/lib/time';
import type { Project, Task } from '@/types';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, editProject, removeProject, archive } = useProjects();
  const { tasks, addTask, editTask, removeTask } = useTasks(id);
  const { sessions } = useSessions(id);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'danger' | 'default';
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

  const color = project ? PROJECT_COLORS[project.color] : undefined;

  const totalFocusSeconds = useMemo(() => {
    return sessions
      .filter((s) => s.type === 'focus' && s.completed)
      .reduce((sum, s) => sum + s.duration_seconds, 0);
  }, [sessions]);

  const taskTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.task_id && s.type === 'focus' && s.completed) {
        map.set(s.task_id, (map.get(s.task_id) ?? 0) + s.duration_seconds);
      }
    }
    return map;
  }, [sessions]);

  const taskPomodoros = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.task_id && s.type === 'focus' && s.completed) {
        map.set(s.task_id, (map.get(s.task_id) ?? 0) + 1);
      }
    }
    return map;
  }, [sessions]);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const sortedTasks = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort((a, b) => {
      const aPriority = a.priority ? priorityOrder[a.priority] : 3;
      const bPriority = b.priority ? priorityOrder[b.priority] : 3;
      return aPriority - bPriority;
    });
  }, [tasks]);
  const filteredTasks = activeFilter
    ? sortedTasks.filter((t) => t.id === activeFilter)
    : sortedTasks;

  if (!project) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-text-sub hover:text-text-base mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-text-muted">Project not found</p>
      </div>
    );
  }

  const handleEditProject = (data: {
    name: string;
    description?: string;
    color: Project['color'];
  }) => {
    editProject(project.id, data);
    setEditProjectOpen(false);
  };

  const handleDeleteProject = () => {
    setConfirmDialog({
      open: true,
      title: 'Delete Project',
      description: `Delete "${project.name}" and all its tasks and sessions? This cannot be undone.`,
      onConfirm: () => {
        removeProject(project.id);
        navigate('/projects');
      },
      variant: 'danger',
    });
  };

  const handleArchiveProject = () => {
    setConfirmDialog({
      open: true,
      title: 'Archive Project',
      description: `Archive "${project.name}"? It will be hidden from the main list but data is preserved.`,
      onConfirm: () => {
        archive(project.id);
        navigate('/projects');
      },
      variant: 'default',
    });
  };

  const handleDeleteTask = (task: Task) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Task',
      description: `Delete "${task.name}" and its sessions? This cannot be undone.`,
      onConfirm: () => removeTask(task.id),
      variant: 'danger',
    });
  };

  return (
    <div className="p-6 lg:p-12 w-full 2xl:max-w-[1600px] 2xl:mx-auto animate-[page-enter_200ms_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-text-sub hover:text-text-base transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditProjectOpen(true)}
            className="p-2 text-text-muted hover:text-text-base hover:bg-bg-secondary rounded-md transition-colors"
            aria-label="Edit project"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleArchiveProject}
            className="p-2 text-text-muted hover:text-brand hover:bg-brand-alpha rounded-md transition-colors"
            aria-label="Archive project"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteProject}
            className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-md transition-colors"
            aria-label="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project info */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h1 className="text-xl font-semibold text-text-base">{project.name}</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide bg-bg-tertiary text-text-sub border border-border-base">
            {project.status}
          </span>
        </div>
        {project.description && <p className="text-sm text-text-sub">{project.description}</p>}
      </div>

      {/* Total time */}
      <div className="flex justify-center mb-10">
        <span className="font-mono text-timer-hms font-medium tracking-wide text-text-base">
          {formatHHMMSS(totalFocusSeconds)}
        </span>
      </div>

      {/* Task filter chips */}
      {tasks.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 pb-1">
          <button
            onClick={() => setActiveFilter(null)}
            className={`shrink-0 h-8 px-3.5 rounded-pill text-[13px] font-medium border transition-colors duration-fast ${
              activeFilter === null
                ? 'border-brand text-text-base font-semibold'
                : 'border-border-base text-text-sub hover:border-text-sub'
            }`}
          >
            All ({tasks.length})
          </button>
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setActiveFilter((prev) => (prev === task.id ? null : task.id))}
              className={`shrink-0 h-8 px-3.5 rounded-pill text-[13px] font-medium border transition-colors duration-fast ${
                activeFilter === task.id
                  ? 'border-brand text-text-base font-semibold'
                  : 'border-border-base text-text-sub hover:border-text-sub'
              }`}
            >
              {task.name}
            </button>
          ))}
        </div>
      )}

      {/* Tasks list header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-base uppercase tracking-wide">Tasks</h2>
        <button
          onClick={() => setAddTaskOpen(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border-base text-xs font-medium text-text-sub hover:text-brand hover:border-brand transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      </div>

      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <p className="text-text-muted text-sm">No tasks in this project yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              project={project}
              totalFocusSeconds={taskTotals.get(task.id) ?? 0}
              completedPomodoros={taskPomodoros.get(task.id) ?? 0}
              onEdit={() => setEditingTask(task)}
              onDelete={() => handleDeleteTask(task)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProjectForm
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        onSubmit={handleEditProject}
        initialData={project}
      />

      <TaskForm
        open={addTaskOpen || editingTask !== null}
        onClose={() => {
          setAddTaskOpen(false);
          setEditingTask(null);
        }}
        onSubmit={(data) => {
          if (editingTask) {
            editTask(editingTask.id, data);
            setEditingTask(null);
          } else {
            addTask({ ...data, project_id: id });
            setAddTaskOpen(false);
          }
        }}
        projects={project ? [project] : []}
        initialData={editingTask ?? undefined}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Confirm"
        variant={confirmDialog.variant}
      />
    </div>
  );
}
