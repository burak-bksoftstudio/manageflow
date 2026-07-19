import { describe, expect, it } from 'vitest';
import {
  describeTaskActivity, getTaskActivityErrorMessage, getTaskActivityRelatedIds,
  mapDatabaseTaskActivity,
} from './activityUtils';

describe('task activity domain', () => {
  it('collects actor, assignee and project context ids', () => {
    expect(getTaskActivityRelatedIds([{ actor_id: 'u1', metadata: {
      old_assignee_id: 'u2', new_assignee_id: 'u3', old_project_id: 'p1', new_project_id: 'p2',
    } }])).toEqual({ profileIds: ['u1', 'u2', 'u3'], projectIds: ['p1', 'p2'] });
  });

  it('describes status, assignment and archive events', () => {
    expect(describeTaskActivity({ eventType: 'status_changed', metadata: { old_value: 'todo', new_value: 'done' } })).toContain('Tamamlandı');
    expect(describeTaskActivity({ eventType: 'assignee_changed', metadata: { new_assignee_id: 'u2' } }, new Map([['u2', { full_name: 'Ayşe Kaya' }]]))).toContain('Ayşe Kaya');
    expect(describeTaskActivity({ eventType: 'archived', metadata: {} })).toContain('arşivledi');
  });

  it('maps database records with actor identity and description', () => {
    const activity = mapDatabaseTaskActivity({
      id: 'a1', task_id: 't1', event_type: 'created', actor_id: 'u1', metadata: {}, created_at: '2026-07-19T12:00:00Z',
    }, new Map([['u1', { full_name: 'Burak Kiriş' }]]));
    expect(activity).toMatchObject({ actorName: 'Burak Kiriş', actorInitials: 'BK', description: 'Görevi oluşturdu.' });
  });

  it('maps activity access errors', () => {
    expect(getTaskActivityErrorMessage({ code: '42501' })).toContain('yetkiniz');
    expect(getTaskActivityErrorMessage({ code: 'network' })).toContain('yüklenemedi');
  });
});
