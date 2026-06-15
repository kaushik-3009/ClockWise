import 'fake-indexeddb/auto';

class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((err: ErrorEvent) => void) | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Worker created but not started
  }

  postMessage(msg: unknown) {
    if (msg === 'start') {
      if (this.intervalId) return;
      this.intervalId = setInterval(() => {
        this.onmessage?.(new MessageEvent('message', { data: 'tick' }));
      }, 1000);
    } else if (msg === 'stop') {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  terminate() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// @ts-expect-error jsdom doesn't have Worker
global.Worker = MockWorker;

// @ts-expect-error jsdom doesn't have AudioContext
global.AudioContext = class MockAudioContext {
  currentTime = 0;
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 0 },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }
  get destination() {
    return {};
  }
};
