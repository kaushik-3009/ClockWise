import { cn } from '@/lib/cn';

/**
 * The ClockWise mark: a clockwise sweep around a dial with a hand at 12 — the
 * same shape as the timer ring. Uses currentColor so it adapts to any surface.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M512 262 A250 250 0 1 1 295.5 387" strokeWidth="96" />
        <path d="M512 512 V372" strokeWidth="72" />
      </g>
      <circle cx="512" cy="512" r="52" fill="currentColor" />
    </svg>
  );
}

/** App-icon style tile + optional wordmark. One lockup used everywhere. */
export function Logo({
  size = 'md',
  withWordmark = true,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  withWordmark?: boolean;
  className?: string;
}) {
  const tile = {
    sm: 'h-8 w-8 rounded-[9px]',
    md: 'h-9 w-9 rounded-[10px]',
    lg: 'h-12 w-12 rounded-[13px]',
  }[size];
  const mark = { sm: 'h-6 w-6', md: 'h-7 w-7', lg: 'h-9 w-9' }[size];
  const text = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center bg-gradient-to-b from-[#F0612A] to-[#D9480F] text-white',
          tile
        )}
      >
        <LogoMark className={mark} />
      </span>
      {withWordmark && (
        <span
          className={cn(
            'font-display font-black italic leading-none tracking-tight text-text-base',
            text
          )}
        >
          ClockWise
        </span>
      )}
    </span>
  );
}
