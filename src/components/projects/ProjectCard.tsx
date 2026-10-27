import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trash2, Archive, ArchiveRestore, ListChecks } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PROJECT_COLORS } from '@/lib/constants';
import { formatDate, formatDuration } from '@/lib/time';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  totalFocusSeconds?: number;
  taskCount?: number;
  onPlay?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  className?: string;
}

const action =
  'relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-text-sub transition-colors';

export const ProjectCard = memo(function ProjectCard({
  project,
  totalFocusSeconds = 0,
  taskCount = 0,
  onPlay,
  onDelete,
  onArchive,
  onRestore,
  className,
}: ProjectCardProps) {
  const color = PROJECT_COLORS[project.color];

  return (
    <article
      className={cn(
        'relative flex flex-col gap-2 rounded-lg border border-border-base bg-bg-card p-4 transition-all duration-fast hover:-translate-y-0.5 hover:shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          {/* The title link stretches over the whole card (see ::after). */}
          <Link
            to={`/projects/${project.id}`}
            className="truncate text-base font-semibold text-text-base after:absolute after:inset-0 after:rounded-lg after:content-['']"
          >
            {project.name}
          </Link>
        </h3>
        <span className="flex shrink-0 items-center gap-1 text-xs text-text-sub">
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {project.description && (
        <p className="line-clamp-2 text-sm leading-snug text-text-sub">{project.description}</p>
      )}

      <span className="text-xs text-text-muted">Created {formatDate(project.created_at)}</span>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-sm font-semibold text-text-base">
          {totalFocusSeconds > 0
            ? `${formatDuration(totalFocusSeconds)} focused`
            : 'No focus time yet'}
        </span>
        <div className="-mr-1.5 flex items-center">
          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              className={cn(action, 'hover:bg-bg-secondary hover:text-text-base')}
              aria-label={`Archive ${project.name}`}
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
          {onRestore && (
            <button
              type="button"
              onClick={onRestore}
              className={cn(action, 'hover:bg-bg-secondary hover:text-text-base')}
              aria-label={`Restore ${project.name}`}
            >
              <ArchiveRestore className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className={cn(action, 'hover:bg-error-light hover:text-error-text')}
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {onPlay && (
            <button
              type="button"
              onClick={onPlay}
              className="relative z-10 ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-brand-solid text-white hover:opacity-90"
              aria-label={`Focus on ${project.name}`}
            >
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
