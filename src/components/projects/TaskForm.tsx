import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MAX_NAME_LENGTH, MAX_NOTE_LENGTH } from '@/lib/constants';
import type { Project, Task } from '@/types';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    project_id?: string;
    priority?: 'low' | 'medium' | 'high';
    note?: string;
    estimated_pomodoros?: number;
    is_completed?: boolean;
  }) => void;
  projects: Project[];
  initialData?: Task;
}

export function TaskForm({ open, onClose, onSubmit, projects, initialData }: TaskFormProps) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>(projects[0]?.id);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [note, setNote] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState<number | undefined>(undefined);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setProjectId(initialData.project_id);
      setPriority(initialData.priority);
      setNote(initialData.note ?? '');
      setEstimatedPomodoros(initialData.estimated_pomodoros);
      setIsCompleted(initialData.is_completed);
    } else {
      setName('');
      setProjectId(projects[0]?.id);
      setPriority(undefined);
      setNote('');
      setEstimatedPomodoros(undefined);
      setIsCompleted(false);
    }
  }, [initialData, open, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim().slice(0, MAX_NAME_LENGTH),
      project_id: projectId,
      priority: priority,
      note: note.trim().slice(0, MAX_NOTE_LENGTH) || undefined,
      estimated_pomodoros:
        estimatedPomodoros && estimatedPomodoros > 0 ? estimatedPomodoros : undefined,
      is_completed: isCompleted,
    });
    if (!initialData) {
      setName('');
      setProjectId(projects[0]?.id);
      setPriority(undefined);
      setNote('');
      setEstimatedPomodoros(undefined);
      setIsCompleted(false);
    }
    onClose();
  };

  const priorityOptions: { value: 'low' | 'medium' | 'high'; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-blue-500' },
    { value: 'medium', label: 'Medium', color: 'bg-orange-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit Task' : 'Create Task'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-text-sub mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Task name"
            maxLength={MAX_NAME_LENGTH}
            className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-text-sub mb-1.5">Project</label>
          <select
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value || undefined)}
            className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-text-sub mb-1.5">Priority</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPriority(undefined)}
              className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                !priority
                  ? 'border-brand bg-brand-alpha text-brand'
                  : 'border-border-base text-text-sub hover:text-text-base hover:bg-bg-secondary'
              }`}
            >
              None
            </button>
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  priority === opt.value
                    ? 'border-brand bg-brand-alpha text-brand'
                    : 'border-border-base text-text-sub hover:text-text-base hover:bg-bg-secondary'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Est. Pomodoros</label>
            <input
              type="number"
              min={0}
              max={50}
              value={estimatedPomodoros ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setEstimatedPomodoros(val ? Number(val) : undefined);
              }}
              placeholder="0"
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {initialData && (
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-base">Completed</span>
            <button
              type="button"
              onClick={() => setIsCompleted(!isCompleted)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-fast ${
                isCompleted ? 'bg-brand' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-fast ${
                  isCompleted ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm text-text-sub mb-1.5">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add details about this task..."
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            className="w-full px-3.5 py-2.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-brand hover:bg-brand-hover text-white font-semibold text-sm rounded-md transition-colors duration-fast mt-1"
        >
          {initialData ? 'Save Changes' : 'Create Task'}
        </button>
      </form>
    </Modal>
  );
}
