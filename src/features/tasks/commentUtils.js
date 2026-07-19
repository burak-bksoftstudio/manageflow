export function validateTaskComment(value) {
  const body = String(value || '').trim();
  if (!body) return 'Yorum boş bırakılamaz.';
  if (body.length > 4000) return 'Yorum en fazla 4000 karakter olabilir.';
  return '';
}

export function normalizeTaskComment(value) {
  return String(value || '').trim();
}

export function getCommentAuthorName(profile) {
  return profile?.full_name || profile?.email?.split('@')[0] || 'İsimsiz kullanıcı';
}

export function getCommentAuthorInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : parts[0]?.slice(0, 2) || '—').toUpperCase();
}

export function mapDatabaseTaskComment(comment, profilesById = new Map()) {
  const profile = profilesById.get(comment.author_id);
  const authorName = getCommentAuthorName(profile);
  return {
    id: comment.id,
    taskId: comment.task_id,
    body: comment.body,
    authorId: comment.author_id,
    authorName,
    authorInitials: getCommentAuthorInitials(authorName),
    editedAt: comment.edited_at || '',
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  };
}

export function getTaskCommentPermissions(comment, currentUserId, role) {
  const isAuthor = Boolean(currentUserId) && comment.authorId === currentUserId;
  return {
    canEdit: isAuthor,
    canDelete: isAuthor || role === 'owner' || role === 'admin',
  };
}

export function getTaskCommentErrorMessage(error) {
  if (error?.code === '23503') return 'Görev artık yorum için kullanılamıyor.';
  if (error?.code === '23514') return 'Yorum metni geçerli değil.';
  if (error?.code === '42501' || error?.code === 'PGRST116') return 'Bu yorum için işlem yetkiniz yok.';
  return 'Yorum güncellenemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
