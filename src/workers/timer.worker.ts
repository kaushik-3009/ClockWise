// Timer Worker — sends 'tick' every 1 000 ms
let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent<'start' | 'stop'>) => {
  if (e.data === 'start') {
    if (intervalId) return;
    intervalId = setInterval(() => self.postMessage('tick'), 1000);
  }
  if (e.data === 'stop') {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }
};
