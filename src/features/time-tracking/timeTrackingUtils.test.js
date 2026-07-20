import { describe, expect, it } from 'vitest';
import {
  canViewTeamTimesheet, formatCompactDuration, formatTimerDuration, formatWeekRange, getElapsedSeconds,
  getManualStartedAt, getTeamTimesheetSummary, getTimeTrackingErrorMessage, getTimeTrackingStats,
  getTodaySeconds, getWeekBounds, getWeeklyHistory, mapDatabaseTeamTimesheetEntry, mapDatabaseTimeEntry,
  normalizeManualTimeForm, normalizeTimerForm, validateManualTimeForm, validateTimerForm,
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
      note: null, entry_type: 'timer', started_at: '2026-07-19T09:00:00Z', ended_at: null, duration_seconds: null,
      created_at: '2026-07-19T09:00:00Z',
    }, new Map([['p1', { name: 'Web Sitesi' }]]), new Map([['t1', { title: 'Ana sayfa' }]]));
    expect(mapped).toMatchObject({
      projectName: 'Web Sitesi', taskTitle: 'Ana sayfa', isActive: true, isArchived: false,
      archivedAt: '', correctedAt: '', note: '', entryType: 'timer',
    });
  });

  it('normalizes and validates a past manual entry', () => {
    const form = {
      projectId: ' p1 ', taskId: '', date: '2026-07-19', startTime: '09:30', durationMinutes: '90', note: '  Toplantı  ',
    };
    expect(normalizeManualTimeForm(form)).toMatchObject({ projectId: 'p1', durationMinutes: 90, note: 'Toplantı' });
    expect(getManualStartedAt(form)).toBeInstanceOf(Date);
    expect(validateManualTimeForm(form, [], new Date('2026-07-19T13:00:00'))).toBe('');
    expect(validateManualTimeForm({ ...form, durationMinutes: 0 }, [], new Date('2026-07-19T13:00:00'))).toContain('1 ile 1440');
    expect(validateManualTimeForm({ ...form, startTime: '12:30', durationMinutes: 60 }, [], new Date('2026-07-19T13:00:00'))).toContain('geleceğe');
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

  it('builds a filtered Monday-to-Sunday weekly history', () => {
    const entries = [
      { id: 'e1', projectId: 'p1', taskId: 't1', startedAt: '2026-07-13T09:00:00+03:00', endedAt: '2026-07-13T10:00:00+03:00', durationSeconds: 3600 },
      { id: 'e2', projectId: 'p2', taskId: '', startedAt: '2026-07-19T10:00:00+03:00', endedAt: '2026-07-19T10:30:00+03:00', durationSeconds: 1800 },
      { id: 'e3', projectId: 'p1', taskId: 't1', startedAt: '2026-07-20T09:00:00+03:00', endedAt: '2026-07-20T10:00:00+03:00', durationSeconds: 3600 },
    ];
    const bounds = getWeekBounds(new Date('2026-07-16T12:00:00+03:00'));
    expect(bounds.start.getDay()).toBe(1);
    expect(bounds.end.getDay()).toBe(1);
    expect(getWeeklyHistory(entries, new Date('2026-07-16T12:00:00+03:00'), { projectId: 'p1' }))
      .toMatchObject({ entries: [entries[0]], totalSeconds: 3600 });
    expect(formatWeekRange(new Date('2026-07-16T12:00:00+03:00'))).toContain('13');
  });

  it('keeps archived entries out of active history and metrics', () => {
    const now = new Date('2026-07-19T12:00:00+03:00');
    const entries = [
      { id: 'active', projectId: 'p1', startedAt: '2026-07-19T09:00:00+03:00', endedAt: '2026-07-19T10:00:00+03:00', durationSeconds: 3600, isActive: false, isArchived: false },
      { id: 'archived', projectId: 'p1', startedAt: '2026-07-19T10:00:00+03:00', endedAt: '2026-07-19T11:00:00+03:00', durationSeconds: 3600, isActive: false, isArchived: true },
    ];
    expect(getWeeklyHistory(entries, now).entries.map(entry => entry.id)).toEqual(['active']);
    expect(getWeeklyHistory(entries, now, { archive: 'archived' }).entries.map(entry => entry.id)).toEqual(['archived']);
    expect(getWeeklyHistory(entries, now, { archive: 'all' }).totalSeconds).toBe(7200);
    expect(getTimeTrackingStats(entries, now)).toMatchObject({ sessions: 1, todaySeconds: 3600 });
  });

  it('allows only owners and admins to view team timesheets', () => {
    expect(canViewTeamTimesheet('owner')).toBe(true);
    expect(canViewTeamTimesheet('admin')).toBe(true);
    expect(canViewTeamTimesheet('project_manager')).toBe(false);
    expect(canViewTeamTimesheet('member')).toBe(false);
  });

  it('maps and summarizes filtered team timesheet records', () => {
    const rangeStart = new Date('2026-07-13T00:00:00Z');
    const rangeEnd = new Date('2026-07-20T00:00:00Z');
    const entries = [
      mapDatabaseTeamTimesheetEntry({
        id: 'e1', user_id: 'u1', member_name: 'Ayşe Kaya', member_email: 'ayse@example.com',
        project_id: 'p1', project_name: 'Web', task_id: 't1', task_title: 'Tasarım', entry_type: 'manual',
        started_at: '2026-07-14T09:00:00Z', ended_at: '2026-07-14T10:00:00Z', duration_seconds: 3600,
      }),
      mapDatabaseTeamTimesheetEntry({
        id: 'e2', user_id: 'u2', member_name: 'Can Demir', member_email: 'can@example.com',
        project_id: 'p2', project_name: 'Mobil', entry_type: 'timer',
        started_at: '2026-07-15T09:00:00Z', ended_at: '2026-07-15T09:30:00Z', duration_seconds: 1800,
      }),
    ];
    expect(entries[0]).toMatchObject({ memberName: 'Ayşe Kaya', taskTitle: 'Tasarım', isActive: false });
    expect(getTeamTimesheetSummary(entries, rangeStart, rangeEnd)).toMatchObject({
      members: 2, projects: 2, sessions: 2, totalSeconds: 5400,
    });
    expect(getTeamTimesheetSummary(entries, rangeStart, rangeEnd, { memberId: 'u1' })).toMatchObject({
      members: 1, projects: 1, sessions: 1, totalSeconds: 3600,
    });
  });

  it('formats timer and compact durations', () => {
    expect(formatTimerDuration(3661)).toBe('01:01:01');
    expect(formatCompactDuration(30)).toBe('30 sn');
    expect(formatCompactDuration(3900)).toBe('1 sa 5 dk');
  });

  it('returns safe database error messages', () => {
    expect(getTimeTrackingErrorMessage({ code: '23505' })).toContain('devam eden');
    expect(getTimeTrackingErrorMessage({ code: '42501' })).toContain('yetkiniz');
    expect(getTimeTrackingErrorMessage({ code: '23514' })).toContain('Tarih');
    expect(getTimeTrackingErrorMessage({ code: 'P0002' })).toContain('bulunamadı');
    expect(getTimeTrackingErrorMessage(new Error('details'))).not.toContain('details');
  });
});
