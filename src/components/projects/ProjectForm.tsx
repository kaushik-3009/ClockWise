import { useState, useEffect, useId } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { PROJECT_COLORS, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Project, ProjectColor } from '@/types';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; color: ProjectColor }) => void;
  initialData?: Project;
}

const COLOR_KEYS = Object.keys(PROJECT_COLORS) as ProjectColor[];

export function ProjectForm({ open, onClose, onSubmit, initialData }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ProjectColor>('blue');
  const [error, setError] = useState<string | null>(null);
  const ids = useId();

  // Reset only when the dialog opens — not on every parent re-render.
  useEffect(() => {
    if (!open) return;
    setName(initialData?.name ?? '');
    setDescription(initialData?.description ?? '');
    setColor(initialData?.color ?? 'blue');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give your project a name.');
      return;
    }
    onSubmit({
      name: name.trim().slice(0, MAX_NAME_LENGTH),
      // Empty string clears the description on edit; undefined is dropped on create.
      description: description.trim().slice(0, MAX_DESCRIPTION_LENGTH) || undefined,
      color,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit project' : 'New project'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
            placeholder="e.g. Thesis"
            maxLength={MAX_NAME_LENGTH}
            enterKeyHint="done"
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
          <label htmlFor={`${ids}-desc`} className="text-sm text-text-sub">
            Description <span className="text-text-muted">(optional)</span>
          </label>
          <input
            id={`${ids}-desc`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={MAX_DESCRIPTION_LENGTH}
            className="field"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm text-text-sub">Colour</legend>
          <div className="flex flex-wrap gap-1">
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                aria-label={c}
                className="flex h-11 w-11 items-center justify-center rounded-full"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-white',
                    color === c && 'ring-2 ring-text-base ring-offset-2 ring-offset-bg-card'
                  )}
                  style={{ backgroundColor: PROJECT_COLORS[c] }}
                >
                  {color === c && <Check className="h-4 w-4" aria-hidden="true" />}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn-primary h-12 w-full">
          {initialData ? 'Save changes' : 'Create project'}
        </button>
      </form>
    </Modal>
  );
}
