export const ARCHIVE_TYPE_LABELS = {
  note: 'Çalışma alanı notu',
  project: 'Proje',
  task: 'Görev',
  time: 'Zaman kaydı',
};

export function getCentralArchiveItems({ notes = [], projects = [], tasks = [], timeEntries = [] } = {}) {
  const projectItems = projects.filter(project => project.isArchived).map(project => ({
    archivedAt: project.archivedAt,
    clientName: project.clientName,
    context: project.clientName,
    contextArchived: false,
    id: project.id,
    searchText: `${project.name} ${project.clientName} ${project.description}`,
    title: project.name,
    type: 'project',
  }));
  const taskItems = tasks.filter(task => task.isArchived).map(task => ({
    archivedAt: task.archivedAt,
    context: task.projectName,
    contextArchived: task.projectArchived,
    id: task.id,
    searchText: `${task.title} ${task.projectName} ${task.assigneeName} ${task.description}`,
    title: task.title,
    type: 'task',
  }));
  const timeItems = timeEntries.filter(entry => entry.isArchived).map(entry => {
    const project = projects.find(item => item.id === entry.projectId);
    return {
      archivedAt: entry.archivedAt,
      context: entry.taskTitle ? `${entry.projectName} · ${entry.taskTitle}` : entry.projectName,
      contextArchived: Boolean(project?.isArchived),
      id: entry.id,
      searchText: `${entry.projectName} ${entry.taskTitle} ${entry.note}`,
      title: entry.taskTitle || entry.projectName,
      type: 'time',
    };
  });
  const noteItems = notes.filter(note => note.isArchived).map(note => ({
    archivedAt: note.archivedAt,
    authorId: note.authorId,
    context: note.projectName,
    contextArchived: note.projectArchived,
    id: note.id,
    searchText: `${note.title} ${note.content} ${note.projectName} ${note.authorName} ${(note.tags || []).join(' ')}`,
    title: note.title,
    type: 'note',
  }));
  return [...projectItems, ...taskItems, ...timeItems, ...noteItems]
    .sort((left, right) => new Date(right.archivedAt).getTime() - new Date(left.archivedAt).getTime());
}

export function filterArchiveItems(items, { query = '', type = 'all' } = {}) {
  const normalizedQuery = String(query).trim().toLocaleLowerCase('tr-TR');
  return items.filter(item => (type === 'all' || item.type === type)
    && item.searchText.toLocaleLowerCase('tr-TR').includes(normalizedQuery));
}

export function getArchiveStats(items) {
  return {
    notes: items.filter(item => item.type === 'note').length,
    projects: items.filter(item => item.type === 'project').length,
    tasks: items.filter(item => item.type === 'task').length,
    timeEntries: items.filter(item => item.type === 'time').length,
    total: items.length,
  };
}

export function formatArchiveDate(value) {
  if (!value) return 'Arşiv tarihi bilinmiyor';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(value));
}
