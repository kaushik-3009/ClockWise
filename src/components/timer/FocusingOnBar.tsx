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
          'inline-flex items-center gap-2 h-9 3xl:h-10 px-4 3xl:px-5 rounded-pill',
          'border border-strong bg-bg-secondary',
          'text-sm 3xl:text-base transition-colors duration-fast',
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
          <Layers className="w-4 h-4 shrink-0" />
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
