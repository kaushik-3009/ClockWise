import { useState, useEffect, useId } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MAX_NAME_LENGTH, MAX_NOTE_LENGTH, PRIORITY } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Project, Task } from '@/types';

type Priority = 'low' | 'medium' | 'high';

export interface TaskFormData {
  name: string;
  project_id?: string;
  priority?: Priority;
  note?: string;
  estimated_pomodoros?: number;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  projects: Project[];
  initialData?: Task;
  /** Pre-selected project for new tasks. */
  defaultProjectId?: string;
}

export function TaskForm({
  open,
  onClose,
  onSubmit,
  projects,
  initialData,
  defaultProjectId,
}: TaskFormProps) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [note, setNote] = useState('');
  const [estimate, setEstimate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ids = useId();

  // Reset only when the dialog opens. (Resetting whenever `projects` changed
  // wiped what the user was typing on every parent re-render.)
  useEffect(() => {
    if (!open) return;
    setName(initialData?.name ?? '');
    setProjectId(initialData ? (initialData.project_id ?? '') : (defaultProjectId ?? ''));
    setPriority(initialData?.priority);
    setNote(initialData?.note ?? '');
    setEstimate(initialData?.estimated_pomodoros ? String(initialData.estimated_pomodoros) : '');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give your task a name.');
      return;
    }
    const est = Math.round(Number(estimate));
    // Optional fields are sent as undefined when empty; on edit that clears them.
    onSubmit({
      name: name.trim().slice(0, MAX_NAME_LENGTH),
      project_id: projectId || undefined,
      priority,
      note: note.trim().slice(0, MAX_NOTE_LENGTH) || undefined,
      estimated_pomodoros: est > 0 ? Math.min(est, 99) : undefined,
    });
    onClose();
  };

  const choice = (selected: boolean) =>
    cn(
      'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors',
      selected
        ? 'border-brand bg-brand-alpha text-brand-text'
        : 'border-border-input text-text-sub hover:bg-bg-secondary hover:text-text-base'
    );

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit task' : 'New task'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-name`} className="text-sm text-text-sub">
            Name
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${ids}-err` : undefined}
            className="field"
          />
          {error && (
            <p id={`${ids}-err`} className="text-xs text-error-text">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-project`} className="text-sm text-text-sub">
            Project
          </label>
          <select
            id={`${ids}-project`}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="field"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm text-text-sub">Priority</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              aria-pressed={!priority}
              onClick={() => setPriority(undefined)}
              className={choice(!priority)}
            >
              None
            </button>
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={priority === p}
                onClick={() => setPriority(p)}
                className={choice(priority === p)}
              >
                <span className={cn('h-2 w-2 rounded-full', PRIORITY[p].dot)} aria-hidden="true" />
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-est`} className="text-sm text-text-sub">
            Estimated pomodoros <span className="text-text-muted">(optional)</span>
          </label>
          <input
            id={`${ids}-est`}
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            className="field max-w-[160px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-note`} className="text-sm text-text-sub">
            Note <span className="text-text-muted">(optional)</span>
          </label>
          <textarea
            id={`${ids}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            className="field resize-none"
          />
        </div>

        <button type="submit" className="btn-primary mt-1 h-12 w-full">
          {initialData ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </Modal>
  );
}
