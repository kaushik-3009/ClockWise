import { Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTimerStore } from '@/stores/timerStore';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { PROJECT_COLORS } from '@/lib/constants';
import { formatMMSS } from '@/lib/time';
import { cn } from '@/lib/cn';

interface SidebarFocusIndicatorProps {
  className?: string;
}

/** Shows what you're focusing on (and the live countdown) from any page. */
export function SidebarFocusIndicator({ className }: SidebarFocusIndicatorProps) {
  const activeProjectId = useTimerStore((s) => s.active_project_id);
  const activeTaskId = useTimerStore((s) => s.active_task_id);
  const status = useTimerStore((s) => s.status);
  const remaining = useTimerStore((s) => s.remaining_seconds);
  const { projects } = useProjects();
  const { allTasks } = useTasks();

  const project = projects.find((p) => p.id === activeProjectId);
  const task = allTasks.find((t) => t.id === activeTaskId);
  const displayText = task?.name ?? project?.name ?? "I'm focusing on…";
  const color = project ? PROJECT_COLORS[project.color] : undefined;
  const live = status === 'running' || status === 'paused';

  return (
    <Link
      to="/timer"
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-pill border border-border-base bg-bg-secondary px-3 text-sm text-text-sub transition-colors hover:border-border-strong',
        className
      )}
      title={displayText}
    >
      {color ? (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      ) : (
        <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1 truncate">{displayText}</span>
      {live && (
        <span
          className={cn(
            'shrink-0 font-mono text-xs tabular-nums',
            status === 'running' ? 'text-brand-text' : 'text-text-muted'
          )}
        >
          {formatMMSS(remaining)}
        </span>
      )}
    </Link>
  );
}
