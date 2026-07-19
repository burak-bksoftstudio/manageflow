import { describe, expect, it } from 'vitest';
import {
  formatCompactDuration, formatTimerDuration, getElapsedSeconds, getTimeTrackingErrorMessage,
  getTimeTrackingStats, getTodaySeconds, mapDatabaseTimeEntry, normalizeTimerForm, validateTimerForm,
} from './timeTrackingUtils';

describe('Time tracking utilities', () => {
  it('normalizes and validates timer context', () => {
    expect(normalizeTimerForm({ projectId: ' p1 ', taskId: ' t1 ', note: '  Tasarım  ' }))
      .toEqual({ projectId: 'p1', taskId: 't1', note: 'Tasarım' });
    expect(validateTimerForm({ projectId: '', taskId: '', note: '' })).toBe('Süreyi bağlamak için bir proje seçin.');
    expect(validateTimerForm({ projectId: 'p1', taskId: 't2', note: '' }, [{ id: 't2', projectId: 'p2' }]))
      .toBe('Seçilen görev bu proje için kullanılamıyor.');
    expect(validateTimerForm({ projectId: 'p1', taskId: 't1', note: '' }, [{ id: 't1', projectId: 'p1', isArchived: false }]))
      .toBe('');
  });

  it('maps database records with project and task context', () => {
    const mapped = mapDatabaseTimeEntry({
      id: 'e1', organization_id: 'o1', project_id: 'p1', task_id: 't1', user_id: 'u1',
      note: null, started_at: '2026-07-19T09:00:00Z', ended_at: null, duration_seconds: null,
      created_at: '2026-07-19T09:00:00Z',
    }, new Map([['p1', { name: 'Web Sitesi' }]]), new Map([['t1', { title: 'Ana sayfa' }]]));
    expect(mapped).toMatchObject({ projectName: 'Web Sitesi', taskTitle: 'Ana sayfa', isActive: true, note: '' });
  });

  it('calculates active and completed durations', () => {
    const now = new Date('2026-07-19T10:00:30Z');
    expect(getElapsedSeconds({ startedAt: '2026-07-19T10:00:00Z', endedAt: '', durationSeconds: null, isActive: true }, now)).toBe(30);
    expect(getElapsedSeconds({ startedAt: '2026-07-19T08:00:00Z', endedAt: '2026-07-19T09:00:00Z', durationSeconds: 3600, isActive: false }, now)).toBe(3600);
  });

  it('counts only the part of a session inside today', () => {
    const now = new Date('2026-07-19T10:00:00+03:00');
    expect(getTodaySeconds({ startedAt: '2026-07-18T23:30:00+03:00', endedAt: '', isActive: true }, now)).toBe(36000);
    expect(getTodaySeconds({ startedAt: '2026-07-18T20:00:00+03:00', endedAt: '2026-07-18T21:00:00+03:00' }, now)).toBe(0);
  });

  it('builds today metrics and finds the active timer', () => {
    const now = new Date('2026-07-19T12:00:00+03:00');
    const entries = [
      { id: 'e1', projectId: 'p1', startedAt: '2026-07-19T09:00:00+03:00', endedAt: '2026-07-19T10:00:00+03:00', isActive: false },
      { id: 'e2', projectId: 'p2', startedAt: '2026-07-19T11:30:00+03:00', endedAt: '', isActive: true },
    ];
    expect(getTimeTrackingStats(entries, now)).toMatchObject({ activeEntry: entries[1], projects: 2, sessions: 2, todaySeconds: 5400 });
  });

  it('formats timer and compact durations', () => {
    expect(formatTimerDuration(3661)).toBe('01:01:01');
    expect(formatCompactDuration(30)).toBe('30 sn');
    expect(formatCompactDuration(3900)).toBe('1 sa 5 dk');
  });

  it('returns safe database error messages', () => {
    expect(getTimeTrackingErrorMessage({ code: '23505' })).toContain('devam eden');
    expect(getTimeTrackingErrorMessage({ code: '42501' })).toContain('yetkiniz');
    expect(getTimeTrackingErrorMessage(new Error('details'))).not.toContain('details');
  });
});
