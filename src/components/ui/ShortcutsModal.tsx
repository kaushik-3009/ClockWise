import { Modal } from '@/components/ui/Modal';
import { useTimerStore } from '@/stores/timerStore';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', action: 'Start / pause' },
  { key: 'R', action: 'Reset the timer' },
  { key: 'S', action: 'Skip to the next phase' },
  { key: 'Esc', action: 'Pause' },
  { key: '?', action: 'Show this list' },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  const enabled = useTimerStore((s) => s.settings.keyboard_shortcuts);
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" className="max-w-[380px]">
      {!enabled && (
        <p className="mb-4 rounded-md bg-bg-secondary p-3 text-sm text-text-sub">
          Single-key shortcuts are turned off. You can turn them on in Settings.
        </p>
      )}
      <dl className="flex flex-col gap-3">
        {SHORTCUTS.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-4">
            <dt className="text-sm text-text-sub">{s.action}</dt>
            <dd>
              <kbd className="inline-block min-w-[44px] rounded border border-border-base bg-bg-tertiary px-2 py-1 text-center font-mono text-xs text-text-base">
                {s.key}
              </kbd>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-xs text-text-muted">
        Shortcuts are ignored while typing, while a dialog is open, and when combined with ⌘, Ctrl
        or Alt.
      </p>
    </Modal>
  );
}
