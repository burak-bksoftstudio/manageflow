import { getCommentAuthorInitials, getCommentAuthorName } from './commentUtils';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from './taskUtils';

function getProfileName(profile) {
  return getCommentAuthorName(profile);
}

function getProjectName(project) {
  return project?.name || 'Bilinmeyen proje';
}

function formatDueDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

export function getTaskActivityRelatedIds(rows) {
  const profileIds = new Set();
  const projectIds = new Set();
  rows.forEach(row => {
    if (row.actor_id) profileIds.add(row.actor_id);
    if (row.metadata?.old_assignee_id) profileIds.add(row.metadata.old_assignee_id);
    if (row.metadata?.new_assignee_id) profileIds.add(row.metadata.new_assignee_id);
    if (row.metadata?.project_id) projectIds.add(row.metadata.project_id);
    if (row.metadata?.old_project_id) projectIds.add(row.metadata.old_project_id);
    if (row.metadata?.new_project_id) projectIds.add(row.metadata.new_project_id);
  });
  return { profileIds: [...profileIds], projectIds: [...projectIds] };
}

export function describeTaskActivity(activity, profilesById = new Map(), projectsById = new Map()) {
  const metadata = activity.metadata || {};
  switch (activity.eventType) {
    case 'created': return 'Görevi oluşturdu.';
    case 'title_changed': return `Görev başlığını “${metadata.old_value}” → “${metadata.new_value}” olarak değiştirdi.`;
    case 'description_changed':
      if (!metadata.old_has_value && metadata.new_has_value) return 'Görev açıklamasını ekledi.';
      if (metadata.old_has_value && !metadata.new_has_value) return 'Görev açıklamasını kaldırdı.';
      return 'Görev açıklamasını güncelledi.';
    case 'project_changed': return `Projeyi “${getProjectName(projectsById.get(metadata.old_project_id))}” → “${getProjectName(projectsById.get(metadata.new_project_id))}” olarak değiştirdi.`;
    case 'status_changed': return `Durumu “${TASK_STATUS_LABELS[metadata.old_value] || metadata.old_value}” → “${TASK_STATUS_LABELS[metadata.new_value] || metadata.new_value}” olarak değiştirdi.`;
    case 'priority_changed': return `Önceliği “${TASK_PRIORITY_LABELS[metadata.old_value] || metadata.old_value}” → “${TASK_PRIORITY_LABELS[metadata.new_value] || metadata.new_value}” olarak değiştirdi.`;
    case 'assignee_changed': {
      const oldName = metadata.old_assignee_id ? getProfileName(profilesById.get(metadata.old_assignee_id)) : '';
      const newName = metadata.new_assignee_id ? getProfileName(profilesById.get(metadata.new_assignee_id)) : '';
      if (!oldName && newName) return `Görevi ${newName} kişisine atadı.`;
      if (oldName && !newName) return `${oldName} üzerindeki görev atamasını kaldırdı.`;
      return `Görevliyi ${oldName} → ${newName} olarak değiştirdi.`;
    }
    case 'due_date_changed': {
      const oldDate = formatDueDate(metadata.old_value);
      const newDate = formatDueDate(metadata.new_value);
      if (!oldDate && newDate) return `Bitiş tarihini ${newDate} olarak belirledi.`;
      if (oldDate && !newDate) return 'Bitiş tarihini kaldırdı.';
      return `Bitiş tarihini ${oldDate} → ${newDate} olarak değiştirdi.`;
    }
    case 'archived': return 'Görevi arşivledi.';
    case 'restored': return 'Görevi arşivden çıkardı.';
    default: return 'Görevde bir değişiklik yaptı.';
  }
}

export function mapDatabaseTaskActivity(row, profilesById = new Map(), projectsById = new Map()) {
  const actorName = getProfileName(profilesById.get(row.actor_id));
  const activity = {
    id: row.id,
    taskId: row.task_id,
    eventType: row.event_type,
    actorId: row.actor_id,
    actorName,
    actorInitials: getCommentAuthorInitials(actorName),
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
  return { ...activity, description: describeTaskActivity(activity, profilesById, projectsById) };
}

export function getTaskActivityErrorMessage(error) {
  if (error?.code === '42501') return 'Aktivite geçmişini görüntüleme yetkiniz yok.';
  return 'Aktivite geçmişi yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
