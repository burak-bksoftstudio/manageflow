import { describe, expect, it } from 'vitest';
import { filterArchiveItems, getArchiveStats, getCentralArchiveItems } from './archiveUtils';

describe('central archive utilities', () => {
  const items = getCentralArchiveItems({
    projects: [
      { id: 'p1', name: 'Web sitesi', clientName: 'Atlas', description: '', isArchived: true, archivedAt: '2026-07-20T10:00:00Z' },
      { id: 'p2', name: 'Mobil', clientName: 'Mono', description: '', isArchived: false },
    ],
    tasks: [
      { id: 't1', title: 'Ana sayfa', projectName: 'Web sitesi', assigneeName: 'Ayşe', description: '', isArchived: true, projectArchived: true, archivedAt: '2026-07-21T10:00:00Z' },
    ],
    timeEntries: [
      { id: 'e1', projectId: 'p2', projectName: 'Mobil', taskTitle: '', note: 'Toplantı', isArchived: true, archivedAt: '2026-07-22T10:00:00Z' },
    ],
    notes: [
      { id: 'n1', title: 'Brief kararları', content: 'Logo sabit', projectName: 'Mobil', authorName: 'Ece', authorId: 'u1', tags: ['brief'], isArchived: true, projectArchived: false, archivedAt: '2026-07-23T10:00:00Z' },
    ],
  });

  it('combines and sorts archived records from all supported modules', () => {
    expect(items.map(item => item.id)).toEqual(['n1', 'e1', 't1', 'p1']);
    expect(items[2]).toMatchObject({ type: 'task', contextArchived: true });
  });

  it('filters by type and Turkish-aware query', () => {
    expect(filterArchiveItems(items, { type: 'project', query: 'atlas' }).map(item => item.id)).toEqual(['p1']);
    expect(filterArchiveItems(items, { type: 'all', query: 'toplantı' }).map(item => item.id)).toEqual(['e1']);
    expect(filterArchiveItems(items, { type: 'note', query: 'brief' }).map(item => item.id)).toEqual(['n1']);
  });

  it('calculates archive metrics', () => {
    expect(getArchiveStats(items)).toEqual({ total: 4, notes: 1, projects: 1, tasks: 1, timeEntries: 1 });
  });
});
