import { describe, expect, it } from 'vitest';
import {
  canManageTasks, filterTasks, getTaskErrorMessage, getTaskStats,
  mapDatabaseTask, normalizeTaskForm, validateTask,
} from './taskUtils';

const tasks = [
  { id: '1', title: 'Ana sayfa', projectId: 'p1', projectName: 'Web sitesi', assigneeName: 'Ayşe', description: '', status: 'todo' },
  { id: '2', title: 'API bağlantısı', projectId: 'p1', projectName: 'Web sitesi', assigneeName: 'Burak', description: '', status: 'in_progress' },
  { id: '3', title: 'Sunum', projectId: 'p2', projectName: 'Marka', assigneeName: 'Atanmadı', description: '', status: 'done' },
];

describe('task permissions and validation', () => {
  it('allows task management only for manager roles', () => {
    expect(canManageTasks('owner')).toBe(true);
    expect(canManageTasks('admin')).toBe(true);
    expect(canManageTasks('project_manager')).toBe(true);
    expect(canManageTasks('member')).toBe(false);
  });

  it('requires title, project, status and priority', () => {
    expect(validateTask({ title: 'A', projectId: 'p1', status: 'todo', priority: 'normal' })).toContain('en az');
    expect(validateTask({ title: 'Tasarım', projectId: '', status: 'todo', priority: 'normal' })).toContain('proje');
    expect(validateTask({ title: 'Tasarım', projectId: 'p1', status: 'unknown', priority: 'normal' })).toContain('durumu');
    expect(validateTask({ title: 'Tasarım', projectId: 'p1', status: 'todo', priority: 'unknown' })).toContain('önceliği');
    expect(validateTask({ title: 'Tasarım', projectId: 'p1', status: 'todo', priority: 'normal' })).toBe('');
  });

  it('normalizes optional task fields', () => {
    expect(normalizeTaskForm({
      title: '  Ana sayfa  ', projectId: ' p1 ', assigneeId: ' u1 ', description: '  Açıklama  ', status: 'todo', priority: 'high', dueDate: '',
    })).toEqual({ title: 'Ana sayfa', projectId: 'p1', assigneeId: 'u1', description: 'Açıklama', status: 'todo', priority: 'high', dueDate: '' });
  });
});

describe('task mapping, filtering and metrics', () => {
  it('maps project and assignee context', () => {
    const mapped = mapDatabaseTask({
      id: '1', title: 'Ana sayfa', description: null, status: 'in_progress', priority: 'high', project_id: 'p1', assignee_id: 'u1', due_date: null, completed_at: null, created_at: '2026-07-19T10:00:00.000Z',
    }, new Map([['p1', { name: 'Web sitesi', archived_at: null }]]), new Map([['u1', { full_name: 'Ayşe Kaya', email: 'ayse@example.com' }]]));
    expect(mapped.projectName).toBe('Web sitesi');
    expect(mapped.assigneeName).toBe('Ayşe Kaya');
    expect(mapped.priorityLabel).toBe('Yüksek');
  });

  it('filters by search, status and project', () => {
    expect(filterTasks(tasks, { query: 'web', status: 'all', projectId: 'all' })).toHaveLength(2);
    expect(filterTasks(tasks, { query: '', status: 'done', projectId: 'all' })).toEqual([tasks[2]]);
    expect(filterTasks(tasks, { query: '', status: 'all', projectId: 'p1' })).toHaveLength(2);
  });

  it('calculates task stats and maps errors', () => {
    expect(getTaskStats(tasks)).toEqual({ total: 3, todo: 1, inProgress: 1, done: 1 });
    expect(getTaskErrorMessage({ code: '23503' })).toContain('proje');
    expect(getTaskErrorMessage({ code: '42501' })).toContain('yetkiniz');
  });
});
