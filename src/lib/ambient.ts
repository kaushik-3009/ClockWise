// Ambient background noise generator using Web Audio API
let ambientCtx: AudioContext | null = null;
let currentNodes: AudioNode[] = [];
let currentGain: GainNode | null = null;

function getAmbientContext(): AudioContext {
  if (!ambientCtx) {
    ambientCtx = new AudioContext();
  }
  if (ambientCtx.state === 'suspended') {
    ambientCtx.resume();
  }
  return ambientCtx;
}

function stopCurrent() {
  currentNodes.forEach((n) => {
    try {
      n.disconnect();
    } catch {
      // already disconnected
    }
  });
  currentNodes = [];
  currentGain = null;
}

function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  return buffer;
}

function playNoiseBuffer(ctx: AudioContext, buffer: AudioBuffer, volume: number): void {
  stopCurrent();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);

  source.start();
  currentNodes = [source, gain];
  currentGain = gain;
}

export function playAmbient(type: 'rain' | 'white' | 'brown' | 'cafe', volume: number): void {
  const ctx = getAmbientContext();

  if (type === 'rain') {
    // Pink noise + lowpass filter + LFO modulation
    const buffer = createPinkNoiseBuffer(ctx);
    stopCurrent();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    currentNodes = [source, filter, gain, lfo, lfoGain];
    currentGain = gain;
    return;
  }

  if (type === 'white') {
    const buffer = createWhiteNoiseBuffer(ctx);
    playNoiseBuffer(ctx, buffer, volume);
    return;
  }

  if (type === 'brown') {
    const buffer = createBrownNoiseBuffer(ctx);
    playNoiseBuffer(ctx, buffer, volume);
    return;
  }

  if (type === 'cafe') {
    // Low-volume brown noise + quiet white noise + subtle sine waves
    stopCurrent();

    const brown = createBrownNoiseBuffer(ctx);
    const brownSource = ctx.createBufferSource();
    brownSource.buffer = brown;
    brownSource.loop = true;

    const brownFilter = ctx.createBiquadFilter();
    brownFilter.type = 'lowpass';
    brownFilter.frequency.value = 400;

    const brownGain = ctx.createGain();
    brownGain.gain.value = volume * 0.6;

    const white = createWhiteNoiseBuffer(ctx);
    const whiteSource = ctx.createBufferSource();
    whiteSource.buffer = white;
    whiteSource.loop = true;

    const whiteFilter = ctx.createBiquadFilter();
    whiteFilter.type = 'highpass';
    whiteFilter.frequency.value = 2000;

    const whiteGain = ctx.createGain();
    whiteGain.gain.value = volume * 0.15;

    // Subtle room tone
    const tone = ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.value = 220;
    const toneGain = ctx.createGain();
    toneGain.gain.value = volume * 0.05;
    tone.connect(toneGain);
    tone.start();

    brownSource.connect(brownFilter);
    brownFilter.connect(brownGain);
    brownGain.connect(ctx.destination);

    whiteSource.connect(whiteFilter);
    whiteFilter.connect(whiteGain);
    whiteGain.connect(ctx.destination);

    toneGain.connect(ctx.destination);

    brownSource.start();
    whiteSource.start();

    currentNodes = [
      brownSource,
      brownFilter,
      brownGain,
      whiteSource,
      whiteFilter,
      whiteGain,
      tone,
      toneGain,
    ];
    currentGain = brownGain;
  }
}

export function stopAmbient(): void {
  stopCurrent();
  if (ambientCtx) {
    ambientCtx.close().catch(() => {});
    ambientCtx = null;
  }
}

export function setAmbientVolume(volume: number): void {
  if (currentGain) {
    currentGain.gain.setTargetAtTime(volume, getAmbientContext().currentTime, 0.1);
  }
}
