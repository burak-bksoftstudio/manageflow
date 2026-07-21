import { describe, expect, it } from 'vitest';
import {
  filterProjectNotes, getProjectNoteErrorMessage, getProjectNotePermissions, getWorkspaceStats,
  mapDatabaseProjectNote, normalizeProjectNoteForm, validateProjectNote,
} from './workspaceUtils';

const projects = [{ id: 'p1', name: 'Web', isArchived: false }, { id: 'p2', name: 'Arşiv', isArchived: true }];

describe('Workspace utilities', () => {
  it('normalizes and validates project note fields', () => {
    expect(normalizeProjectNoteForm({
      projectId: ' p1 ', title: '  Kararlar  ', content: '  İlk madde  ',
      tags: ' Karar, müşteri, karar ', isPinned: true,
    })).toEqual({
      projectId: 'p1', title: 'Kararlar', content: 'İlk madde',
      tags: ['karar', 'müşteri'], isPinned: true,
    });
    expect(validateProjectNote({ projectId: '', title: '', content: '' }, projects)).toContain('başlığı');
    expect(validateProjectNote({ projectId: '', title: 'Genel not', content: 'Ekip bilgisi' }, projects)).toBe('');
    expect(validateProjectNote({ projectId: 'p2', title: 'Not', content: 'İçerik' }, projects)).toContain('kullanılamıyor');
    expect(validateProjectNote({ projectId: 'p1', title: 'Not', content: 'İçerik' }, projects)).toBe('');
    expect(validateProjectNote({
      projectId: 'p1', title: 'Not', content: 'İçerik', tags: Array.from({ length: 9 }, (_, index) => `etiket-${index}`),
    }, projects)).toContain('en fazla 8');
  });

  it('maps database notes with project and author context', () => {
    const mapped = mapDatabaseProjectNote({
      id: 'n1', project_id: 'p1', author_id: 'u1', title: 'Kararlar', content: 'Metin',
      created_at: '2026-07-20T08:00:00Z', updated_at: '2026-07-20T09:00:00Z',
    }, new Map([['p1', { name: 'Web', archived_at: null }]]), new Map([['u1', { full_name: 'Burak Kiriş' }]]));
    expect(mapped).toMatchObject({
      projectName: 'Web', authorName: 'Burak Kiriş', authorInitials: 'BK',
      projectArchived: false, isArchived: false, isPinned: false, tags: [],
    });
    const independent = mapDatabaseProjectNote({
      id: 'n2', project_id: null, author_id: 'u1', title: 'Genel', content: 'Metin',
      created_at: '2026-07-20T08:00:00Z', updated_at: '2026-07-20T09:00:00Z',
    }, new Map(), new Map([['u1', { full_name: 'Burak Kiriş' }]]));
    expect(independent).toMatchObject({ projectId: null, projectName: 'Bağımsız not', projectArchived: false });
  });

  it('applies author and manager edit permissions', () => {
    const note = { authorId: 'u1', projectArchived: false };
    expect(getProjectNotePermissions(note, 'u1', 'member').canEdit).toBe(true);
    expect(getProjectNotePermissions(note, 'u2', 'member').canEdit).toBe(false);
    expect(getProjectNotePermissions(note, 'u2', 'admin').canEdit).toBe(true);
    expect(getProjectNotePermissions({ ...note, projectArchived: true }, 'u1', 'owner').canEdit).toBe(false);
    expect(getProjectNotePermissions({ ...note, isArchived: true }, 'u1', 'member'))
      .toMatchObject({ canArchive: true, canEdit: false, canPin: false });
  });

  it('filters notes and calculates workspace metrics', () => {
    const notes = [
      { id: 'n1', title: 'Tasarım kararları', content: 'Mor vurgu', projectName: 'Web', authorName: 'Burak', projectId: 'p1', authorId: 'u1', tags: ['arayüz'], isPinned: true, updatedAt: '2026-07-20T09:00:00Z' },
      { id: 'n2', title: 'Toplantı', content: 'Müşteri onayı', projectName: 'Mobil', authorName: 'Ece', projectId: 'p2', authorId: 'u2', updatedAt: '2026-07-12T09:00:00Z' },
      { id: 'n3', title: 'Ekip rehberi', content: 'Genel bilgi', projectName: 'Bağımsız not', authorName: 'Ece', projectId: null, authorId: 'u2', isArchived: true, updatedAt: '2026-07-20T10:00:00Z' },
    ];
    expect(filterProjectNotes(notes, { projectId: 'p1', query: 'mor' })).toEqual([notes[0]]);
    expect(filterProjectNotes(notes, { projectId: 'p1', query: 'arayüz' })).toEqual([notes[0]]);
    expect(filterProjectNotes(notes, { archive: 'archived', projectId: 'independent' })).toEqual([notes[2]]);
    expect(getWorkspaceStats(notes, 'u1', new Date('2026-07-20T12:00:00Z')))
      .toEqual({ total: 2, projects: 2, mine: 1, updatedThisWeek: 1 });
  });

  it('returns safe database error messages', () => {
    expect(getProjectNoteErrorMessage({ code: '42501' })).toContain('yetkiniz');
    expect(getProjectNoteErrorMessage(new Error('private detail'))).not.toContain('private detail');
  });
});
