import { getCommentAuthorInitials, getCommentAuthorName } from '../tasks/commentUtils';

export const MAX_PROJECT_NOTE_TITLE_LENGTH = 160;
export const MAX_PROJECT_NOTE_CONTENT_LENGTH = 10000;

export function normalizeProjectNoteForm(form = {}) {
  return {
    content: String(form.content || '').trim(),
    projectId: String(form.projectId || '').trim(),
    title: String(form.title || '').trim(),
  };
}

export function validateProjectNote(form, projects = []) {
  const normalized = normalizeProjectNoteForm(form);
  if (normalized.projectId) {
    const project = projects.find(item => item.id === normalized.projectId);
    if (!project || project.isArchived) return 'Seçilen proje artık not eklemek için kullanılamıyor.';
  }
  if (normalized.title.length < 2) return 'Not başlığı en az 2 karakter olmalıdır.';
  if (normalized.title.length > MAX_PROJECT_NOTE_TITLE_LENGTH) {
    return `Not başlığı en fazla ${MAX_PROJECT_NOTE_TITLE_LENGTH} karakter olabilir.`;
  }
  if (!normalized.content) return 'Not içeriği boş bırakılamaz.';
  if (normalized.content.length > MAX_PROJECT_NOTE_CONTENT_LENGTH) {
    return `Not içeriği en fazla ${MAX_PROJECT_NOTE_CONTENT_LENGTH} karakter olabilir.`;
  }
  return '';
}

export function mapDatabaseProjectNote(note, projectsById = new Map(), profilesById = new Map()) {
  const project = projectsById.get(note.project_id);
  const profile = profilesById.get(note.author_id);
  const authorName = getCommentAuthorName(profile);
  return {
    authorId: note.author_id,
    authorInitials: getCommentAuthorInitials(authorName),
    authorName,
    content: note.content,
    createdAt: note.created_at,
    id: note.id,
    projectArchived: note.project_id ? Boolean(project?.archived_at) : false,
    projectId: note.project_id,
    projectName: note.project_id ? (project?.name || 'Proje bulunamadı') : 'Bağımsız not',
    title: note.title,
    updatedAt: note.updated_at,
  };
}

export function getProjectNotePermissions(note, currentUserId, role) {
  const isAuthor = Boolean(currentUserId) && note.authorId === currentUserId;
  return {
    canEdit: !note.projectArchived && (isAuthor || ['owner', 'admin', 'project_manager'].includes(role)),
    isAuthor,
  };
}

export function filterProjectNotes(notes, { projectId = 'all', query = '' } = {}) {
  const normalizedQuery = String(query).trim().toLocaleLowerCase('tr-TR');
  return notes.filter(note => {
    const searchText = `${note.title} ${note.content} ${note.projectName} ${note.authorName}`.toLocaleLowerCase('tr-TR');
    const matchesContext = projectId === 'all'
      || (projectId === 'independent' ? !note.projectId : note.projectId === projectId);
    return matchesContext && searchText.includes(normalizedQuery);
  });
}

export function getWorkspaceStats(notes, currentUserId, now = new Date()) {
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
  return {
    mine: notes.filter(note => note.authorId === currentUserId).length,
    projects: new Set(notes.map(note => note.projectId).filter(Boolean)).size,
    total: notes.length,
    updatedThisWeek: notes.filter(note => new Date(note.updatedAt) >= weekStart).length,
  };
}

export function formatProjectNoteDate(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(value));
}

export function getProjectNoteErrorMessage(error) {
  if (error?.code === '23503') return 'Seçilen proje artık kullanılamıyor.';
  if (error?.code === '23514') return 'Not başlığı veya içeriği geçerli değil.';
  if (error?.code === '42501' || error?.code === 'PGRST116') return 'Bu not için işlem yetkiniz yok.';
  return 'Not kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
