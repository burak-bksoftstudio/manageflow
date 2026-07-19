import { describe, expect, it } from 'vitest';
import {
  getDashboardMetrics, getProjectDistribution, getRecentActiveProjects,
  getTodayAgenda, getWeeklyTaskActivity,
} from './dashboardUtils';

describe('dashboard metrics', () => {
  it('counts only current projects and tasks while separating active records', () => {
    const result = getDashboardMetrics({
      clients: [{ status: 'active' }, { status: 'lead' }],
      members: [{ status: 'active' }, { status: 'inactive' }, { status: 'pending', isInvitation: true }],
      projects: [{ status: 'active' }, { status: 'completed' }, { status: 'active', isArchived: true }],
      tasks: [
        { status: 'done' }, { status: 'todo' }, { status: 'done', isArchived: true },
        { status: 'todo', projectArchived: true },
      ],
    });
    expect(result).toEqual({
      projects: 2, activeProjects: 1, tasks: 2, completedTasks: 1, taskCompletionRate: 50,
      clients: 2, activeClients: 1, members: 2, activeMembers: 1,
    });
  });
});

describe('dashboard activity', () => {
  const now = new Date(2026, 6, 19, 12);

  it('builds seven-day created and completed task series', () => {
    const result = getWeeklyTaskActivity([
      { createdAt: new Date(2026, 6, 19, 9).toISOString(), completedAt: new Date(2026, 6, 19, 11).toISOString() },
      { createdAt: new Date(2026, 6, 18, 9).toISOString(), completedAt: '' },
      { createdAt: new Date(2026, 5, 1).toISOString(), completedAt: '' },
    ], now);
    expect(result).toHaveLength(7);
    expect(result.at(-1)).toMatchObject({ created: 1, completed: 1, createdHeight: 100, completedHeight: 100 });
    expect(result.at(-2)).toMatchObject({ created: 1, completed: 0 });
  });

  it('orders today tasks by completion and priority', () => {
    const result = getTodayAgenda([
      { id: 'normal', dueDate: '2026-07-19', priority: 'normal', status: 'todo' },
      { id: 'urgent', dueDate: '2026-07-19', priority: 'urgent', status: 'todo' },
      { id: 'done', dueDate: '2026-07-19', priority: 'high', status: 'done' },
      { id: 'archived', dueDate: '2026-07-19', priority: 'urgent', status: 'todo', isArchived: true },
    ], now);
    expect(result.items.map(item => item.id)).toEqual(['urgent', 'normal', 'done']);
    expect(result).toMatchObject({ focusCompleted: 1, focusTotal: 2 });
  });
});

describe('dashboard projects', () => {
  it('calculates status distribution without archived projects', () => {
    const result = getProjectDistribution([
      { status: 'active' }, { status: 'planned' }, { status: 'planned' },
      { status: 'completed', isArchived: true },
    ]);
    expect(result.total).toBe(3);
    expect(result.items.map(item => [item.status, item.count])).toEqual([['active', 1], ['planned', 2]]);
    expect(result.gradient).toContain('conic-gradient');
  });

  it('returns newest non-completed active work first', () => {
    const result = getRecentActiveProjects([
      { id: 'old', status: 'active', createdAt: '2026-07-01T00:00:00Z' },
      { id: 'new', status: 'planned', createdAt: '2026-07-10T00:00:00Z' },
      { id: 'done', status: 'completed', createdAt: '2026-07-12T00:00:00Z' },
    ]);
    expect(result.map(project => project.id)).toEqual(['new', 'old']);
  });
});
