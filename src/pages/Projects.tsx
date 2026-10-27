import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, ClipboardList, Archive } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTimerStore } from '@/stores/timerStore';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { TaskRow } from '@/components/projects/TaskRow';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaskForm } from '@/components/projects/TaskForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProjectCardSkeleton, TaskRowSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { completedFocusCountBy, focusSecondsBy } from '@/lib/stats';
import { cn } from '@/lib/cn';
import type { Project, Task } from '@/types';

type Tab = 'projects' | 'tasks' | 'archived';
type Confirm = { title: string; description: string; label: string; onConfirm: () => void };

function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof FolderOpen;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-text-muted" aria-hidden="true" />
      <p className="mb-1 text-lg font-medium text-text-base">{title}</p>
      <p className="mb-5 max-w-sm text-sm text-text-sub">{body}</p>
      {action}
    </div>
  );
}

export function ProjectsPage() {
  usePageTitle('Projects');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [showDone, setShowDone] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const {
    projects,
    activeProjects,
    archivedProjects,
    loading: projectsLoading,
    addProject,
    removeProject,
    archive,
    unarchive,
  } = useProjects();
  const { allTasks, loading: tasksLoading, addTask, removeTask, setCompleted } = useTasks();
  const { sessions } = useSessions();
  const setTimerContext = useTimerStore((s) => s.setContext);

  const projectTotals = useMemo(() => focusSecondsBy(sessions, (s) => s.project_id), [sessions]);
  const taskTotals = useMemo(() => focusSecondsBy(sessions, (s) => s.task_id), [sessions]);
  const taskPomodoros = useMemo(
    () => completedFocusCountBy(sessions, (s) => s.task_id),
    [sessions]
  );
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const projectTaskCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTasks) {
      if (t.project_id && !t.is_completed) map.set(t.project_id, (map.get(t.project_id) ?? 0) + 1);
    }
    return map;
  }, [allTasks]);

  const openTasks = allTasks.filter((t) => !t.is_completed);
  const doneTasks = allTasks.filter((t) => t.is_completed);
  const visibleTasks = showDone ? [...openTasks, ...doneTasks] : openTasks;

  const focusOn = (projectId?: string, taskId?: string) => {
    setTimerContext(projectId, taskId);
    navigate('/timer');
  };

  const deleteProject = (project: Project) =>
    setConfirm({
      title: `Delete "${project.name}"?`,
      description:
        'The project and its tasks will be deleted. Focus time you already logged stays in your history and stats. To hide it without deleting, archive it instead.',
      label: 'Delete project',
      onConfirm: () => removeProject(project.id),
    });

  const deleteTask = (task: Task) =>
    setConfirm({
      title: `Delete "${task.name}"?`,
      description: 'The task will be deleted. Focus time you logged on it stays in your history.',
      label: 'Delete task',
      onConfirm: () => removeTask(task.id),
    });

  const archiveProject = (project: Project) => {
    archive(project.id);
    toast.info(`"${project.name}" archived.`, {
      label: 'Undo',
      onClick: () => unarchive(project.id),
    });
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'projects', label: 'Projects', count: activeProjects.length },
    { id: 'tasks', label: 'Tasks', count: openTasks.length },
    { id: 'archived', label: 'Archived', count: archivedProjects.length },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:p-12">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold text-text-base">Projects</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setProjectFormOpen(true)}
            className="btn-primary flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New project
          </button>
          <button
            type="button"
            onClick={() => setTaskFormOpen(true)}
            className="btn-secondary flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New task
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border-base" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              '-mb-px min-h-11 shrink-0 border-b-2 px-4 text-sm font-medium transition-colors duration-fast',
              activeTab === tab.id
                ? 'border-brand text-brand-text'
                : 'border-transparent text-text-sub hover:text-text-base'
            )}
          >
            {tab.label} <span className="text-text-muted">{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === 'projects' &&
        (projectsLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : activeProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            body="Projects group your focus time, so you can see where your hours go."
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => setProjectFormOpen(true)}
              >
                Create your first project
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                totalFocusSeconds={projectTotals.get(project.id) ?? 0}
                taskCount={projectTaskCounts.get(project.id) ?? 0}
                onArchive={() => archiveProject(project)}
                onDelete={() => deleteProject(project)}
                onPlay={() => focusOn(project.id)}
              />
            ))}
          </div>
        ))}

      {activeTab === 'tasks' &&
        (tasksLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <TaskRowSkeleton key={i} />
            ))}
          </div>
        ) : allTasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks yet"
            body="Tasks let you track focus time on specific pieces of work."
            action={
              <button type="button" className="btn-primary" onClick={() => setTaskFormOpen(true)}>
                Create a task
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {openTasks.length === 0 && (
              <p className="py-6 text-center text-sm text-text-sub">All tasks are done. 🎉</p>
            )}
            {visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={task.project_id ? projectMap.get(task.project_id) : undefined}
                totalFocusSeconds={taskTotals.get(task.id) ?? 0}
                completedPomodoros={taskPomodoros.get(task.id) ?? 0}
                onToggleComplete={(done) => setCompleted(task.id, done)}
                onDelete={() => deleteTask(task)}
                onPlay={() => focusOn(task.project_id, task.id)}
              />
            ))}
            {doneTasks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                className="btn-secondary self-center"
              >
                {showDone ? 'Hide completed tasks' : `Show ${doneTasks.length} completed`}
              </button>
            )}
          </div>
        ))}

      {activeTab === 'archived' &&
        (archivedProjects.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="No archived projects"
            body="Archive a project to hide it from your lists without losing its history."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {archivedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                totalFocusSeconds={projectTotals.get(project.id) ?? 0}
                taskCount={projectTaskCounts.get(project.id) ?? 0}
                onRestore={() => {
                  unarchive(project.id);
                  toast.success(`"${project.name}" restored.`);
                }}
                onDelete={() => deleteProject(project)}
              />
            ))}
          </div>
        ))}

      <ProjectForm
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        onSubmit={(data) => {
          const project = addProject(data);
          toast.success(`Project "${project.name}" created.`);
        }}
      />
      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSubmit={(data) => {
          addTask(data);
          setActiveTab('tasks');
        }}
        projects={activeProjects}
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
