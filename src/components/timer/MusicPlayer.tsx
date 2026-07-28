import { useEffect, useRef, useState } from 'react';
import {
  ChevronUp,
  Cloud,
  Coffee,
  Flame,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  TreePine,
  X,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { playAmbient, stopAmbient, setAmbientVolume } from '@/lib/ambient';
import { YouTubeAudioPlayer } from '@/lib/youtubeAudio';
import type { TimerSettings } from '@/types';

// Known long-running lofi/chill livestreams (verified live as of writing).
// Swap IDs here if a stream ever goes offline.
const LOFI_STATIONS = [
  { id: 'jfKfPfyJRdk', name: 'Lofi Beats', sub: 'Lofi Girl · beats to relax/study to' },
  { id: '5yx6BWlEVcY', name: 'Jazz Hop', sub: 'Chillhop Radio · jazzy & lofi hip hop' },
  { id: '4xDzrJKXOOY', name: 'Synthwave', sub: 'Lofi Girl · synthwave radio' },
  { id: '7NOSDKb0HlU', name: 'Study Beats', sub: 'Chillhop Radio · beats to study/relax to' },
] as const;

const AMBIENT_OPTIONS: {
  value: Exclude<TimerSettings['ambient_sound'], 'off'>;
  label: string;
  icon: typeof Cloud;
}[] = [
  { value: 'rain', label: 'Rain', icon: Cloud },
  { value: 'cafe', label: 'Cafe', icon: Coffee },
  { value: 'white', label: 'White Noise', icon: TreePine },
  { value: 'brown', label: 'Brown Noise', icon: Flame },
];

// Bar heights (px) + stagger delays for the rhythm visualizer — hand-tuned
// so it doesn't look like a perfectly uniform metronome.
const RHYTHM_BARS = [
  { height: 6, delay: '0s' },
  { height: 12, delay: '0.18s' },
  { height: 9, delay: '0.36s' },
  { height: 13, delay: '0.54s' },
  { height: 7, delay: '0.27s' },
];

function RhythmVisualizer({ active, className = '' }: { active: boolean; className?: string }) {
  return (
    <div className={`inline-flex items-end gap-[3px] h-[13px] ${className}`} aria-hidden="true">
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

export function MusicPlayer() {
  const { settings, saveSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'lofi' | 'ambient'>('lofi');

  const [lofiStationIdx, setLofiStationIdx] = useState(0);
  const [lofiPlaying, setLofiPlaying] = useState(false);
  const [lofiLoading, setLofiLoading] = useState(false);
  const [lofiVolume, setLofiVolume] = useState(60);
  const [lofiError, setLofiError] = useState(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubeAudioPlayer | null>(null);
  const initializedRef = useRef(false);

  const station = LOFI_STATIONS[lofiStationIdx];
  const isAmbientOn = settings.ambient_sound !== 'off';
  const isActive = lofiPlaying || isAmbientOn;

  const ensurePlayer = () => {
    if (!playerRef.current && mountRef.current) {
      playerRef.current = new YouTubeAudioPlayer(mountRef.current, () => setLofiError(true));
    }
    return playerRef.current;
  };

  const toggleLofiPlay = async () => {
    setLofiError(false);
    const player = ensurePlayer();
    if (!player) return;
    if (lofiPlaying) {
      player.pause();
      setLofiPlaying(false);
    } else {
      try {
        setLofiLoading(true);
        if (!initializedRef.current) {
          await player.init(station.id, lofiVolume);
          initializedRef.current = true;
        } else {
          player.play();
        }
        setLofiPlaying(true);
      } catch {
        player.destroy();
        playerRef.current = null;
        initializedRef.current = false;
        setLofiError(true);
      } finally {
        setLofiLoading(false);
      }
    }
  };

  const changeStation = async (idx: number) => {
    setLofiStationIdx(idx);
    setLofiError(false);
    const player = ensurePlayer();
    if (!player) return;
    try {
      setLofiLoading(true);
      if (initializedRef.current) {
        player.loadVideo(LOFI_STATIONS[idx].id);
      } else {
        await player.init(LOFI_STATIONS[idx].id, lofiVolume);
        initializedRef.current = true;
      }
      setLofiPlaying(true);
    } catch {
      player.destroy();
      playerRef.current = null;
      initializedRef.current = false;
      setLofiError(true);
    } finally {
      setLofiLoading(false);
    }
  };

  useEffect(() => {
    playerRef.current?.setVolume(lofiVolume);
  }, [lofiVolume]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      stopAmbient();
    };
  }, []);

  const selectAmbient = (value: TimerSettings['ambient_sound']) => {
    saveSettings({ ambient_sound: value });
    if (value === 'off') {
      stopAmbient();
    } else {
      playAmbient(value, settings.ambient_volume);
    }
  };

  const changeAmbientVolume = (vol: number) => {
    saveSettings({ ambient_volume: vol });
    setAmbientVolume(vol);
  };

  const nowPlayingLabel =
    tab === 'lofi'
      ? station.name
      : isAmbientOn
        ? AMBIENT_OPTIONS.find((o) => o.value === settings.ambient_sound)?.label
        : 'Choose a soundscape';
  const nowPlayingSub =
    tab === 'lofi' ? station.sub : isAmbientOn ? 'Ambient · playing' : 'Pick a background sound';

  return (
    <div className="w-[min(740px,calc(100vw-32px))]">
      {/* Mount point for the YouTube iframe player — kept at 1x1px off-screen rather than
          0x0/display:none, since browsers can throttle or suspend playback in fully
          collapsed/clipped/hidden elements. */}
      <div
        ref={mountRef}
        className="fixed overflow-hidden opacity-0 pointer-events-none"
        style={{ width: 1, height: 1, left: -9999, top: -9999 }}
        aria-hidden="true"
      />

      <div className="animate-[dock-enter_350ms_ease_both] overflow-hidden rounded-lg border border-border-base bg-bg-card shadow-elevated">
        {/* Collapsed dock row — always visible */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen((v) => !v);
            }
          }}
          aria-expanded={open}
          className="w-full flex items-center gap-2.5 pl-3 pr-2 py-2.5 text-left"
        >
          <div
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isActive ? 'bg-brand text-white' : 'bg-bg-secondary text-text-muted'
            }`}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-full bg-brand opacity-40 animate-[soft-pulse_2.2s_ease-in-out_infinite]" />
            )}
            <Music2 className="relative h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[12.5px] font-semibold text-text-base truncate">
                {nowPlayingLabel}
              </p>
              {isActive && <RhythmVisualizer active className="shrink-0" />}
            </div>
            <p className="truncate text-[11px] text-text-muted">{nowPlayingSub}</p>
          </div>

          {tab === 'lofi' && (
            <div
              className="flex items-center gap-1.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() =>
                  changeStation((lofiStationIdx - 1 + LOFI_STATIONS.length) % LOFI_STATIONS.length)
                }
                className="hidden h-7 w-7 items-center justify-center rounded-full text-text-sub transition-colors hover:bg-bg-secondary hover:text-text-base sm:flex"
                aria-label="Previous station"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleLofiPlay}
                className="w-8 h-8 rounded-full bg-text-base text-bg-card flex items-center justify-center shadow-sm"
                aria-label={lofiPlaying ? 'Pause' : 'Play'}
                disabled={lofiLoading}
              >
                {lofiPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => changeStation((lofiStationIdx + 1) % LOFI_STATIONS.length)}
                className="hidden h-7 w-7 items-center justify-center rounded-full text-text-sub transition-colors hover:bg-bg-secondary hover:text-text-base sm:flex"
                aria-label="Next station"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted shrink-0">
            {open ? <X className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Expanded panel */}
        <div
          className="overflow-hidden transition-[max-height] duration-200 ease-out border-t border-border-base"
          style={{ maxHeight: open ? 380 : 0, borderTopWidth: open ? 1 : 0 }}
        >
          <div className="p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-text-base">Soundscape</p>
                <p className="text-[11px] text-text-muted">Set the tone for this focus session</p>
              </div>
              <RhythmVisualizer active={isActive} />
            </div>
            <div className="flex bg-bg-secondary rounded-full p-0.5 mb-3">
              {(['lofi', 'ambient'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                    tab === t ? 'bg-brand text-white' : 'text-text-sub hover:text-text-base'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'lofi' ? (
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={lofiVolume}
                  onChange={(e) => setLofiVolume(Number(e.target.value))}
                  className="w-full accent-brand h-1"
                  aria-label="Lofi volume"
                />
                {lofiError && (
                  <p className="text-[11px] text-error">
                    Couldn't load that stream — try another station.
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {LOFI_STATIONS.map((s, idx) => {
                    const isCurrent = idx === lofiStationIdx;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => changeStation(idx)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] transition-colors ${
                          isCurrent
                            ? 'bg-brand-alpha text-brand font-medium'
                            : 'text-text-base hover:bg-bg-secondary'
                        }`}
                      >
                        {isCurrent && lofiPlaying ? (
                          <RhythmVisualizer active className="w-3.5 shrink-0" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectAmbient('off')}
                  className={`col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    !isAmbientOn
                      ? 'border-brand bg-brand-alpha text-brand'
                      : 'border-border-base text-text-sub hover:bg-bg-secondary'
                  }`}
                >
                  Off
                </button>
                {AMBIENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const on = settings.ambient_sound === opt.value;
                  return (
                    <div
                      key={opt.value}
                      className={`border rounded-lg p-2.5 cursor-pointer transition-colors ${
                        on ? 'border-brand' : 'border-border-base'
                      }`}
                      onClick={() => selectAmbient(opt.value)}
                    >
                      <div className="flex items-center gap-1.5">
                        {on ? (
                          <RhythmVisualizer active className="w-3.5 shrink-0" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 text-text-sub" />
                        )}
                        <span className="text-xs font-medium text-text-base">{opt.label}</span>
                      </div>
                      {on && (
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={settings.ambient_volume}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => changeAmbientVolume(Number(e.target.value))}
                          className="w-full mt-2 accent-brand h-1"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
