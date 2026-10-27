import { useEffect, useRef, useState } from 'react';
import {
  ChevronUp,
  CloudRain,
  Coffee,
  Music2,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Waves,
  Wind,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useTimerStore } from '@/stores/timerStore';
import { useLofiStore, LOFI_STATIONS } from '@/stores/lofiStore';
import { playAmbient, setAmbientVolume, stopAmbient } from '@/lib/ambient';
import { cn } from '@/lib/cn';
import type { TimerSettings } from '@/types';

type Ambient = Exclude<TimerSettings['ambient_sound'], 'off'>;

const AMBIENT_OPTIONS: { value: Ambient; label: string; icon: typeof CloudRain }[] = [
  { value: 'rain', label: 'Rain', icon: CloudRain },
  { value: 'cafe', label: 'Cafe murmur', icon: Coffee },
  { value: 'white', label: 'White noise', icon: Wind },
  { value: 'brown', label: 'Brown noise', icon: Waves },
];

// Bar heights (px) + stagger delays for the rhythm visualizer.
const RHYTHM_BARS = [
  { height: 6, delay: '0s' },
  { height: 12, delay: '0.18s' },
  { height: 9, delay: '0.36s' },
  { height: 13, delay: '0.54s' },
  { height: 7, delay: '0.27s' },
];

