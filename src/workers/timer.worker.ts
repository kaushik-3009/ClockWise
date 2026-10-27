// Heartbeat worker: posts 'tick' once a second while started. The timer itself is
// computed from wall-clock timestamps, so this only decides *when* to re-check —
// a worker interval keeps firing in background desktop tabs, where main-thread
// timers are throttled to once a minute.
let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent<'start' | 'stop'>) => {
  if (e.data === 'start' && intervalId === null) {
    intervalId = setInterval(() => self.postMessage('tick'), 1000);
  } else if (e.data === 'stop' && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
