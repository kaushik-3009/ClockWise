import { memo, useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { formatMMSS } from '@/lib/time';
import type { TimerStyle } from '@/types';

interface TimerDisplayProps {
  remainingSeconds: number;
  totalSeconds?: number;
  timerStyle?: TimerStyle;
  className?: string;
}

function AnalogTimerFace({
  remainingSeconds,
  totalSeconds = 25 * 60,
}: {
  remainingSeconds: number;
  totalSeconds?: number;
}) {
  const total = totalSeconds > 0 ? totalSeconds : 25 * 60;
  const progress = 1 - remainingSeconds / total;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const minuteAngle = (remainingSeconds / 60) * 6 - 90;
  const secondAngle = (remainingSeconds % 60) * 6 - 90;

  return (
    <div className="relative w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] md:w-[240px] md:h-[240px] lg:w-[280px] lg:h-[280px] xl:w-[320px] xl:h-[320px] 2xl:w-[360px] 2xl:h-[360px]">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="4"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const isHour = i % 5 === 0;
          const innerR = isHour ? 78 : 84;
          const outerR = 88;
          const x1 = 100 + innerR * Math.cos(angle);
          const y1 = 100 + innerR * Math.sin(angle);
          const x2 = 100 + outerR * Math.cos(angle);
          const y2 = 100 + outerR * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isHour ? 'var(--text-primary)' : 'var(--text-muted)'}
              strokeWidth={isHour ? 2 : 1}
              opacity={isHour ? 1 : 0.5}
            />
          );
        })}
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
          const angle = ((num % 12) * 30 - 90) * (Math.PI / 180);
          const r = 68;
          const x = 100 + r * Math.cos(angle);
          const y = 100 + r * Math.sin(angle);
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text-secondary)"
              fontSize="11"
              fontFamily="Manrope, sans-serif"
              fontWeight={num === 12 ? '700' : '400'}
            >
              {num}
            </text>
          );
        })}
        <line
          x1="100"
          y1="100"
          x2={100 + 50 * Math.cos(minuteAngle * (Math.PI / 180))}
          y2={100 + 50 * Math.sin(minuteAngle * (Math.PI / 180))}
          stroke="var(--text-primary)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="100"
          y1="100"
          x2={100 + 72 * Math.cos(secondAngle * (Math.PI / 180))}
          y2={100 + 72 * Math.sin(secondAngle * (Math.PI / 180))}
          stroke="var(--color-brand)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="4" fill="var(--color-brand)" />
      </svg>
    </div>
  );
}

function ClockFace({
  remainingSeconds,
  totalSeconds = 25 * 60,
}: {
  remainingSeconds: number;
  totalSeconds?: number;
}) {
  const total = totalSeconds > 0 ? totalSeconds : 25 * 60;
  const progress = 1 - remainingSeconds / total;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // Real wall-clock time
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Hand angles for real time
  const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 30 deg per hour + 0.5 per minute
  const minuteAngle = minutes * 6 + seconds * 0.1; // 6 deg per minute + 0.1 per second
  const secondAngle = seconds * 6; // 6 deg per second

  return (
    <div className="relative w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] md:w-[240px] md:h-[240px] lg:w-[280px] lg:h-[280px] xl:w-[320px] xl:h-[320px] 2xl:w-[360px] 2xl:h-[360px]">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Outer ring (background) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="4"
        />
        {/* Progress ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {/* Minute ticks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const isHour = i % 5 === 0;
          const innerR = isHour ? 78 : 84;
          const outerR = 88;
          const x1 = 100 + innerR * Math.cos(angle);
          const y1 = 100 + innerR * Math.sin(angle);
          const x2 = 100 + outerR * Math.cos(angle);
          const y2 = 100 + outerR * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isHour ? 'var(--text-primary)' : 'var(--text-muted)'}
              strokeWidth={isHour ? 2 : 1}
              opacity={isHour ? 1 : 0.5}
            />
          );
        })}
        {/* Hour numbers */}
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
          const angle = ((num % 12) * 30 - 90) * (Math.PI / 180);
          const r = 68;
          const x = 100 + r * Math.cos(angle);
          const y = 100 + r * Math.sin(angle);
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text-secondary)"
              fontSize="11"
              fontFamily="Manrope, sans-serif"
              fontWeight={num === 12 ? '700' : '400'}
            >
              {num}
            </text>
          );
        })}
        {/* Hour hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 40 * Math.cos((hourAngle - 90) * (Math.PI / 180))}
          y2={100 + 40 * Math.sin((hourAngle - 90) * (Math.PI / 180))}
          stroke="var(--text-primary)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Minute hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 60 * Math.cos((minuteAngle - 90) * (Math.PI / 180))}
          y2={100 + 60 * Math.sin((minuteAngle - 90) * (Math.PI / 180))}
          stroke="var(--text-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Second hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 70 * Math.cos((secondAngle - 90) * (Math.PI / 180))}
          y2={100 + 70 * Math.sin((secondAngle - 90) * (Math.PI / 180))}
          stroke="var(--color-brand)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx="100" cy="100" r="4" fill="var(--color-brand)" />
      </svg>
    </div>
  );
}

export const TimerDisplay = memo(function TimerDisplay({
  remainingSeconds,
  totalSeconds,
  timerStyle = 'digital',
  className,
}: TimerDisplayProps) {
  if (timerStyle === 'clock_numeric') {
    const formatted = formatMMSS(remainingSeconds);
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <ClockFace remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} />
        <div className="font-display font-bold italic text-text-base text-2xl sm:text-3xl md:text-4xl tabular-nums">
          {formatted}
        </div>
      </div>
    );
  }

  if (timerStyle === 'analog') {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <AnalogTimerFace remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} />
      </div>
    );
  }

  const formatted = formatMMSS(remainingSeconds);
  const [mm, ss] = formatted.split(':');

  return (
    <div
      className={cn(
        'flex items-center font-display font-black italic tabular-nums select-none',
        'text-[64px] sm:text-[80px] md:text-[100px] lg:text-[120px] xl:text-[140px] 2xl:text-[160px] leading-none',
        className
      )}
    >
      <span className="text-[--text-primary]">{mm}</span>
      <span className="text-[--color-brand] mx-2 lg:mx-4">:</span>
      <span className="text-[--text-primary]">{ss}</span>
    </div>
  );
});
