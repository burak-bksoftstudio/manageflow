export const PROJECT_STATUS_LABELS = {
  planned: 'Planlandı',
  active: 'Devam ediyor',
  on_hold: 'Beklemede',
  completed: 'Tamamlandı',
};

export const PROJECT_STATUS_VALUES = Object.fromEntries(
  Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => [label, value]),
);

export function canManageProjects(role) {
  return ['owner', 'admin', 'project_manager'].includes(role);
}

export function validateProject(form) {
  const name = String(form.name || '').trim();
  const description = String(form.description || '').trim();
  const progress = Number(form.progress);

  if (name.length < 2) return 'Proje adı en az 2 karakter olmalıdır.';
  if (name.length > 160) return 'Proje adı en fazla 160 karakter olabilir.';
  if (!form.clientId) return 'Projeyi bağlamak için bir müşteri seçin.';
  if (!PROJECT_STATUS_LABELS[form.status]) return 'Geçerli bir proje durumu seçin.';
  if (description.length > 2000) return 'Proje açıklaması en fazla 2000 karakter olabilir.';
  if (form.progress !== undefined && (!Number.isInteger(progress) || progress < 0 || progress > 100)) return 'Proje ilerlemesi 0 ile 100 arasında tam sayı olmalıdır.';
  if (form.startDate && form.dueDate && form.dueDate < form.startDate) return 'Bitiş tarihi başlangıç tarihinden önce olamaz.';
  return '';
}

export function normalizeProjectProgress(status, progress, previousStatus = '') {
  if (status === 'completed') return 100;
  const numericProgress = Number.isFinite(Number(progress)) ? Math.round(Number(progress)) : 0;
  if (previousStatus === 'completed' && numericProgress >= 100) return 90;
  return Math.min(99, Math.max(0, numericProgress));
}

export function normalizeProjectForm(form) {
  return {
    name: String(form.name || '').trim(),
    clientId: String(form.clientId || '').trim(),
    description: String(form.description || '').trim(),
    status: form.status,
    startDate: form.startDate || '',
    dueDate: form.dueDate || '',
  };
}

export function mapDatabaseProject(project) {
  const client = Array.isArray(project.client) ? project.client[0] : project.client;
  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    status: project.status,
    statusLabel: PROJECT_STATUS_LABELS[project.status] || project.status,
    progress: project.progress,
    clientId: project.client_id,
    clientName: client?.name || 'Müşteri bulunamadı',
    clientStatus: client?.status || 'inactive',
    startDate: project.start_date || '',
    dueDate: project.due_date || '',
    archivedAt: project.archived_at || '',
    archivedBy: project.archived_by || '',
    isArchived: Boolean(project.archived_at),
    createdAt: project.created_at,
    createdAtLabel: new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(project.created_at)),
  };
}

export function mapDemoProject(project, clients) {
  const status = project.statusValue || PROJECT_STATUS_VALUES[project.status] || 'planned';
  const client = clients.find(item => item.id === project.clientId);
  const createdAt = project.createdAt || new Date().toISOString();
  return {
    id: project.id || `project-${project.name}`,
    name: project.name,
    description: project.description || '',
    status,
    statusLabel: PROJECT_STATUS_LABELS[status],
    progress: project.progress || 0,
    clientId: project.clientId || client?.id || '',
    clientName: client?.name || project.client || 'Müşteri bulunamadı',
    clientStatus: client?.status || 'active',
    startDate: project.startDate || '',
    dueDate: project.dueDate || '',
    archivedAt: project.archivedAt || '',
    archivedBy: project.archivedBy || '',
    isArchived: Boolean(project.archivedAt),
    createdAt,
    createdAtLabel: new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(createdAt)),
  };
}

export function filterProjects(projects, { query, status, clientId, archive = 'active' }) {
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
  return projects.filter(project => {
    const searchText = `${project.name} ${project.clientName} ${project.description}`.toLocaleLowerCase('tr-TR');
    return searchText.includes(normalizedQuery)
      && (status === 'all' || project.status === status)
      && (clientId === 'all' || project.clientId === clientId)
      && (archive === 'all' || (archive === 'archived' ? project.isArchived : !project.isArchived));
  });
}

export function getProjectStats(projects) {
  const currentProjects = projects.filter(project => !project.isArchived);
  return {
    total: currentProjects.length,
    active: currentProjects.filter(project => project.status === 'active').length,
    planned: currentProjects.filter(project => project.status === 'planned').length,
    completed: currentProjects.filter(project => project.status === 'completed').length,
  };
}

export function getProjectErrorMessage(error) {
  if (error?.code === '23503') return 'Seçilen müşteri artık kullanılamıyor. Listeyi yenileyip tekrar deneyin.';
  if (error?.code === '23505') return 'Bu isimde bir proje çalışma alanında zaten bulunuyor.';
  if (error?.code === '23514') return 'Proje bilgilerinden biri geçerli değil.';
  if (error?.code === '42501') return 'Bu çalışma alanında proje oluşturma veya düzenleme yetkiniz yok.';
  return 'Proje kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
