import { useEffect, useRef } from 'react';

interface Handlers {
  enabled: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
  onPause: () => void;
  onHelp: () => void;
}

/** Elements where Space/letters have their own meaning and must not be hijacked. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(
    target.closest(
      'input, textarea, select, button, a[href], summary, [role="button"], [role="menuitem"], [role="option"], [role="slider"], [role="switch"], [role="tab"]'
    )
  );
}

const dialogOpen = () => document.querySelector('[role="dialog"][aria-modal="true"]') !== null;

/**
 * Timer keyboard shortcuts. They never fire with modifier keys (so Cmd/Ctrl+R
 * reloads and Ctrl+S saves as usual), while a dialog is open, while typing, or
 * when a button/link has focus (Space should press that button).
 */
export function useTimerShortcuts(handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = ref.current;
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (dialogOpen()) return;

      if (e.key === '?') {
        if (isInteractiveTarget(e.target) && !(e.target instanceof HTMLButtonElement)) return;
        e.preventDefault();
        h.onHelp();
        return;
      }
      if (!h.enabled || isInteractiveTarget(e.target)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          h.onToggle();
          break;
        case 'r':
        case 'R':
          h.onReset();
          break;
        case 's':
        case 'S':
          h.onSkip();
          break;
        case 'Escape':
          h.onPause();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
