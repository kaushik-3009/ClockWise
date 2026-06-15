import { memo } from 'react';
import { Play, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PROJECT_COLORS } from '@/lib/constants';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  totalFocusSeconds?: number;
  taskCount?: number;
  onPlay?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
}

export const ProjectCard = memo(function ProjectCard({
  project,
  totalFocusSeconds = 0,
  taskCount = 0,
  onPlay,
  onDelete,
  onClick,
  className,
}: ProjectCardProps) {
  const color = PROJECT_COLORS[project.color];
  const formattedTime =
    totalFocusSeconds > 0
      ? `${String(Math.floor(totalFocusSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((totalFocusSeconds % 3600) / 60)).padStart(2, '0')}:${String(totalFocusSeconds % 60).padStart(2, '0')}`
      : '00:00:00';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col gap-2 p-4 bg-bg-card border border-border-base rounded-lg cursor-pointer',
        'transition-all duration-fast hover:-translate-y-0.5',
        className
      )}
      style={{ '--project-color': color } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="font-semibold text-[15px] text-text-base truncate">{project.name}</span>
        </div>
        <span className="text-xs text-text-muted shrink-0">≡ {taskCount}</span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-[13px] text-text-sub leading-snug line-clamp-2">{project.description}</p>
      )}

      {/* Date */}
      <span className="text-xs text-text-muted">
        {new Date(project.created_at).toLocaleDateString()}
      </span>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="font-mono text-sm" style={{ color }}>
          {formattedTime}
        </span>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-sub hover:text-error hover:bg-error/10 transition-colors"
              aria-label="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-sub hover:text-brand hover:bg-brand-alpha transition-colors"
              aria-label="View project"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onPlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
              aria-label="Start focus"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
