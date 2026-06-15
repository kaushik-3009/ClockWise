import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, ClipboardList, Archive } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { useTimerStore } from '@/stores/timerStore';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { TaskRow } from '@/components/projects/TaskRow';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaskForm } from '@/components/projects/TaskForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';

import type { Project, Task } from '@/types';

type Tab = 'projects' | 'tasks' | 'archived';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'danger' | 'default';
  }>({ open: false, title: '', description: '', onConfirm: () => {}, variant: 'danger' });

  const { projects, activeProjects, archivedProjects, addProject, removeProject } = useProjects();
  const { tasks, allTasks, addTask, removeTask } = useTasks();
  const { sessions } = useSessions();
  const setTimerContext = useTimerStore((s) => s.setContext);

  // Compute total focus seconds per project
  const projectTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.project_id && s.type === 'focus' && s.completed) {
        map.set(s.project_id, (map.get(s.project_id) ?? 0) + s.duration_seconds);
      }
    }
    return map;
  }, [sessions]);

  // Compute task counts per project
  const projectTaskCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTasks) {
      if (t.project_id) {
        map.set(t.project_id, (map.get(t.project_id) ?? 0) + 1);
      }
    }
    return map;
  }, [allTasks]);

  // For task rows, find project for each task
  const projectMap = useMemo(() => {
    const map = new Map<string, (typeof projects)[0]>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  // Task focus totals
  const taskTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.task_id && s.type === 'focus' && s.completed) {
        map.set(s.task_id, (map.get(s.task_id) ?? 0) + s.duration_seconds);
      }
    }
    return map;
  }, [sessions]);

  const handleDeleteProject = (project: Project) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Project',
      description: `Are you sure you want to delete "${project.name}"? This will also delete all associated tasks and sessions. This action cannot be undone.`,
      onConfirm: () => removeProject(project.id),
      variant: 'danger',
    });
  };

  const handleDeleteTask = (task: Task) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Task',
      description: `Are you sure you want to delete "${task.name}"? This will also delete associated sessions. This action cannot be undone.`,
      onConfirm: () => removeTask(task.id),
      variant: 'danger',
    });
  };

  return (
    <div className="p-6 lg:p-12 w-full 2xl:max-w-[1600px] 2xl:mx-auto animate-[page-enter_200ms_ease]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-text-base">Projects and Tasks</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setProjectFormOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create project
          </button>
          <button
            onClick={() => setTaskFormOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border-base bg-bg-card text-text-base text-sm font-medium hover:bg-bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border-base" role="tablist">
        {(['projects', 'tasks', 'archived'] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors duration-fast border-b-2 -mb-px',
              activeTab === tab
                ? 'text-brand border-brand'
                : 'text-text-sub border-transparent hover:text-text-base'
            )}
          >
            {tab === 'projects' ? 'Projects' : tab === 'tasks' ? 'Tasks' : 'Archived'}
          </button>
        ))}
      </div>

      {/* Projects tab */}
      {activeTab === 'projects' && (
        <>
          {activeProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <FolderOpen className="w-12 h-12 mb-4 opacity-80" />
              <p className="text-lg font-medium mb-2">No projects yet</p>
              <p className="text-sm">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  totalFocusSeconds={projectTotals.get(project.id) ?? 0}
                  taskCount={projectTaskCounts.get(project.id) ?? 0}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  onDelete={() => handleDeleteProject(project)}
                  onPlay={() => {
                    setTimerContext(project.id, undefined);
                    navigate('/timer');
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <ClipboardList className="w-12 h-12 mb-4 opacity-80" />
              <p className="text-lg font-medium mb-2">No tasks yet</p>
              <p className="text-sm">Create your first task to get started</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  project={task.project_id ? projectMap.get(task.project_id) : undefined}
                  totalFocusSeconds={taskTotals.get(task.id) ?? 0}
                  onDelete={() => handleDeleteTask(task)}
                  onPlay={() => {
                    setTimerContext(task.project_id, task.id);
                    navigate('/timer');
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Archived tab */}
      {activeTab === 'archived' && (
        <>
          {archivedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <Archive className="w-12 h-12 mb-4 opacity-80" />
              <p className="text-lg font-medium mb-2">No archived projects</p>
              <p className="text-sm">Archive a project to hide it from the main list</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {archivedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  totalFocusSeconds={projectTotals.get(project.id) ?? 0}
                  taskCount={projectTaskCounts.get(project.id) ?? 0}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ProjectForm
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        onSubmit={addProject}
      />
      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSubmit={addTask}
        projects={activeProjects}
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
