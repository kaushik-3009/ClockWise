import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause timer' },
  { key: 'R', action: 'Reset timer' },
  { key: 'S', action: 'Skip current phase' },
  { key: 'Esc', action: 'Pause timer' },
  { key: '?', action: 'Show keyboard shortcuts' },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card rounded-lg p-6 w-full max-w-[360px] animate-[slideUp_200ms_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-text-sub" />
            <h2 className="text-base font-bold text-text-base">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-base transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm text-text-sub">{s.action}</span>
              <kbd className="px-2 py-1 rounded bg-bg-tertiary border border-border-base font-mono text-xs text-text-base min-w-[40px] text-center">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
