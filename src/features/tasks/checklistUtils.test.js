import { describe, expect, it } from 'vitest';
import {
  getChecklistErrorMessage, getChecklistProgress, mapDatabaseChecklistItem,
  normalizeChecklistTitle, validateChecklistTitle,
} from './checklistUtils';

describe('task checklist domain', () => {
  it('validates and normalizes item titles', () => {
    expect(validateChecklistTitle('A')).toContain('en az');
    expect(validateChecklistTitle('A'.repeat(181))).toContain('en fazla');
    expect(validateChecklistTitle('  Wireframe hazırla  ')).toBe('');
    expect(normalizeChecklistTitle('  Wireframe hazırla  ')).toBe('Wireframe hazırla');
  });

  it('maps database fields', () => {
    expect(mapDatabaseChecklistItem({
      id: 'i1', task_id: 't1', title: 'Kontrol et', position: 2, is_completed: true,
      completed_at: '2026-07-19T10:00:00Z', created_at: '2026-07-19T09:00:00Z',
    })).toMatchObject({ id: 'i1', taskId: 't1', position: 2, isCompleted: true });
  });

  it('calculates completion progress safely', () => {
    expect(getChecklistProgress([])).toEqual({ total: 0, completed: 0, percentage: 0 });
    expect(getChecklistProgress([{ isCompleted: true }, { isCompleted: false }, { isCompleted: true }]))
      .toEqual({ total: 3, completed: 2, percentage: 67 });
  });

  it('maps security and validation errors', () => {
    expect(getChecklistErrorMessage({ code: '42501' })).toContain('yetkiniz');
    expect(getChecklistErrorMessage({ code: '23514' })).toContain('geçerli');
  });
});

