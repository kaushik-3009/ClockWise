import { useState, useEffect, useId } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { MAX_NOTE_LENGTH } from '@/lib/constants';
import { formatTime } from '@/lib/time';
import type { PhaseType, Project, Session, Task } from '@/types';

const MAX_MINUTES = 12 * 60;

export type SessionDraft = Pick<
  Session,
  | 'type'
  | 'started_at'
  | 'ended_at'
  | 'duration_seconds'
  | 'completed'
  | 'project_id'
  | 'task_id'
  | 'note'
>;

interface SessionEditModalProps {
  open: boolean;
  /** The session to edit, or null to log a new one. */
  session: Session | null;
  projects: Project[];
  tasks: Task[];
  onClose: () => void;
  onSave: (draft: SessionDraft) => void;
}

/** <input type="datetime-local"> value in local time. */
function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SessionEditModal({
  open,
  session,
  projects,
  tasks,
  onClose,
  onSave,
}: SessionEditModalProps) {
  const ids = useId();
  const [type, setType] = useState<PhaseType>('focus');
  const [start, setStart] = useState('');
  const [minutes, setMinutes] = useState('25');
  const [completed, setCompleted] = useState(true);
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [note, setNote] = useState('');
  const [startTouched, setStartTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    const now = Date.now();
    setType(session?.type ?? 'focus');
    setStart(toLocalInput(session?.started_at ?? now - 25 * 60_000));
    setMinutes(String(session ? Math.round(session.duration_seconds / 60) : 25));
    setCompleted(session?.completed ?? true);
    setProjectId(session?.project_id ?? '');
    setTaskId(session?.task_id ?? '');
    setNote(session?.note ?? '');
    setStartTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startMs = new Date(start).getTime();
  const mins = Number(minutes);
  const endMs = startMs + mins * 60_000;
  const errors = {
    start: !Number.isFinite(startMs)
      ? 'Enter a valid start time.'
      : endMs > Date.now() + 60_000
        ? 'A session can’t end in the future.'
        : null,
    minutes:
      !Number.isFinite(mins) || mins < 1 || mins > MAX_MINUTES
        ? `Length must be between 1 and ${MAX_MINUTES} minutes.`
        : null,
  };
  const canSave = !errors.start && !errors.minutes;
  const projectTasks = tasks.filter(
    (t) => t.project_id === projectId && (!t.is_completed || t.id === taskId)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      type,
      started_at: startMs,
      ended_at: endMs,
      duration_seconds: Math.round(mins * 60),
      completed,
      project_id: projectId || undefined,
      task_id: projectId && taskId ? taskId : undefined,
      note: note.trim().slice(0, MAX_NOTE_LENGTH) || undefined,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={session ? 'Edit session' : 'Log time'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${ids}-type`} className="text-sm text-text-sub">
              Type
            </label>
            <select
              id={`${ids}-type`}
              value={type}
              onChange={(e) => setType(e.target.value as PhaseType)}
              className="field"
            >
              <option value="focus">Focus</option>
              <option value="short_break">Short break</option>
              <option value="long_break">Long break</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${ids}-min`} className="text-sm text-text-sub">
              Length (minutes)
            </label>
            <input
              id={`${ids}-min`}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_MINUTES}
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                // New entries default to "just finished": keep the end at now.
                const m = Number(e.target.value);
                if (!session && !startTouched && m > 0)
                  setStart(toLocalInput(Date.now() - m * 60_000));
              }}
              aria-invalid={Boolean(errors.minutes)}
              className="field"
            />
          </div>
        </div>
        {errors.minutes && <p className="-mt-2 text-xs text-error-text">{errors.minutes}</p>}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-start`} className="text-sm text-text-sub">
            Started at
          </label>
          <input
            id={`${ids}-start`}
            type="datetime-local"
            value={start}
            max={toLocalInput(Date.now())}
            onChange={(e) => {
              setStart(e.target.value);
              setStartTouched(true);
            }}
            aria-invalid={Boolean(errors.start)}
            className="field"
          />
          {errors.start ? (
            <p className="text-xs text-error-text">{errors.start}</p>
          ) : (
            Number.isFinite(endMs) && (
              <p className="text-xs text-text-muted">Ends at {formatTime(endMs)}</p>
            )
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${ids}-project`} className="text-sm text-text-sub">
              Project
            </label>
            <select
              id={`${ids}-project`}
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setTaskId('');
              }}
              className="field"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.status === 'archived' ? ' (archived)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${ids}-task`} className="text-sm text-text-sub">
              Task
            </label>
            <select
              id={`${ids}-task`}
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              disabled={!projectId || projectTasks.length === 0}
              className="field disabled:opacity-60"
            >
              <option value="">No task</option>
              {projectTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-text-base">Finished</span>
            <span className="text-xs text-text-muted">
              Off if the phase was skipped or reset early.
            </span>
          </div>
          <Switch label="Finished" checked={completed} onChange={setCompleted} />
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

        <button type="submit" disabled={!canSave} className="btn-primary h-12 w-full">
          {session ? 'Save changes' : 'Log session'}
        </button>
      </form>
    </Modal>
  );
}
