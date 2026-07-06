import { useState } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TaskPicker } from './TaskPicker';

interface FocusingOnBarProps {
  projectName?: string;
  projectColor?: string;
  onSelectProject?: (projectId?: string, taskId?: string) => void;
  selectedProjectId?: string;
  selectedTaskId?: string;
  className?: string;
}

export function FocusingOnBar({
  projectName,
  projectColor,
  onSelectProject,
  selectedProjectId,
  selectedTaskId,
  className,
}: FocusingOnBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isSet = Boolean(projectName);

  return (
    <>
      <button
        onClick={() => setPickerOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 h-8 3xl:h-9 px-3 3xl:px-4 rounded-pill',
          'border border-strong bg-bg-secondary',
          'text-[13px] 3xl:text-sm transition-colors duration-fast',
          isSet ? 'text-text-base' : 'text-text-muted',
          'hover:border-text-sub',
          className
        )}
      >
        {isSet && projectColor ? (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: projectColor }}
          />
        ) : (
          <Layers className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate max-w-[260px] 3xl:max-w-[320px]">
          {isSet ? projectName : "I'm focusing on…"}
        </span>
      </button>

      {onSelectProject && (
        <TaskPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={onSelectProject}
          selectedProjectId={selectedProjectId}
          selectedTaskId={selectedTaskId}
        />
      )}
    </>
  );
}
