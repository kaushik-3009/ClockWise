import { useState, useMemo } from 'react';
import { Search, X, Layers, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { PROJECT_COLORS } from '@/lib/constants';
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
  const { activeProjects } = useProjects();
  const { allTasks } = useTasks();

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

  return (
    <Modal open={open} onClose={onClose} title="What are you focusing on?">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              setSearch('');
              onClose();
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
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
