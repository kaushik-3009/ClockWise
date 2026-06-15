import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTimer } from '../useTimer';
import { useTimerStore } from '@/stores/timerStore';
import { db } from '@/db/schema';

async function resetDb() {
  await db.delete();
  await db.open();
}

describe('useTimer integration', () => {
  beforeEach(async () => {
    await resetDb();
    useTimerStore.setState({
      status: 'idle',
      phase_type: 'focus',
      phase_number: 1,
      total_phases: 8,
      remaining_seconds: 1500,
      elapsed_seconds: 0,
      active_project_id: undefined,
      active_task_id: undefined,
      active_session_id: undefined,
      settings: {
        focus_minutes: 25,
        short_break_minutes: 5,
        long_break_minutes: 15,
        phases_per_session: 8,
        long_break_after_n: 4,
        auto_start: false,
        sound_enabled: true,
        notifications_enabled: false,
        timer_style: 'digital',
        accent_color: '#E8521A',
        ambient_sound: 'off',
        ambient_volume: 0.3,
        weekly_goal_hours: 20,
        warn_before_seconds: 60,
      },
    });
  });

  it('play transitions to running', async () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.status).toBe('idle');
    await act(async () => result.current.play());
    expect(useTimerStore.getState().status).toBe('running');
  });

  it('pause transitions running to paused', async () => {
    const { result } = renderHook(() => useTimer());
    await act(async () => result.current.play());
    await act(async () => result.current.pause());
    expect(useTimerStore.getState().status).toBe('paused');
  });

  it('reset returns to idle', async () => {
    const { result } = renderHook(() => useTimer());
    await act(async () => result.current.play());
    await act(async () => result.current.reset());
    expect(useTimerStore.getState().status).toBe('idle');
    expect(useTimerStore.getState().remaining_seconds).toBe(1500);
  });

  it('creates a session in DB when play is called', async () => {
    const { result } = renderHook(() => useTimer());
    await act(async () => result.current.play());

    await waitFor(
      async () => {
        const count = await db.sessions.count();
        return count > 0;
      },
      { timeout: 2000 }
    );

    const sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].type).toBe('focus');
    expect(sessions[0].completed).toBe(false);
  });

  it('completes session and advances phase when timer hits 0', async () => {
    const { result } = renderHook(() => useTimer());
    await act(async () => result.current.play());

    // Wait for session creation and active_session_id to be set
    await waitFor(async () => (await db.sessions.count()) > 0, { timeout: 2000 });
    await waitFor(() => useTimerStore.getState().active_session_id !== undefined, {
      timeout: 2000,
    });

    // Simulate tick to completion
    await act(async () => {
      useTimerStore.setState({ remaining_seconds: 1 });
      useTimerStore.getState().tick();
    });

    // Wait for phase_complete to be handled
    await waitFor(() => useTimerStore.getState().status !== 'phase_complete', { timeout: 2000 });

    const sessions = await db.sessions.toArray();
    expect(sessions[0].completed).toBe(true);
    expect(useTimerStore.getState().phase_number).toBe(2);
  });

  it('setContext updates active project/task', async () => {
    const { result } = renderHook(() => useTimer());
    await act(async () => result.current.setContext('proj-1', 'task-1'));
    const state = useTimerStore.getState();
    expect(state.active_project_id).toBe('proj-1');
    expect(state.active_task_id).toBe('task-1');
  });

  it('skip on focus phase writes session as completed', async () => {
    const { result } = renderHook(() => useTimer());
    await act(async () => result.current.play());

    await waitFor(async () => (await db.sessions.count()) > 0, { timeout: 2000 });
    await waitFor(() => useTimerStore.getState().active_session_id !== undefined, {
      timeout: 2000,
    });

    // Simulate some elapsed time
    await act(async () => {
      useTimerStore.setState({ elapsed_seconds: 600 });
      result.current.skip();
    });

    await waitFor(() => useTimerStore.getState().status !== 'running', { timeout: 2000 });

    const sessions = await db.sessions.toArray();
    expect(sessions[0].completed).toBe(true);
    expect(sessions[0].duration_seconds).toBe(600);
  });

  it('skip on break phase writes session as incomplete', async () => {
    const { result } = renderHook(() => useTimer());

    // Set up a short break phase
    await act(async () => {
      useTimerStore.setState({
        phase_type: 'short_break',
        remaining_seconds: 300,
        elapsed_seconds: 0,
      });
    });

    await act(async () => result.current.play());

    await waitFor(async () => (await db.sessions.count()) > 0, { timeout: 2000 });
    await waitFor(() => useTimerStore.getState().active_session_id !== undefined, {
      timeout: 2000,
    });

    await act(async () => {
      useTimerStore.setState({ elapsed_seconds: 120 });
      result.current.skip();
    });

    await waitFor(() => useTimerStore.getState().status !== 'running', { timeout: 2000 });

    const sessions = await db.sessions.toArray();
    expect(sessions[0].completed).toBe(false);
    expect(sessions[0].duration_seconds).toBe(120);
  });
});
