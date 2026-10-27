import { memo } from 'react';
import { cn } from '@/lib/cn';
import { formatMMSS } from '@/lib/time';
import type { TimerStyle } from '@/types';

interface TimerDisplayProps {
  remainingSeconds: number;
  totalSeconds?: number;
  timerStyle?: TimerStyle;
  clockNow?: number;
  className?: string;
}

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

// Scales with the smaller of width and height so the dial fits phones in both
// orientations without pushing the controls off-screen.
const DIAL_SIZE = 'h-[min(68vw,38dvh,440px)] w-[min(68vw,38dvh,440px)]';

function Hand({
  deg,
  length,
  width,
  color,
}: {
  deg: number;
  length: number;
  width: number;
  color: string;
}) {
  return (
    <line
      x1="100"
      y1="100"
      x2={100 + length * Math.cos(rad(deg))}
      y2={100 + length * Math.sin(rad(deg))}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

/** Shared dial: track, progress ring, minute ticks and labels. Hands go in `children`. */
function Dial({
  progress,
  labels,
  children,
}: {
  progress: number;
  labels: string[];
  children: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 200 200" className={DIAL_SIZE} aria-hidden="true">
      <circle
        cx="100"
        cy="100"
        r={RADIUS}
        fill="none"
        stroke="var(--border-color)"
        strokeWidth="4"
      />
      <circle
        cx="100"
        cy="100"
        r={RADIUS}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)))}
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
      {Array.from({ length: 60 }).map((_, i) => {
        const major = i % 5 === 0;
        const a = rad(i * 6);
        const inner = major ? 78 : 83;
        return (
          <line
            key={i}
            x1={100 + inner * Math.cos(a)}
            y1={100 + inner * Math.sin(a)}
            x2={100 + 86 * Math.cos(a)}
            y2={100 + 86 * Math.sin(a)}
            stroke={major ? 'var(--text-primary)' : 'var(--text-muted)'}
            strokeWidth={major ? 2 : 1}
            opacity={major ? 1 : 0.5}
          />
        );
      })}
      {labels.map((label, i) => {
        const a = rad(i * 30);
        return (
          <text
            key={label}
            x={100 + 67 * Math.cos(a)}
            y={100 + 67 * Math.sin(a)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-secondary)"
            fontSize="10"
            fontFamily="Manrope, sans-serif"
            fontWeight={i === 0 ? 700 : 500}
          >
            {label}
          </text>
        );
      })}
      {children}
      <circle cx="100" cy="100" r="4" fill="var(--color-brand)" />
    </svg>
  );
}

const MINUTE_LABELS = Array.from({ length: 12 }, (_, i) => String(i * 5));
const HOUR_LABELS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

/** Countdown dial: one hand sweeps back towards 0 as the phase runs down. */
function AnalogTimerFace({ remainingSeconds, total }: { remainingSeconds: number; total: number }) {
  const handDeg = ((remainingSeconds / 60) % 60) * 6;
  return (
    <Dial progress={1 - remainingSeconds / total} labels={MINUTE_LABELS}>
      <Hand deg={handDeg} length={54} width={3.5} color="var(--text-primary)" />
    </Dial>
  );
}

/** Wall clock showing the current time, with phase progress on the ring. */
function ClockFace({
  remainingSeconds,
  total,
  clockNow,
}: {
  remainingSeconds: number;
  total: number;
  clockNow: number;
}) {
  const now = new Date(clockNow);
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  return (
    <Dial progress={1 - remainingSeconds / total} labels={HOUR_LABELS}>
      <Hand deg={(h % 12) * 30 + m * 0.5} length={36} width={4} color="var(--text-primary)" />
      <Hand deg={m * 6 + s * 0.1} length={52} width={3} color="var(--text-primary)" />
      <Hand deg={s * 6} length={56} width={1.5} color="var(--color-brand)" />
    </Dial>
  );
}

export const TimerDisplay = memo(function TimerDisplay({
  remainingSeconds,
  totalSeconds = 25 * 60,
  timerStyle = 'digital',
  clockNow = Date.now(),
  className,
}: TimerDisplayProps) {
  const total = totalSeconds > 0 ? totalSeconds : 25 * 60;
  const formatted = formatMMSS(remainingSeconds);

  if (timerStyle === 'clock_numeric' || timerStyle === 'analog') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        {timerStyle === 'analog' ? (
          <AnalogTimerFace remainingSeconds={remainingSeconds} total={total} />
        ) : (
          <ClockFace remainingSeconds={remainingSeconds} total={total} clockNow={clockNow} />
        )}
        <div className="font-display text-3xl font-bold italic tabular-nums text-text-base md:text-4xl 3xl:text-5xl">
          {formatted}
        </div>
      </div>
    );
  }

  const [mm, ss] = formatted.split(':');
  return (
    <div
      className={cn(
        'flex select-none items-center font-display font-black italic tabular-nums',
        'text-[clamp(84px,min(24vw,18dvh),220px)] leading-none',
        className
      )}
    >
      <span className="text-[--text-primary]">{mm}</span>
      <span className="mx-2 text-[--color-brand] lg:mx-4 3xl:mx-5">:</span>
      <span className="text-[--text-primary]">{ss}</span>
    </div>
  );
});
