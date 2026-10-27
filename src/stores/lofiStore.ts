import { create } from 'zustand';
import { YouTubeAudioPlayer } from '@/lib/youtubeAudio';

// Known long-running lofi/chill livestreams. Swap IDs here if a stream goes offline.
export const LOFI_STATIONS = [
  { id: 'jfKfPfyJRdk', name: 'Lofi Beats', sub: 'Lofi Girl' },
  { id: '5yx6BWlEVcY', name: 'Jazz Hop', sub: 'Chillhop Radio' },
  { id: '4xDzrJKXOOY', name: 'Synthwave', sub: 'Lofi Girl' },
  { id: '7NOSDKb0HlU', name: 'Study Beats', sub: 'Chillhop Radio' },
] as const;

interface LofiState {
  stationIdx: number;
  playing: boolean;
  loading: boolean;
  volume: number;
  error: string | null;
  toggle: () => Promise<void>;
  changeStation: (idx: number) => Promise<void>;
  setVolume: (volume: number) => void;
}

// The player and its hidden iframe live at module level, outside React, so the
// stream keeps playing when the Timer page unmounts (navigating to Stats etc.).
let player: YouTubeAudioPlayer | null = null;
let initialized = false;

function getPlayer(): YouTubeAudioPlayer {
  if (!player) {
    const mount = document.createElement('div');
    // 1x1px off-screen rather than display:none — browsers may suspend hidden players.
    mount.setAttribute('aria-hidden', 'true');
    mount.style.cssText =
      'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
    document.body.appendChild(mount);
    player = new YouTubeAudioPlayer(mount, () =>
      useLofiStore.setState({ error: "That stream isn't available — try another station." })
    );
  }
  return player;
}

function discardPlayer() {
  player?.destroy();
  player = null;
  initialized = false;
}

const FAILED = "Couldn't load music. Check your connection or try another station.";

export const useLofiStore = create<LofiState>((set, get) => ({
  stationIdx: 0,
  playing: false,
  loading: false,
  volume: 60,
  error: null,

  toggle: async () => {
    const { playing, stationIdx, volume } = get();
    set({ error: null });
    const p = getPlayer();
    if (playing) {
      p.pause();
      set({ playing: false });
      return;
    }
    try {
      set({ loading: true });
      if (!initialized) {
        await p.init(LOFI_STATIONS[stationIdx].id, volume);
        initialized = true;
      } else {
        p.play();
      }
      set({ playing: true });
    } catch {
      discardPlayer();
      set({ error: FAILED, playing: false });
    } finally {
      set({ loading: false });
    }
  },

  changeStation: async (idx) => {
    set({ stationIdx: idx, error: null });
    const p = getPlayer();
    try {
      set({ loading: true });
      if (initialized) p.loadVideo(LOFI_STATIONS[idx].id);
      else {
        await p.init(LOFI_STATIONS[idx].id, get().volume);
        initialized = true;
      }
      set({ playing: true });
    } catch {
      discardPlayer();
      set({ error: FAILED, playing: false });
    } finally {
      set({ loading: false });
    }
  },

  setVolume: (volume) => {
    set({ volume });
    player?.setVolume(volume);
  },
}));

/** Stop music entirely (used on sign-out). */
export function stopLofi(): void {
  discardPlayer();
  useLofiStore.setState({ playing: false, loading: false });
}
