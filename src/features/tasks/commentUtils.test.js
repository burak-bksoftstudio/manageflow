import { describe, expect, it } from 'vitest';
import {
  getCommentAuthorInitials, getTaskCommentErrorMessage, getTaskCommentPermissions,
  mapDatabaseTaskComment, normalizeTaskComment, validateTaskComment,
} from './commentUtils';

describe('task comment domain', () => {
  it('validates and normalizes comment bodies', () => {
    expect(validateTaskComment('   ')).toContain('boş');
    expect(validateTaskComment('A'.repeat(4001))).toContain('4000');
    expect(validateTaskComment('  Teslim hazır.  ')).toBe('');
    expect(normalizeTaskComment('  Teslim hazır.  ')).toBe('Teslim hazır.');
  });

  it('maps database comments with author identity', () => {
    const comment = mapDatabaseTaskComment({
      id: 'c1', task_id: 't1', body: 'Kontrol edildi', author_id: 'u1', edited_at: null,
      created_at: '2026-07-19T12:00:00Z', updated_at: '2026-07-19T12:00:00Z',
    }, new Map([['u1', { full_name: 'Ayşe Kaya', email: 'ayse@example.com' }]]));
    expect(comment).toMatchObject({ id: 'c1', taskId: 't1', authorName: 'Ayşe Kaya', authorInitials: 'AK' });
    expect(getCommentAuthorInitials('Burak')).toBe('BU');
  });

  it('keeps editing author-only and permits admin moderation deletes', () => {
    const comment = { authorId: 'u1' };
    expect(getTaskCommentPermissions(comment, 'u1', 'member')).toEqual({ canEdit: true, canDelete: true });
    expect(getTaskCommentPermissions(comment, 'u2', 'admin')).toEqual({ canEdit: false, canDelete: true });
    expect(getTaskCommentPermissions(comment, 'u2', 'project_manager')).toEqual({ canEdit: false, canDelete: false });
  });

  it('maps permission and validation errors', () => {
    expect(getTaskCommentErrorMessage({ code: '42501' })).toContain('yetkiniz');
    expect(getTaskCommentErrorMessage({ code: '23514' })).toContain('geçerli');
  });
});
