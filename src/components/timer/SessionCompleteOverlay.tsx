import { Trophy } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatDuration } from '@/lib/time';

interface SessionCompleteOverlayProps {
  open: boolean;
  onClose: () => void;
  onStartNew: () => void;
  focusSeconds: number;
  phasesCompleted: number;
  totalPhases: number;
  projectName?: string;
}

export function SessionCompleteOverlay({
  open,
  onClose,
  onStartNew,
  focusSeconds,
  phasesCompleted,
  totalPhases,
  projectName,
}: SessionCompleteOverlayProps) {
  return (
    <Modal open={open} onClose={onClose} title="Session complete" className="max-w-[420px]">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-alpha">
            <Trophy className="h-8 w-8 text-brand-text" aria-hidden="true" />
          </div>
        </div>
        <p className="mb-6 text-sm text-text-sub">
          {projectName ? `Nice work on ${projectName}.` : 'Nice work — that was a full session.'}
        </p>

        <dl className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-bg-secondary p-4">
            <dd className="font-display text-2xl font-bold text-text-base">
              {formatDuration(focusSeconds)}
            </dd>
            <dt className="mt-1 text-xs text-text-sub">Focus time</dt>
          </div>
          <div className="rounded-lg bg-bg-secondary p-4">
            <dd className="font-display text-2xl font-bold text-text-base">
              {phasesCompleted} of {totalPhases}
            </dd>
            <dt className="mt-1 text-xs text-text-sub">Phases done</dt>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => {
            onClose();
            onStartNew();
          }}
          className="h-12 w-full rounded-md bg-brand-solid text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Start a new session
        </button>
      </div>
    </Modal>
  );
}
