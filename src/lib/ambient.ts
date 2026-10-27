// Shared Web Audio plumbing plus synthesized ambient soundscapes.
//
// The soundscapes are generated in code (no audio files to ship or 404), and
// volume goes through a GainNode — iOS ignores HTMLAudioElement.volume, but
// gain works everywhere.
export type AmbientSoundType = 'off' | 'rain' | 'white' | 'brown' | 'cafe';

let sharedCtx: AudioContext | null = null;

/** The one AudioContext for the app (iOS limits how many can exist). */
export function getSharedAudioContext(): AudioContext | null {
  try {
    if (!sharedCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      sharedCtx = new Ctor();
    }
    // iOS also uses a non-standard 'interrupted' state after calls/backgrounding.
    if (sharedCtx.state !== 'running') sharedCtx.resume().catch(() => {});
    return sharedCtx;
  } catch {
    return null;
  }
}

/**
 * iOS only lets audio start inside a user gesture. Resume the context on the
 * first touch/click/key so later chimes (fired from timers) are audible.
 */
export function installAudioUnlock(): () => void {
  const unlock = () => {
    const ctx = getSharedAudioContext();
    if (ctx?.state === 'running') remove();
  };
  const events = ['pointerdown', 'touchend', 'keydown'] as const;
  const remove = () => events.forEach((e) => window.removeEventListener(e, unlock, true));
  events.forEach((e) => window.addEventListener(e, unlock, true));
  return remove;
}

function noiseBuffer(ctx: AudioContext, kind: 'white' | 'pink' | 'brown'): AudioBuffer {
  const seconds = 4;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === 'white') {
        data[i] = white * 0.35;
      } else if (kind === 'brown') {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        // Paul Kellet's pink-noise filter
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }
  }
  return buffer;
}

interface Playing {
  type: Exclude<AmbientSoundType, 'off'>;
  gain: GainNode;
  stop: () => void;
}

let current: Playing | null = null;

function build(ctx: AudioContext, type: Exclude<AmbientSoundType, 'off'>, gain: GainNode) {
  const sources: AudioScheduledSourceNode[] = [];
  const loop = (kind: 'white' | 'pink' | 'brown') => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, kind);
    src.loop = true;
    sources.push(src);
    return src;
  };

  if (type === 'white') {
    loop('white').connect(gain);
  } else if (type === 'brown') {
    loop('brown').connect(gain);
  } else if (type === 'rain') {
    // Pink noise through a band-pass, gently swelling — reads as steady rain.
    const src = loop('pink');
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1400;
    band.Q.value = 0.5;
    const swell = ctx.createGain();
    swell.gain.value = 0.85;
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.13;
    lfoDepth.gain.value = 0.15;
    lfo.connect(lfoDepth).connect(swell.gain);
    src.connect(band).connect(swell).connect(gain);
    sources.push(lfo);
  } else {
    // "Cafe": low, muffled murmur — brown noise through a low-pass with slow drift.
    const src = loop('brown');
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 650;
    const drift = ctx.createOscillator();
    const driftDepth = ctx.createGain();
    drift.frequency.value = 0.07;
    driftDepth.gain.value = 180;
    drift.connect(driftDepth).connect(low.frequency);
    src.connect(low).connect(gain);
    sources.push(drift);
  }

  sources.forEach((s) => s.start());
  return () =>
    sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    });
}

export function playAmbient(type: AmbientSoundType, volume: number): void {
  if (type === 'off') {
    stopAmbient();
    return;
  }
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  if (current?.type === type) {
    setAmbientVolume(volume);
    return;
  }
  stopAmbient();

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.6);
  gain.connect(ctx.destination);
  const stopSources = build(ctx, type, gain);
  current = {
    type,
    gain,
    stop: () => {
      // Short fade-out avoids a click.
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.25);
      window.setTimeout(() => {
        stopSources();
        gain.disconnect();
      }, 300);
    },
  };
}

export function stopAmbient(): void {
  current?.stop();
  current = null;
}

export function setAmbientVolume(volume: number): void {
  const ctx = sharedCtx;
  if (!current || !ctx) return;
  current.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
}

export function currentAmbient(): AmbientSoundType {
  return current?.type ?? 'off';
}
