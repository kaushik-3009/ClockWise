import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: ToastAction;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type'], action?: ToastAction) => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 3;

// eslint-disable-next-line react-refresh/only-export-components
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', action) =>
    set((state) => {
      // Collapse repeats of the same message instead of stacking them.
      const rest = state.toasts.filter((t) => t.message !== message);
      return {
        toasts: [...rest, { id: crypto.randomUUID(), message, type, action }].slice(-MAX_TOASTS),
      };
    }),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Show a toast from anywhere, including non-React code. */
// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  info: (message: string, action?: ToastAction) =>
    useToastStore.getState().addToast(message, 'info', action),
  success: (message: string, action?: ToastAction) =>
    useToastStore.getState().addToast(message, 'success', action),
  error: (message: string, action?: ToastAction) =>
    useToastStore.getState().addToast(message, 'error', action),
};

/**
 * Attach error reporting to a write without blocking on it. Firestore write
 * promises only settle once the server acknowledges, which never happens while
 * offline — so the UI should update optimistically and only react to failures.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function reportFailure(promise: Promise<unknown>, message: string): void {
  promise.catch((err) => {
    console.error(`[write] ${message}:`, err);
    toast.error(message);
  });
}

function ToastItem({ toast: item }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  // Hold the toast while it's hovered or has keyboard focus, so it can't vanish
  // while someone is reading it or reaching for its button.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const held = hovered || focused;

  useEffect(() => {
    if (held) return;
    // Errors and actionable toasts stay longer so they can be read and used.
    const ms = item.action ? 10000 : item.type === 'error' ? 7000 : 4000;
    const timer = setTimeout(() => removeToast(item.id), ms);
    return () => clearTimeout(timer);
  }, [item.id, item.type, item.action, removeToast, held]);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-lg py-2.5 pl-4 pr-2 text-sm font-medium shadow-modal',
        'animate-[slideUp_200ms_cubic-bezier(0.34,1.56,0.64,1)]',
        item.type === 'success' && 'border border-success/30 bg-success-light text-success-text',
        item.type === 'error' && 'border border-error/30 bg-error-light text-error-text',
        item.type === 'info' && 'border border-border-base bg-bg-card text-text-base'
      )}
    >
      <span className="flex-1">{item.message}</span>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            removeToast(item.id);
          }}
          className="min-h-11 rounded-md px-3 font-semibold underline-offset-2 hover:underline"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => removeToast(item.id)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md opacity-70 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  // The live region is always mounted so screen readers register it before
  // the first message arrives (a region created together with its content is
  // often not announced).
  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-region pointer-events-none fixed inset-x-4 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
