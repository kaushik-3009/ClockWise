// Ambient background sound playback from real audio files in public/sounds/.
// Drop rain.mp3, white-noise.mp3, brown-noise.mp3, cafe.mp3 into public/sounds/
// (see public/sounds/README.md for exact filenames/format).
export type AmbientSoundType = 'off' | 'rain' | 'white' | 'brown' | 'cafe';

const SOUND_FILES: Record<Exclude<AmbientSoundType, 'off'>, string> = {
  rain: '/sounds/rain.mp3',
  white: '/sounds/white-noise.mp3',
  brown: '/sounds/brown-noise.mp3',
  cafe: '/sounds/cafe.mp3',
};

let currentAudio: HTMLAudioElement | null = null;
let currentType: AmbientSoundType | null = null;

// Shared AudioContext used by lib/sounds.ts for short synthesized effects (click, chime, etc.)
// — iOS Safari limits the number of live AudioContexts, so effects and ambient share this one.
let sharedCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume();
  }
  return sharedCtx;
}

export function playAmbient(type: AmbientSoundType, volume: number): void {
  if (type === 'off') {
    stopAmbient();
    return;
  }

  // Same track already playing/paused — just adjust volume and resume, no restart.
  if (currentType === type && currentAudio) {
    currentAudio.volume = volume;
    if (currentAudio.paused) {
      currentAudio.play().catch(() => {});
    }
    return;
  }

  stopAmbient();

  const audio = new Audio(SOUND_FILES[type]);
  audio.loop = true;
  audio.volume = volume;
  audio.play().catch((err) => {
    console.warn(`[ambient] Could not play "${type}" — is public/sounds/${type} present?`, err);
  });

  currentAudio = audio;
  currentType = type;
}

export function stopAmbient(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  currentType = null;
}

export function setAmbientVolume(volume: number): void {
  if (currentAudio) {
    currentAudio.volume = volume;
  }
}
