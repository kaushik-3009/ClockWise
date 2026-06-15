import { describe, it, expect } from 'vitest';
import { formatMMSS, formatHHMMSS, formatDuration, formatDurationShort } from '../time';

describe('formatMMSS', () => {
  it('formats zero', () => {
    expect(formatMMSS(0)).toBe('00:00');
  });

  it('formats single digit minutes and seconds', () => {
    expect(formatMMSS(65)).toBe('01:05');
  });

  it('formats double digits', () => {
    expect(formatMMSS(1500)).toBe('25:00');
  });

  it('formats over one hour', () => {
    expect(formatMMSS(3665)).toBe('61:05');
  });
});

describe('formatHHMMSS', () => {
  it('formats zero', () => {
    expect(formatHHMMSS(0)).toBe('00:00:00');
  });

  it('formats under one hour', () => {
    expect(formatHHMMSS(1500)).toBe('00:25:00');
  });

  it('formats exactly one hour', () => {
    expect(formatHHMMSS(3600)).toBe('01:00:00');
  });

  it('formats over one hour', () => {
    expect(formatHHMMSS(3665)).toBe('01:01:05');
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(1500)).toBe('25m');
  });

  it('formats hours only', () => {
    expect(formatDuration(7200)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(7500)).toBe('2h 5m');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('formatDurationShort', () => {
  it('formats zero', () => {
    expect(formatDurationShort(0)).toBe('00:00:00');
  });

  it('formats under one hour', () => {
    expect(formatDurationShort(1500)).toBe('00:25:00');
  });

  it('formats over one hour', () => {
    expect(formatDurationShort(3665)).toBe('01:01:05');
  });
});
