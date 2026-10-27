import { describe, it, expect } from 'vitest';
import { validateExportData, escapeCSV, buildSessionsCSV } from '../exportImport';
import type { Session } from '@/types';

const base = { version: 1, exported_at: '2026-01-01T00:00:00.000Z' };

describe('validateExportData', () => {
  it('rejects unsupported versions', () => {
    expect(() => validateExportData({ ...base, version: 99 })).toThrow(
      'Unsupported export version'
    );
  });

  it('rejects non-object input', () => {
    expect(() => validateExportData('nope')).toThrow();
    expect(() => validateExportData([])).toThrow();
  });

  it('accepts its own export with missing optional fields (no undefined values)', () => {
    const { data, skipped } = validateExportData({
      ...base,
      projects: [
        { id: 'p1', user_id: 'x', name: 'P', color: 'blue', status: 'active', created_at: 1 },
      ],
      tasks: [{ id: 't1', user_id: 'x', name: 'T', is_completed: false, created_at: 1 }],
      sessions: [
        {
          id: 's1',
          user_id: 'x',
          type: 'focus',
          started_at: 1,
          duration_seconds: 60,
          phase_number: 1,
          completed: true,
        },
      ],
      streaks: [{ date: '2026-01-01' }], // legacy field, ignored
      settings: null,
    });
    expect(skipped).toBe(0);
    expect(data.projects).toHaveLength(1);
    expect(data.sessions[0].ended_at).toBeUndefined();
  });

  it('skips records with invalid ids or shapes instead of failing', () => {
    const { data, skipped } = validateExportData({
      ...base,
      projects: [
        { id: 'a/b', name: 'Slash', color: 'blue', status: 'active', created_at: 1 },
        { id: 'ok', name: 'Fine', color: 'rainbow', status: 'active', created_at: 1 },
        { id: 'noname', color: 'blue' },
      ],
      sessions: [{ id: 's', type: 'focus', started_at: Infinity }],
    });
    expect(data.projects.map((p) => p.id)).toEqual(['ok']);
    expect(data.projects[0].color).toBe('blue');
    expect(skipped).toBe(3);
  });

  it('normalizes and clamps settings', () => {
    const { data } = validateExportData({
      ...base,
      settings: { focus_minutes: -5, accent_color: 'red', phases_per_session: 9999 },
    });
    expect(data.settings?.focus_minutes).toBe(1);
    expect(data.settings?.phases_per_session).toBe(24);
    expect(data.settings?.accent_color).toBe('#E8521A');
  });
});

describe('CSV export', () => {
  it('neutralizes spreadsheet formulas', () => {
    expect(escapeCSV('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCSV('+1')).toBe("'+1");
    expect(escapeCSV(-3)).toBe('-3');
  });

  it('includes project and task names', () => {
    const sessions: Session[] = [
      {
        id: 's1',
        user_id: 'u',
        project_id: 'p1',
        task_id: 'gone',
        type: 'focus',
        started_at: 0,
        duration_seconds: 1500,
        phase_number: 1,
        completed: true,
      },
    ];
    const csv = buildSessionsCSV(
      sessions,
      [
        {
          id: 'p1',
          user_id: 'u',
          name: 'Thesis, part 2',
          color: 'blue',
          status: 'active',
          created_at: 0,
        },
      ],
      []
    );
    const row = csv.split('\n')[1];
    expect(row).toContain('"Thesis, part 2"');
    expect(row).toContain('Deleted task');
    expect(row).toContain(',25,');
  });
});
