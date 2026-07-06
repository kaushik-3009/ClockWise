import { useState, useMemo } from 'react';
import { Search, X, Layers, Check, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { PROJECT_COLORS, MAX_NAME_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/cn';

interface TaskPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (projectId?: string, taskId?: string) => void;
  selectedProjectId?: string;
  selectedTaskId?: string;
}

export function TaskPicker({
  open,
  onClose,
  onSelect,
  selectedProjectId,
  selectedTaskId,
}: TaskPickerProps) {
  const [search, setSearch] = useState('');
  const { activeProjects, addProject } = useProjects();
  const { allTasks, addTask } = useTasks();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingTaskProjectId, setCreatingTaskProjectId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [busy, setBusy] = useState(false);

  const tasksByProject = useMemo(() => {
    const map = new Map<string, typeof allTasks>();
    for (const t of allTasks) {
      const pid = t.project_id ?? 'none';
      const arr = map.get(pid) ?? [];
      arr.push(t);
      map.set(pid, arr);
    }
    return map;
  }, [allTasks]);

  // Search both projects and tasks
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeProjects;

    // Find projects that match by name/description OR have a matching task
    return activeProjects.filter((p) => {
      const projectMatches =
        p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      if (projectMatches) return true;

      const projectTasks = tasksByProject.get(p.id) ?? [];
      return projectTasks.some((t) => t.name.toLowerCase().includes(q));
    });
  }, [activeProjects, search, tasksByProject]);

  const isTaskMatch = (taskName: string) => {
    const q = search.trim().toLowerCase();
    if (!q) return false;
    return taskName.toLowerCase().includes(q);
  };

  const handleSelectProject = (projectId: string) => {
    if (selectedProjectId === projectId && !selectedTaskId) {
      onSelect(undefined, undefined);
    } else {
      onSelect(projectId, undefined);
    }
    setSearch('');
    onClose();
  };

  const handleSelectTask = (projectId: string, taskId: string) => {
    if (selectedTaskId === taskId) {
      onSelect(projectId, undefined);
    } else {
      onSelect(projectId, taskId);
    }
    setSearch('');
    onClose();
  };

  const resetInlineForms = () => {
    setShowNewProject(false);
    setNewProjectName('');
    setCreatingTaskProjectId(null);
    setNewTaskName('');
  };

  const handleClose = () => {
    setSearch('');
    resetInlineForms();
    onClose();
  };

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const project = await addProject({ name, color: 'orange' });
      onSelect(project.id, undefined);
      handleClose();
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTask = async (projectId: string) => {
    const name = newTaskName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const task = await addTask({ name, project_id: projectId });
      onSelect(projectId, task.id);
      handleClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="What are you focusing on?">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Search projects or tasks..."
            className="w-full h-10 pl-9 pr-8 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-base"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick clear */}
        {(selectedProjectId || selectedTaskId) && (
          <button
            onClick={() => {
              onSelect(undefined, undefined);
              handleClose();
            }}
            className="flex items-center gap-2 text-sm text-text-sub hover:text-error transition-colors self-start"
          >
            <X className="w-4 h-4" />
            Clear selection
          </button>
        )}

        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {filteredProjects.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              No projects or tasks match your search
            </p>
          )}

          {filteredProjects.map((project) => {
            const color = PROJECT_COLORS[project.color];
            const projectTasks = tasksByProject.get(project.id) ?? [];
            const isProjectSelected = selectedProjectId === project.id;
            const hasSearch = search.trim().length > 0;

            // If searching, only show matching tasks; otherwise show all
            const visibleTasks = hasSearch
              ? projectTasks.filter((t) =>
                  t.name.toLowerCase().includes(search.trim().toLowerCase())
                )
              : projectTasks;

            return (
              <div key={project.id} className="flex flex-col">
                {/* Project row */}
                <button
                  onClick={() => handleSelectProject(project.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-left transition-colors',
                    isProjectSelected && !selectedTaskId
                      ? 'bg-brand-light'
                      : 'hover:bg-bg-secondary'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-base truncate">{project.name}</p>
                    {project.description && !hasSearch && (
                      <p className="text-xs text-text-sub truncate">{project.description}</p>
                    )}
                  </div>
                  {isProjectSelected && !selectedTaskId && (
                    <Check className="w-4 h-4 text-brand shrink-0" />
                  )}
                  {!isProjectSelected && !selectedTaskId && (
                    <Layers className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                </button>

                {/* Tasks under project */}
                {visibleTasks.length > 0 && (
                  <div className="ml-5 pl-4 border-l border-border-base flex flex-col">
                    {visibleTasks.map((task) => {
                      const isTaskSelected = selectedTaskId === task.id && isProjectSelected;
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleSelectTask(project.id, task.id)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors',
                            isTaskSelected ? 'bg-brand-light' : 'hover:bg-bg-secondary'
                          )}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span
                            className={cn(
                              'text-sm truncate',
                              isTaskSelected ? 'text-brand font-medium' : 'text-text-sub',
                              isTaskMatch(task.name) && hasSearch && 'font-medium'
                            )}
                          >
                            {task.name}
                          </span>
                          {isTaskSelected && (
                            <Check className="w-3.5 h-3.5 text-brand shrink-0 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Inline add-task */}
                <div className="ml-5 pl-4 border-l border-border-base">
                  {creatingTaskProjectId === project.id ? (
                    <div className="flex items-center gap-1.5 py-1.5">
                      <input
                        autoFocus
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateTask(project.id);
                          } else if (e.key === 'Escape') {
                            setCreatingTaskProjectId(null);
                            setNewTaskName('');
                          }
                        }}
                        maxLength={MAX_NAME_LENGTH}
                        placeholder="New task name..."
                        className="flex-1 h-8 px-2.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
                      />
                      <button
                        type="button"
                        disabled={!newTaskName.trim() || busy}
                        onClick={() => handleCreateTask(project.id)}
                        className="h-8 px-2.5 rounded-md bg-brand text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-colors"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingTaskProjectId(null);
                          setNewTaskName('');
                        }}
                        className="p-1.5 text-text-muted hover:text-text-base"
                        aria-label="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCreatingTaskProjectId(project.id);
                        setNewTaskName('');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-brand transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline new project */}
        <div className="border-t border-border-base pt-3">
          {showNewProject ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateProject();
                  } else if (e.key === 'Escape') {
                    setShowNewProject(false);
                    setNewProjectName('');
                  }
                }}
                maxLength={MAX_NAME_LENGTH}
                placeholder="New project name..."
                className="flex-1 h-9 px-3 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
              />
              <button
                type="button"
                disabled={!newProjectName.trim() || busy}
                onClick={handleCreateProject}
                className="h-9 px-3 rounded-md bg-brand text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewProject(false);
                  setNewProjectName('');
                }}
                className="p-2 text-text-muted hover:text-text-base"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowNewProject(true);
                setNewProjectName(search.trim());
              }}
              className="flex items-center gap-2 text-sm text-text-sub hover:text-brand transition-colors"
            >
              <Plus className="w-4 h-4" />
              New project
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
