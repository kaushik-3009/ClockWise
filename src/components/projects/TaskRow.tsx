import { memo, useState } from 'react';
import { Play, Trash2, Pencil, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PROJECT_COLORS } from '@/lib/constants';
import type { Task, Project } from '@/types';

interface TaskRowProps {
  task: Task;
  project?: Project;
  totalFocusSeconds?: number;
  completedPomodoros?: number;
  onPlay?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const priorityConfig = {
  low: { color: 'bg-blue-500', label: 'Low' },
  medium: { color: 'bg-orange-500', label: 'Medium' },
  high: { color: 'bg-red-500', label: 'High' },
};

export const TaskRow = memo(function TaskRow({
  task,
  project,
  totalFocusSeconds = 0,
  completedPomodoros = 0,
  onPlay,
  onDelete,
  onEdit,
  className,
}: TaskRowProps) {
  const color = project ? PROJECT_COLORS[project.color] : undefined;
  const formattedTime =
    totalFocusSeconds > 0
      ? `${String(Math.floor(totalFocusSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((totalFocusSeconds % 3600) / 60)).padStart(2, '0')}:${String(totalFocusSeconds % 60).padStart(2, '0')}`
      : '00:00:00';

  const [expanded, setExpanded] = useState(false);

  const pomodoroProgress = task.estimated_pomodoros
    ? Math.min((completedPomodoros / task.estimated_pomodoros) * 100, 100)
    : 0;

  return (
    <div
      className={cn(
        'flex flex-col bg-bg-card border border-border-base rounded-md',
        'hover:bg-bg-tertiary transition-colors duration-fast',
        className
      )}
      style={color ? ({ '--project-color': color } as React.CSSProperties) : undefined}
    >
      <div className="flex items-center gap-3 p-3.5 px-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-base truncate">{task.name}</p>
            {task.priority && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig[task.priority].color}`}
                title={priorityConfig[task.priority].label}
              />
            )}
          </div>
          {project && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-text-sub">{project.name}</span>
            </div>
          )}
          {/* Pomodoro progress bar */}
          {task.estimated_pomodoros && task.estimated_pomodoros > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-slow"
                  style={{
                    width: `${pomodoroProgress}%`,
                    backgroundColor: color || 'var(--color-brand)',
                  }}
                />
              </div>
              <span className="text-[10px] text-text-muted shrink-0">
                {completedPomodoros}/{task.estimated_pomodoros}
              </span>
            </div>
          )}
        </div>

        <span
          className="font-mono text-[15px] font-medium shrink-0"
          style={color ? { color } : undefined}
        >
          {formattedTime}
        </span>

        <div className="flex items-center gap-1 ml-3 shrink-0">
          {(task.note || task.estimated_pomodoros) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-sub hover:text-brand hover:bg-brand-alpha transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-sub hover:text-brand hover:bg-brand-alpha transition-colors"
              aria-label="Edit task"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-sub hover:text-error hover:bg-error/10 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onPlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: color }}
              aria-label="Start focus"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3.5 pt-0 border-t border-border-base">
          {task.note && (
            <div className="flex items-start gap-2 py-2">
              <StickyNote className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
              <p className="text-sm text-text-sub whitespace-pre-wrap">{task.note}</p>
            </div>
          )}
          {task.estimated_pomodoros && (
            <p className="text-xs text-text-muted mt-1">
              Estimated {task.estimated_pomodoros} pomodoros
              {completedPomodoros > 0 && ` · ${completedPomodoros} completed`}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
