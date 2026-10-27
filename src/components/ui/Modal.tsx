import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Optional fixed footer (e.g. form actions) that stays visible while the body scrolls. */
  footer?: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;

/** Lock background scroll while any modal is open (iOS-safe: no position:fixed jump). */
function lockScroll() {
  if (openCount++ === 0) document.documentElement.classList.add('modal-open');
}
function unlockScroll() {
  if (--openCount <= 0) {
    openCount = 0;
    document.documentElement.classList.remove('modal-open');
  }
}

export function Modal({ open, onClose, title, children, className, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll();

    // Prefer an explicitly autofocused field, then the first form control, then
    // the panel itself — never the close button.
    const initial =
      panel.querySelector<HTMLElement>('[autofocus], [data-autofocus]') ??
      panel.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select') ??
      panel;
    initial.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only the top-most dialog handles keys.
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== panel) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      // Recompute every time — content can change while the dialog is open.
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      unlockScroll();
      // Return focus to whatever opened the dialog.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="modal-root fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-[fadeIn_150ms_ease] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'modal-panel relative flex w-full max-w-[480px] flex-col bg-bg-card outline-none',
          'rounded-t-2xl sm:rounded-lg',
          'animate-[slideUp_200ms_cubic-bezier(0.34,1.56,0.64,1)]',
          className
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-7 sm:pt-6">
          <h2 id={titleId} className="text-lg font-bold text-text-base">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-base"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="themed-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-7 sm:pb-7">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-border-base px-5 py-4 sm:px-7">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