function RhythmVisualizer({ active, className = '' }: { active: boolean; className?: string }) {
  return (
    <div className={`inline-flex h-[13px] items-end gap-[3px] ${className}`} aria-hidden="true">
      {RHYTHM_BARS.map((bar, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-brand ${active ? 'rhythm-bar' : ''}`}
          style={{
            height: active ? bar.height : 4,
            animationDelay: bar.delay,
            opacity: active ? undefined : 0.35,
          }}
        />
      ))}
    </div>
  );
}

const iconButton =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-sub transition-colors hover:bg-bg-secondary hover:text-text-base';

export function MusicPlayer() {
  const { settings, saveSettings } = useSettings();
  const timerRunning = useTimerStore((s) => s.status === 'running');
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'lofi' | 'ambient'>('lofi');
  const [ambientVolume, setLocalVolume] = useState(settings.ambient_volume);
  const saveTimer = useRef<number | null>(null);
  const previewTimer = useRef<number | null>(null);

  const { stationIdx, playing, loading, volume, error, toggle, changeStation, setVolume } =
    useLofiStore();

  useEffect(() => setLocalVolume(settings.ambient_volume), [settings.ambient_volume]);
  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
    },
    []
  );

  const station = LOFI_STATIONS[stationIdx];
  const isAmbientOn = settings.ambient_sound !== 'off';
  const ambientAudible = isAmbientOn && timerRunning;
  const isActive = playing || ambientAudible;

  const selectAmbient = (value: TimerSettings['ambient_sound']) => {
    saveSettings({ ambient_sound: value });
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    if (value === 'off' || timerRunning) return;
    // Soundscapes play while the timer runs; give a short preview otherwise.
    // Started after the engine has reacted to the settings change.
    previewTimer.current = window.setTimeout(() => {
      playAmbient(value, ambientVolume);
      previewTimer.current = window.setTimeout(() => {
        if (useTimerStore.getState().status !== 'running') stopAmbient();
      }, 4000);
    }, 50);
  };

  const changeAmbientVolume = (vol: number) => {
    setLocalVolume(vol);
    setAmbientVolume(vol);
    // Save once the user stops dragging rather than on every input event.
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveSettings({ ambient_volume: vol }), 500);
  };

  const ambientLabel = AMBIENT_OPTIONS.find((o) => o.value === settings.ambient_sound)?.label;
  const title = tab === 'lofi' || !isAmbientOn ? station.name : ambientLabel;
  const subtitle =
    tab === 'lofi' || !isAmbientOn
      ? error
        ? 'Not available right now'
        : `${station.sub} · live stream`
      : timerRunning
        ? 'Soundscape · playing'
        : 'Soundscape · plays while the timer runs';

  return (
    <div className="w-full max-w-[740px]">
      <div className="animate-[dock-enter_350ms_ease_both] overflow-hidden rounded-lg border border-border-base bg-bg-card shadow-elevated">
        <div className="flex items-center gap-1 py-1.5 pl-2 pr-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="music-panel"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 pl-1 pr-2 text-left"
          >
            <span
              className={cn(
                'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                isActive ? 'bg-brand-solid text-white' : 'bg-bg-secondary text-text-muted'
              )}
            >
              {isActive && (
                <span className="absolute inset-0 animate-[soft-pulse_2.2s_ease-in-out_infinite] rounded-full bg-brand opacity-40" />
              )}
              <Music2 className="relative h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-text-base">{title}</span>
                {isActive && <RhythmVisualizer active className="shrink-0" />}
              </span>
              <span className="block truncate text-xs text-text-muted">{subtitle}</span>
            </span>
            <ChevronUp
              className={cn(
                'h-4 w-4 shrink-0 text-text-muted transition-transform',
                open && 'rotate-180'
              )}
              aria-hidden="true"
            />
            <span className="sr-only">{open ? 'Hide sound options' : 'Show sound options'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              changeStation((stationIdx - 1 + LOFI_STATIONS.length) % LOFI_STATIONS.length)
            }
            className={cn(iconButton, 'hidden sm:flex')}
            aria-label="Previous station"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-text-base text-bg-card shadow-sm disabled:opacity-60"
            aria-label={playing ? 'Pause music' : 'Play music'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => changeStation((stationIdx + 1) % LOFI_STATIONS.length)}
            className={cn(iconButton, 'hidden sm:flex')}
            aria-label="Next station"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div
          id="music-panel"
          hidden={!open}
          className="themed-scroll max-h-[45dvh] overflow-y-auto border-t border-border-base p-3 sm:p-4"
        >
          <div
            role="tablist"
            aria-label="Sound source"
            className="mb-3 flex rounded-full bg-bg-secondary p-0.5"
          >
            {(
              [
                ['lofi', 'Lofi radio'],
                ['ambient', 'Soundscapes'],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  'h-9 flex-1 rounded-full text-sm font-medium transition-colors',
                  tab === t ? 'bg-brand-solid text-white' : 'text-text-sub hover:text-text-base'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'lofi' ? (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 text-xs text-text-sub">
                Volume
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="h-6 w-full accent-brand"
                />
              </label>
              {error && (
                <p role="alert" className="text-xs text-error-text">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {LOFI_STATIONS.map((s, idx) => {
                  const isCurrent = idx === stationIdx;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => changeStation(idx)}
                      aria-current={isCurrent}
                      className={cn(
                        'flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors',
                        isCurrent
                          ? 'bg-brand-alpha font-medium text-brand-text'
                          : 'text-text-base hover:bg-bg-secondary'
                      )}
                    >
                      {isCurrent && playing ? (
                        <RhythmVisualizer active className="w-4 shrink-0" />
                      ) : (
                        <Radio className="h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>{s.name}</span>
                      <span className="ml-auto text-xs text-text-muted">{s.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-text-muted">
                Soundscapes play while the timer is running and stop when you pause.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectAmbient('off')}
                  aria-pressed={!isAmbientOn}
                  className={cn(
                    'col-span-2 min-h-11 rounded-lg border text-sm font-medium transition-colors',
                    !isAmbientOn
                      ? 'border-brand bg-brand-alpha text-brand-text'
                      : 'border-border-base text-text-sub hover:bg-bg-secondary'
                  )}
                >
                  Off
                </button>
                {AMBIENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const on = settings.ambient_sound === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectAmbient(opt.value)}
                      aria-pressed={on}
                      className={cn(
                        'flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
                        on
                          ? 'border-brand bg-brand-alpha text-brand-text'
                          : 'border-border-base text-text-base hover:bg-bg-secondary'
                      )}
                    >
                      {on && ambientAudible ? (
                        <RhythmVisualizer active className="w-4 shrink-0" />
                      ) : (
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {isAmbientOn && (
                <label className="flex items-center gap-3 text-xs text-text-sub">
                  Volume
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={ambientVolume}
                    onChange={(e) => changeAmbientVolume(Number(e.target.value))}
                    className="h-6 w-full accent-brand"
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
