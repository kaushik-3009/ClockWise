import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PROJECT_COLORS, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/lib/constants';
import type { Project, ProjectColor } from '@/types';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; color: ProjectColor }) => void;
  initialData?: Project;
}

const COLOR_KEYS = Object.keys(PROJECT_COLORS) as ProjectColor[];

export function ProjectForm({ open, onClose, onSubmit, initialData }: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [color, setColor] = useState<ProjectColor>(initialData?.color ?? 'blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim().slice(0, MAX_NAME_LENGTH),
      description: description.trim().slice(0, MAX_DESCRIPTION_LENGTH) || undefined,
      color,
    });
    if (!initialData) {
      setName('');
      setDescription('');
      setColor('blue');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit Project' : 'Create Project'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-text-sub mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            maxLength={MAX_NAME_LENGTH}
            className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-text-sub mb-1.5">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            maxLength={MAX_DESCRIPTION_LENGTH}
            className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-text-sub mb-2">Color</label>
          <div className="flex gap-3 flex-wrap">
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform duration-fast ${
                  color === c ? 'ring-2 ring-text-base scale-110' : ''
                }`}
                style={{ backgroundColor: PROJECT_COLORS[c] }}
                aria-label={`Select ${c} color`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-brand hover:bg-brand-hover text-white font-semibold text-sm rounded-md transition-colors duration-fast mt-1"
        >
          {initialData ? 'Save Changes' : 'Create Project'}
        </button>
      </form>
    </Modal>
  );
}
