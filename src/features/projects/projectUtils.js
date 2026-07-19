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

  if (name.length < 2) return 'Proje adı en az 2 karakter olmalıdır.';
  if (name.length > 160) return 'Proje adı en fazla 160 karakter olabilir.';
  if (!form.clientId) return 'Projeyi bağlamak için bir müşteri seçin.';
  if (!PROJECT_STATUS_LABELS[form.status]) return 'Geçerli bir proje durumu seçin.';
  if (description.length > 2000) return 'Proje açıklaması en fazla 2000 karakter olabilir.';
  if (form.startDate && form.dueDate && form.dueDate < form.startDate) return 'Bitiş tarihi başlangıç tarihinden önce olamaz.';
  return '';
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
    createdAt,
    createdAtLabel: new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(createdAt)),
  };
}

export function filterProjects(projects, { query, status, clientId }) {
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
  return projects.filter(project => {
    const searchText = `${project.name} ${project.clientName} ${project.description}`.toLocaleLowerCase('tr-TR');
    return searchText.includes(normalizedQuery)
      && (status === 'all' || project.status === status)
      && (clientId === 'all' || project.clientId === clientId);
  });
}

export function getProjectStats(projects) {
  return {
    total: projects.length,
    active: projects.filter(project => project.status === 'active').length,
    planned: projects.filter(project => project.status === 'planned').length,
    completed: projects.filter(project => project.status === 'completed').length,
  };
}

export function getProjectErrorMessage(error) {
  if (error?.code === '23503') return 'Seçilen müşteri artık kullanılamıyor. Listeyi yenileyip tekrar deneyin.';
  if (error?.code === '23505') return 'Bu isimde bir proje çalışma alanında zaten bulunuyor.';
  if (error?.code === '23514') return 'Proje bilgilerinden biri geçerli değil.';
  if (error?.code === '42501') return 'Bu çalışma alanında proje oluşturma yetkiniz yok.';
  return 'Proje kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
