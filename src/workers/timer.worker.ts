// Timer Worker — sends 'tick' every 1 000 ms
let intervalId: ReturnType<typeof setInterval> | null = null;
let clockIntervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent<'start' | 'stop' | 'clock_start' | 'clock_stop'>) => {
  if (e.data === 'start') {
    if (intervalId) return;
    intervalId = setInterval(() => self.postMessage('tick'), 1000);
  }
  if (e.data === 'stop') {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }
  if (e.data === 'clock_start' && !clockIntervalId) {
    self.postMessage({ type: 'clock', now: Date.now() });
    clockIntervalId = setInterval(() => self.postMessage({ type: 'clock', now: Date.now() }), 1000);
  }
  if (e.data === 'clock_stop') {
    if (clockIntervalId) clearInterval(clockIntervalId);
    clockIntervalId = null;
  }
};
