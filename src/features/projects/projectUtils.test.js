import { describe, expect, it } from 'vitest';
import {
  canManageProjects, filterProjects, getProjectErrorMessage, getProjectStats,
  mapDatabaseProject, normalizeProjectForm, validateProject,
} from './projectUtils';

const projects = [
  { id: '1', name: 'Web sitesi', clientId: 'a', clientName: 'Atlas Labs', description: 'Kurumsal site', status: 'active' },
  { id: '2', name: 'Marka kimliği', clientId: 'b', clientName: 'Mono Coffee', description: '', status: 'planned' },
  { id: '3', name: 'Mobil uygulama', clientId: 'a', clientName: 'Atlas Labs', description: '', status: 'completed' },
];

describe('project permissions and validation', () => {
  it('allows project management only for manager roles', () => {
    expect(canManageProjects('owner')).toBe(true);
    expect(canManageProjects('admin')).toBe(true);
    expect(canManageProjects('project_manager')).toBe(true);
    expect(canManageProjects('member')).toBe(false);
  });

  it('requires a valid name, client, status and date order', () => {
    expect(validateProject({ name: 'A', clientId: 'a', status: 'planned' })).toContain('en az');
    expect(validateProject({ name: 'Web sitesi', clientId: '', status: 'planned' })).toContain('müşteri');
    expect(validateProject({ name: 'Web sitesi', clientId: 'a', status: 'unknown' })).toContain('durumu');
    expect(validateProject({ name: 'Web sitesi', clientId: 'a', status: 'planned', startDate: '2026-07-20', dueDate: '2026-07-19' })).toContain('önce');
    expect(validateProject({ name: 'Web sitesi', clientId: 'a', status: 'planned', startDate: '2026-07-19', dueDate: '2026-07-20' })).toBe('');
  });

  it('normalizes free text without mutating ids or dates', () => {
    expect(normalizeProjectForm({
      name: '  Yeni site  ', clientId: ' client-1 ', description: '  Açıklama  ', status: 'active', startDate: '2026-07-19', dueDate: '',
    })).toEqual({
      name: 'Yeni site', clientId: 'client-1', description: 'Açıklama', status: 'active', startDate: '2026-07-19', dueDate: '',
    });
  });
});

describe('project mapping, filtering and metrics', () => {
  it('maps the customer relationship returned by Supabase', () => {
    const mapped = mapDatabaseProject({
      id: '1', name: 'Web sitesi', description: null, status: 'active', progress: 20,
      client_id: 'a', client: { name: 'Atlas Labs', status: 'active' }, start_date: null, due_date: null,
      created_at: '2026-07-19T10:00:00.000Z',
    });
    expect(mapped.clientName).toBe('Atlas Labs');
    expect(mapped.statusLabel).toBe('Devam ediyor');
    expect(mapped.description).toBe('');
  });

  it('filters by search, status and customer', () => {
    expect(filterProjects(projects, { query: 'atlas', status: 'all', clientId: 'all' })).toHaveLength(2);
    expect(filterProjects(projects, { query: '', status: 'planned', clientId: 'all' })).toEqual([projects[1]]);
    expect(filterProjects(projects, { query: '', status: 'all', clientId: 'a' })).toHaveLength(2);
  });

  it('calculates project stats', () => {
    expect(getProjectStats(projects)).toEqual({ total: 3, active: 1, planned: 1, completed: 1 });
  });

  it('maps database error codes to Turkish messages', () => {
    expect(getProjectErrorMessage({ code: '23505' })).toContain('zaten');
    expect(getProjectErrorMessage({ code: '42501' })).toContain('yetkiniz');
  });
});
