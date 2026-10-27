import { memo, useId, useState } from 'react';
import { Play, Trash2, Pencil, ChevronDown, StickyNote, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PROJECT_COLORS, PRIORITY } from '@/lib/constants';
import { formatDuration } from '@/lib/time';
import type { Task, Project } from '@/types';

interface TaskRowProps {
  task: Task;
  project?: Project;
  totalFocusSeconds?: number;
  completedPomodoros?: number;
  onToggleComplete?: (completed: boolean) => void;
  onPlay?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const iconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-sub transition-colors';

export const TaskRow = memo(function TaskRow({
  task,
  project,
  totalFocusSeconds = 0,
  completedPomodoros = 0,
  onToggleComplete,
  onPlay,
  onDelete,
  onEdit,
  className,
}: TaskRowProps) {
  const color = project ? PROJECT_COLORS[project.color] : undefined;
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const hasDetails = Boolean(task.note || task.estimated_pomodoros);
  const progress = task.estimated_pomodoros
    ? Math.min((completedPomodoros / task.estimated_pomodoros) * 100, 100)
    : 0;

  return (
    <div className={cn('flex flex-col rounded-md border border-border-base bg-bg-card', className)}>
      <div className="flex items-center gap-1 py-1.5 pl-1.5 pr-2 sm:gap-2">
        {onToggleComplete && (
          <button
            type="button"
            role="checkbox"
            aria-checked={task.is_completed}
            aria-label={
              task.is_completed ? `Mark "${task.name}" as not done` : `Mark "${task.name}" as done`
            }
            onClick={() => onToggleComplete(!task.is_completed)}
            className="flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                task.is_completed ? 'border-success bg-success text-white' : 'border-border-input'
              )}
            >
              {task.is_completed && (
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
              )}
            </span>
          </button>
        )}

        <div className={cn('min-w-0 flex-1 py-1.5', !onToggleComplete && 'pl-2.5')}>
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'truncate text-sm font-medium',
                task.is_completed ? 'text-text-muted line-through' : 'text-text-base'
              )}
            >
              {task.name}
            </p>
            {task.priority && (
              <span
                className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY[task.priority].dot)}
                title={PRIORITY[task.priority].label}
              >
                <span className="sr-only">{PRIORITY[task.priority].label}</span>
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-sub">
            {project && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {project.name}
              </span>
            )}
            <span>
              {totalFocusSeconds > 0 ? formatDuration(totalFocusSeconds) : 'No focus yet'}
            </span>
            {task.estimated_pomodoros ? (
              <span>
                {completedPomodoros}/{task.estimated_pomodoros} pomodoros
              </span>
            ) : null}
          </div>
          {task.estimated_pomodoros ? (
            <div className="mt-1.5 h-1 max-w-[220px] overflow-hidden rounded-full bg-bg-tertiary">
              <div
                className="h-full rounded-full bg-brand transition-all duration-slow"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center">
          {task.note && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={detailsId}
              className={cn(iconBtn, 'hover:bg-bg-secondary hover:text-text-base')}
              aria-label={expanded ? 'Hide note' : 'Show note'}
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
              />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className={cn(iconBtn, 'hover:bg-bg-secondary hover:text-text-base')}
              aria-label={`Edit "${task.name}"`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className={cn(iconBtn, 'hover:bg-error-light hover:text-error-text')}
              aria-label={`Delete "${task.name}"`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {onPlay && !task.is_completed && (
            <button
              type="button"
              onClick={onPlay}
              className="ml-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white hover:opacity-90"
              aria-label={`Focus on "${task.name}"`}
            >
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </button>
          )}
        </div>
      </div>

      {expanded && hasDetails && task.note && (
        <div
          id={detailsId}
          className="flex items-start gap-2 border-t border-border-base px-4 py-3"
        >
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
          <p className="whitespace-pre-wrap text-sm text-text-sub">{task.note}</p>
        </div>
      )}
    </div>
  );
});
