import type { KeyboardEvent } from 'react';

/**
 * Arrow-key behaviour for radio groups and tab lists (WAI-ARIA): Left/Up and
 * Right/Down move to the previous/next option, Home/End to the first/last, and
 * selection follows focus. Pair with `tabIndex={selected ? 0 : -1}` on each
 * option so the group is a single Tab stop.
 */
export function rovingKeyDown(e: KeyboardEvent<HTMLElement>): void {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const group = e.currentTarget.closest('[role="radiogroup"], [role="tablist"]');
  if (!group) return;
  const items = Array.from(
    group.querySelectorAll<HTMLElement>('[role="radio"], [role="tab"]')
  ).filter((el) => !el.hasAttribute('disabled'));
  const i = items.indexOf(e.currentTarget);
  if (i < 0) return;
  e.preventDefault();
  const next =
    e.key === 'Home'
      ? 0
      : e.key === 'End'
        ? items.length - 1
        : (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + items.length) %
          items.length;
  items[next].focus();
  items[next].click();
}
