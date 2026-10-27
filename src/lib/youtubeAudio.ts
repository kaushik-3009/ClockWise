// Minimal wrapper around the YouTube IFrame Player API, used to stream lofi
// radio livestreams as a background audio source. The API script is only
// injected the first time a caller actually needs to play something, so it
// never adds weight to the initial page load.
type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve, reject) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    // Blocked by a network filter/ad blocker: fail fast and allow a retry later.
    script.onerror = () => {
      script.remove();
      apiLoadPromise = null;
      reject(new Error('Could not load the YouTube player.'));
    };
    document.head.appendChild(script);
  });

  return apiLoadPromise;
}

export class YouTubeAudioPlayer {
  private container: HTMLElement;
  private player: YTPlayer | null = null;
  private pendingVideoId: string | null = null;
  private pendingVolume = 60;
  private onError?: (videoId: string) => void;

  constructor(container: HTMLElement, onError?: (videoId: string) => void) {
    this.container = container;
    this.onError = onError;
  }

  async init(videoId: string, volume: number): Promise<void> {
    this.pendingVideoId = videoId;
    this.pendingVolume = volume;
    await loadYouTubeApi();
    if (this.player) return;

    const mount = document.createElement('div');
    this.container.appendChild(mount);

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('Timed out while loading YouTube audio.'));
      }, 12_000);
      this.player = new window.YT!.Player(mount, {
        videoId,
        // `origin` is required in some browsers for postMessage control (play/pause/volume)
        // to work at all — without it the player can silently ignore API calls.
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: ({ target }) => {
            window.clearTimeout(timeout);
            target.setVolume(this.pendingVolume);
            target.playVideo();
            resolve();
          },
          onError: () => {
            window.clearTimeout(timeout);
            if (this.pendingVideoId) this.onError?.(this.pendingVideoId);
            reject(new Error('YouTube audio could not be loaded.'));
          },
        },
      });
    });
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  loadVideo(videoId: string): void {
    this.pendingVideoId = videoId;
    if (this.player) {
      this.player.loadVideoById(videoId);
    } else {
      this.init(videoId, this.pendingVolume);
    }
  }

  setVolume(volume0to100: number): void {
    this.pendingVolume = volume0to100;
    this.player?.setVolume(volume0to100);
  }

  destroy(): void {
    this.player?.destroy();
    this.player = null;
  }
}
