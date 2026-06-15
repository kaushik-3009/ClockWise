import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatDurationShort } from '@/lib/time';
import { cn } from '@/lib/cn';
import { MAX_NOTE_LENGTH } from '@/lib/constants';
import type { Session } from '@/types';

const MAX_DURATION_SECONDS = 24 * 3600;

interface SessionEditModalProps {
  open: boolean;
  session: Session | null;
  onClose: () => void;
  onSave: (changes: Partial<Pick<Session, 'duration_seconds' | 'completed' | 'note'>>) => void;
}

export function SessionEditModal({ open, session, onClose, onSave }: SessionEditModalProps) {
  const [duration, setDuration] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (session) {
      setDuration(session.duration_seconds);
      setCompleted(session.completed);
      setNote(session.note ?? '');
    }
  }, [session, open]);

  if (!session) return null;

  const durationError =
    !Number.isFinite(duration) || duration < 0 || duration > MAX_DURATION_SECONDS;
  const noteError = note.length > MAX_NOTE_LENGTH;
  const canSave = !durationError && !noteError;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      duration_seconds: Math.max(0, Math.min(MAX_DURATION_SECONDS, Math.round(duration))),
      completed,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Session">
      <div className="flex flex-col gap-5">
        <div className="bg-bg-secondary rounded-md p-3 text-sm text-text-sub">
          <p>
            <span className="text-text-base font-medium">Type:</span> {session.type}
          </p>
          <p>
            <span className="text-text-base font-medium">Started:</span>{' '}
            {new Date(session.started_at).toLocaleString()}
          </p>
          <p>
            <span className="text-text-base font-medium">Current duration:</span>{' '}
            {formatDurationShort(session.duration_seconds)}
          </p>
        </div>

        <div>
          <label className="block text-sm text-text-sub mb-1.5">Duration (seconds)</label>
          <input
            type="number"
            min={0}
            max={MAX_DURATION_SECONDS}
            step={60}
            value={duration}
            onChange={(e) => setDuration(e.target.value === '' ? 0 : Number(e.target.value))}
            className={cn(
              'w-full h-11 px-3.5 rounded-md border bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors',
              durationError ? 'border-error focus:border-error' : 'border-border-base'
            )}
          />
          <p className="text-xs text-text-muted mt-1">{formatDurationShort(duration)}</p>
          {durationError && (
            <p className="text-xs text-error mt-1">
              Duration must be between 0 and {formatDurationShort(MAX_DURATION_SECONDS)}.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-text-sub mb-1.5">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this session..."
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-md border bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors resize-none',
              noteError ? 'border-error focus:border-error' : 'border-border-base'
            )}
          />
          {noteError && (
            <p className="text-xs text-error mt-1">
              Note must be {MAX_NOTE_LENGTH} characters or fewer.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-text-base">Completed</span>
          <button
            type="button"
            onClick={() => setCompleted(!completed)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-fast ${
              completed ? 'bg-brand' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-fast ${
                completed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'w-full h-11 font-semibold text-sm rounded-md transition-colors duration-fast',
            canSave
              ? 'bg-brand hover:bg-brand-hover text-white'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
          )}
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
}
