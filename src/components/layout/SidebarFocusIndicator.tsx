import { Layers } from 'lucide-react';
import { useTimerStore } from '@/stores/timerStore';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { PROJECT_COLORS } from '@/lib/constants';
import { cn } from '@/lib/cn';

interface SidebarFocusIndicatorProps {
  className?: string;
}

export function SidebarFocusIndicator({ className }: SidebarFocusIndicatorProps) {
  const active_project_id = useTimerStore((s) => s.active_project_id);
  const active_task_id = useTimerStore((s) => s.active_task_id);
  const { activeProjects } = useProjects();
  const { allTasks } = useTasks();

  const project = activeProjects.find((p) => p.id === active_project_id);
  const task = allTasks.find((t) => t.id === active_task_id);

  const displayText = task?.name ?? project?.name ?? "I'm focusing on…";
  const color = project ? PROJECT_COLORS[project.color] : undefined;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 h-8 px-3 rounded-pill',
        'border border-strong bg-bg-secondary',
        'text-[13px] text-text-sub',
        className
      )}
      title={displayText}
    >
      {color ? (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      ) : (
        <Layers className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="truncate max-w-[160px]">{displayText}</span>
    </div>
  );
}
