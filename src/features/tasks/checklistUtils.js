export function validateChecklistTitle(value) {
  const title = String(value || '').trim();
  if (title.length < 2) return 'Checklist öğesi en az 2 karakter olmalıdır.';
  if (title.length > 180) return 'Checklist öğesi en fazla 180 karakter olabilir.';
  return '';
}

export function normalizeChecklistTitle(value) {
  return String(value || '').trim();
}

export function mapDatabaseChecklistItem(item) {
  return {
    id: item.id,
    taskId: item.task_id,
    title: item.title,
    position: item.position,
    isCompleted: item.is_completed,
    completedAt: item.completed_at || '',
    createdAt: item.created_at,
  };
}

export function getChecklistProgress(items) {
  const completed = items.filter(item => item.isCompleted).length;
  return {
    total: items.length,
    completed,
    percentage: items.length ? Math.round((completed / items.length) * 100) : 0,
  };
}

export function getChecklistErrorMessage(error) {
  if (error?.code === '23503') return 'Görev artık checklist için kullanılamıyor.';
  if (error?.code === '23514') return 'Checklist bilgisinden biri geçerli değil.';
  if (error?.code === '42501' || error?.code === 'PGRST116') return 'Bu checklist öğesini değiştirme yetkiniz yok.';
  return 'Checklist güncellenemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}

