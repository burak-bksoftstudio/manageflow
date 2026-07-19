export const MAX_TIME_ENTRY_NOTE_LENGTH = 500;
export const MAX_MANUAL_DURATION_MINUTES = 1440;

export function normalizeTimerForm(form = {}) {
  return {
    note: String(form.note || '').trim(),
    projectId: String(form.projectId || '').trim(),
    taskId: String(form.taskId || '').trim(),
  };
}

export function validateTimerForm(form, tasks = []) {
  const normalized = normalizeTimerForm(form);
  if (!normalized.projectId) return 'Süreyi bağlamak için bir proje seçin.';
  if (normalized.note.length > MAX_TIME_ENTRY_NOTE_LENGTH) {
    return `Açıklama en fazla ${MAX_TIME_ENTRY_NOTE_LENGTH} karakter olabilir.`;
  }
  if (normalized.taskId) {
    const task = tasks.find(item => item.id === normalized.taskId);
    if (!task || task.projectId !== normalized.projectId || task.isArchived) {
      return 'Seçilen görev bu proje için kullanılamıyor.';
    }
  }
  return '';
}

export function normalizeManualTimeForm(form = {}) {
  return {
    date: String(form.date || '').trim(),
    durationMinutes: Number(form.durationMinutes),
    note: String(form.note || '').trim(),
    projectId: String(form.projectId || '').trim(),
    startTime: String(form.startTime || '').trim(),
    taskId: String(form.taskId || '').trim(),
  };
}

