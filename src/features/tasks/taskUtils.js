export const TASK_STATUS_LABELS = {
  todo: 'Yapılacak',
  in_progress: 'Devam ediyor',
  review: 'İncelemede',
  done: 'Tamamlandı',
};

export const TASK_PRIORITY_LABELS = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
  urgent: 'Acil',
};

export function canManageTasks(role) {
  return ['owner', 'admin', 'project_manager'].includes(role);
}

export function validateTask(form) {
  const title = String(form.title || '').trim();
  const description = String(form.description || '').trim();
  if (title.length < 2) return 'Görev başlığı en az 2 karakter olmalıdır.';
  if (title.length > 200) return 'Görev başlığı en fazla 200 karakter olabilir.';
  if (!form.projectId) return 'Görevi bağlamak için bir proje seçin.';
  if (!TASK_STATUS_LABELS[form.status]) return 'Geçerli bir görev durumu seçin.';
  if (!TASK_PRIORITY_LABELS[form.priority]) return 'Geçerli bir görev önceliği seçin.';
  if (description.length > 4000) return 'Görev açıklaması en fazla 4000 karakter olabilir.';
  return '';
}

export function normalizeTaskForm(form) {
  return {
    title: String(form.title || '').trim(),
    projectId: String(form.projectId || '').trim(),
    assigneeId: String(form.assigneeId || '').trim(),
    description: String(form.description || '').trim(),
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate || '',
  };
}

function getInitials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part[0].toLocaleUpperCase('tr-TR')).join('') || '—';
}

export function mapDatabaseTask(task, projectsById, profilesById) {
  const project = projectsById.get(task.project_id);
  const assignee = task.assignee_id ? profilesById.get(task.assignee_id) : null;
  const assigneeName = assignee?.full_name || assignee?.email?.split('@')[0] || '';
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    statusLabel: TASK_STATUS_LABELS[task.status] || task.status,
    priority: task.priority,
    priorityLabel: TASK_PRIORITY_LABELS[task.priority] || task.priority,
    projectId: task.project_id,
    projectName: project?.name || 'Proje bulunamadı',
    projectArchived: Boolean(project?.archived_at),
    assigneeId: task.assignee_id || '',
    assigneeName: assigneeName || 'Atanmadı',
    assigneeInitials: getInitials(assigneeName),
    dueDate: task.due_date || '',
    completedAt: task.completed_at || '',
    archivedAt: task.archived_at || '',
    archivedBy: task.archived_by || '',
    isArchived: Boolean(task.archived_at),
    createdAt: task.created_at,
    createdAtLabel: new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(task.created_at)),
  };
}

export function filterTasks(tasks, { query, status, projectId, archive = 'active' }) {
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
  return tasks.filter(task => {
    const searchText = `${task.title} ${task.projectName} ${task.assigneeName} ${task.description}`.toLocaleLowerCase('tr-TR');
    return searchText.includes(normalizedQuery)
      && (status === 'all' || task.status === status)
      && (projectId === 'all' || task.projectId === projectId)
      && (archive === 'all' || (archive === 'archived' ? task.isArchived : !task.isArchived));
  });
}

export function getTaskStats(tasks) {
  const currentTasks = tasks.filter(task => !task.isArchived);
  return {
    total: currentTasks.length,
    todo: currentTasks.filter(task => task.status === 'todo').length,
    inProgress: currentTasks.filter(task => task.status === 'in_progress').length,
    done: currentTasks.filter(task => task.status === 'done').length,
  };
}

export function getTaskErrorMessage(error) {
  if (error?.code === '23503') return 'Seçilen proje veya görevli bu görev için kullanılamıyor.';
  if (error?.code === '23514') return 'Görev bilgilerinden biri geçerli değil.';
  if (error?.code === '42501') return 'Bu çalışma alanında görev oluşturma veya düzenleme yetkiniz yok.';
  return 'Görev kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
