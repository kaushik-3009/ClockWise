import { describe, it, expect, beforeEach } from 'vitest';
import { useTimerStore, DEFAULT_SETTINGS } from '../timerStore';

describe('timerStore', () => {
  beforeEach(() => {
    useTimerStore.setState({
      ...useTimerStore.getState(),
      status: 'idle',
      phase_type: 'focus',
      phase_number: 1,
      total_phases: DEFAULT_SETTINGS.phases_per_session,
      remaining_seconds: DEFAULT_SETTINGS.focus_minutes * 60,
      elapsed_seconds: 0,
      active_project_id: undefined,
      active_task_id: undefined,
      active_session_id: undefined,
      settings: DEFAULT_SETTINGS,
    });
  });

  it('starts with idle state', () => {
    const s = useTimerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.phase_number).toBe(1);
    expect(s.remaining_seconds).toBe(1500);
  });

  it('play transitions idle → running', () => {
    useTimerStore.getState().play();
    expect(useTimerStore.getState().status).toBe('running');
  });

  it('pause transitions running → paused', () => {
    useTimerStore.getState().play();
    useTimerStore.getState().pause();
    expect(useTimerStore.getState().status).toBe('paused');
  });

  it('tick decrements remaining and increments elapsed', () => {
    useTimerStore.getState().play();
    useTimerStore.getState().tick();
    const s = useTimerStore.getState();
    expect(s.remaining_seconds).toBe(1499);
    expect(s.elapsed_seconds).toBe(1);
  });

  it('tick at 1s left triggers phase_complete', () => {
    useTimerStore.setState({ remaining_seconds: 1 });
    useTimerStore.getState().play();
    useTimerStore.getState().tick();
    const s = useTimerStore.getState();
    expect(s.status).toBe('phase_complete');
    expect(s.remaining_seconds).toBe(0);
  });

  it('advancePhase moves to next phase', () => {
    useTimerStore.getState().play();
    useTimerStore.setState({ status: 'phase_complete' });
    useTimerStore.getState().advancePhase();
    const s = useTimerStore.getState();
    expect(s.phase_number).toBe(2);
    expect(s.phase_type).toBe('short_break');
    expect(s.remaining_seconds).toBe(300);
  });

  it('skip advances phase from running', () => {
    useTimerStore.getState().play();
    useTimerStore.getState().skip();
    const s = useTimerStore.getState();
    expect(s.phase_number).toBe(2);
    expect(s.phase_type).toBe('short_break');
  });

  it('reset returns to idle phase 1', () => {
    useTimerStore.setState({
      status: 'running',
      phase_number: 3,
      remaining_seconds: 100,
      elapsed_seconds: 50,
    });
    useTimerStore.getState().reset();
    const s = useTimerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.phase_number).toBe(1);
    expect(s.remaining_seconds).toBe(1500);
    expect(s.elapsed_seconds).toBe(0);
  });

  it('reset preserves active context', () => {
    useTimerStore.getState().setContext('proj-1', 'task-1');
    useTimerStore.getState().play();
    useTimerStore.getState().reset();
    const s = useTimerStore.getState();
    expect(s.active_project_id).toBe('proj-1');
    expect(s.active_task_id).toBe('task-1');
  });

  it('setSettings updates total_phases when idle', () => {
    useTimerStore.getState().setSettings({ phases_per_session: 4 });
    const s = useTimerStore.getState();
    expect(s.settings.phases_per_session).toBe(4);
    expect(s.total_phases).toBe(4);
  });

  it('session_complete after all phases', () => {
    useTimerStore.setState({
      phase_number: 8,
      status: 'phase_complete',
    });
    useTimerStore.getState().advancePhase();
    expect(useTimerStore.getState().status).toBe('session_complete');
  });
});