export function getManualStartedAt(form) {
  const normalized = normalizeManualTimeForm(form);
  if (!normalized.date || !normalized.startTime) return null;
  const value = new Date(`${normalized.date}T${normalized.startTime}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function validateManualTimeForm(form, tasks = [], now = new Date()) {
  const normalized = normalizeManualTimeForm(form);
  const contextError = validateTimerForm(normalized, tasks);
  if (contextError) return contextError;
  if (!normalized.date || !normalized.startTime) return 'Çalışmanın tarihini ve başlangıç saatini girin.';
  if (!Number.isInteger(normalized.durationMinutes)
    || normalized.durationMinutes < 1
    || normalized.durationMinutes > MAX_MANUAL_DURATION_MINUTES) {
    return `Süre 1 ile ${MAX_MANUAL_DURATION_MINUTES} dakika arasında olmalıdır.`;
  }
  const startedAt = getManualStartedAt(normalized);
  if (!startedAt) return 'Geçerli bir tarih ve başlangıç saati girin.';
  const endedAt = new Date(startedAt.getTime() + normalized.durationMinutes * 60 * 1000);
  if (startedAt > now || endedAt > now) return 'Manuel süre gelecekte başlayamaz veya geleceğe uzanamaz.';
  return '';
}

export function mapDatabaseTimeEntry(entry, projectsById = new Map(), tasksById = new Map()) {
  const project = projectsById.get(entry.project_id);
  const task = entry.task_id ? tasksById.get(entry.task_id) : null;
  return {
    id: entry.id,
    organizationId: entry.organization_id,
    projectId: entry.project_id,
    projectName: project?.name || 'Proje bulunamadı',
    projectArchived: Boolean(project?.archived_at),
    taskId: entry.task_id || '',
    taskTitle: task?.title || '',
    taskArchived: Boolean(task?.archived_at),
    userId: entry.user_id,
    note: entry.note || '',
    entryType: entry.entry_type || 'timer',
    startedAt: entry.started_at,
    endedAt: entry.ended_at || '',
    durationSeconds: entry.duration_seconds ?? null,
    isActive: !entry.ended_at,
    createdAt: entry.created_at,
  };
}

export function getWeekBounds(value = new Date()) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { end, start };
}

export function getRangeSeconds(entry, rangeStart, rangeEnd, now = new Date()) {
  if (!entry?.startedAt) return 0;
  const entryStart = Math.max(toTime(entry.startedAt), new Date(rangeStart).getTime());
  const entryEnd = Math.min(
    entry.endedAt ? toTime(entry.endedAt) : new Date(now).getTime(),
    new Date(rangeEnd).getTime(),
  );
  return Math.max(0, Math.floor((entryEnd - entryStart) / 1000));
}

export function getWeeklyHistory(entries, weekDate = new Date(), filters = {}, now = new Date()) {
  const { start, end } = getWeekBounds(weekDate);
  const records = entries.filter(entry => (
    getRangeSeconds(entry, start, end, now) > 0
      && (!filters.projectId || entry.projectId === filters.projectId)
      && (!filters.taskId || entry.taskId === filters.taskId)
  ));
  return {
    end,
    entries: records,
    start,
    totalSeconds: records.reduce((total, entry) => total + getRangeSeconds(entry, start, end, now), 0),
  };
}

function toTime(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function getElapsedSeconds(entry, now = new Date()) {
  if (!entry?.startedAt) return 0;
  if (!entry.isActive && Number.isFinite(entry.durationSeconds)) return Math.max(0, entry.durationSeconds);
  const endTime = entry.endedAt ? toTime(entry.endedAt) : new Date(now).getTime();
  return Math.max(0, Math.floor((endTime - toTime(entry.startedAt)) / 1000));
}

export function getTodaySeconds(entry, now = new Date()) {
  if (!entry?.startedAt) return 0;
  const current = new Date(now);
  const dayStart = new Date(current);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const entryStart = Math.max(toTime(entry.startedAt), dayStart.getTime());
  const entryEnd = Math.min(entry.endedAt ? toTime(entry.endedAt) : current.getTime(), dayEnd.getTime());
  return Math.max(0, Math.floor((entryEnd - entryStart) / 1000));
}

export function getTimeTrackingStats(entries, now = new Date()) {
  const todayEntries = entries.filter(entry => getTodaySeconds(entry, now) > 0 || (
    entry.isActive && toTime(entry.startedAt) <= new Date(now).getTime()
  ));
  return {
    activeEntry: entries.find(entry => entry.isActive) || null,
    projects: new Set(todayEntries.map(entry => entry.projectId)).size,
    sessions: todayEntries.length,
    todaySeconds: todayEntries.reduce((total, entry) => total + getTodaySeconds(entry, now), 0),
  };
}

export function formatTimerDuration(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map(part => String(part).padStart(2, '0')).join(':');
}

export function formatCompactDuration(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (!hours && !minutes) return seconds ? `${seconds} sn` : '0 dk';
  if (!hours) return `${minutes} dk`;
  return minutes ? `${hours} sa ${minutes} dk` : `${hours} sa`;
}

export function formatTimeEntryRange(entry) {
  const formatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const start = formatter.format(new Date(entry.startedAt));
  return entry.endedAt ? `${start} – ${formatter.format(new Date(entry.endedAt))}` : `${start} – devam ediyor`;
}

export function formatTimeEntryDate(entry) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', weekday: 'short',
  }).format(new Date(entry.startedAt));
}

export function formatWeekRange(value = new Date()) {
  const { start, end } = getWeekBounds(value);
  const inclusiveEnd = new Date(end);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
  const formatter = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
  return `${formatter.format(start)} – ${formatter.format(inclusiveEnd)}`;
}

export function getTimeTrackingErrorMessage(error) {
  if (error?.code === '23505') return 'Zaten devam eden bir sayacınız var. Önce onu durdurun.';
  if (error?.code === '23503') return 'Seçilen proje veya görev artık zaman takibi için kullanılamıyor.';
  if (error?.code === '23514') return 'Süre bilgileri doğrulanamadı. Tarih, saat ve süreyi kontrol edin.';
  if (error?.code === '42501') return 'Bu çalışma alanında zaman takibi yapma yetkiniz yok.';
  return 'Zaman kaydı tamamlanamadı. Bağlantınızı kontrol edip tekrar deneyin.';
}
