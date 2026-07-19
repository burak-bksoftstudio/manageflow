import { PROJECT_STATUS_LABELS } from '../projects/projectUtils';

const PROJECT_STATUS_COLORS = {
  active: 'var(--accent)',
  on_hold: '#8e8e88',
  planned: '#d1a14c',
  completed: '#7eb49f',
};

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

function dateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDashboardMetrics({ clients, members, projects, tasks }) {
  const currentProjects = projects.filter(project => !project.isArchived);
  const currentTasks = tasks.filter(task => !task.isArchived && !task.projectArchived);
  const completedTasks = currentTasks.filter(task => task.status === 'done').length;
  return {
    projects: currentProjects.length,
    activeProjects: currentProjects.filter(project => project.status === 'active').length,
    tasks: currentTasks.length,
    completedTasks,
    taskCompletionRate: currentTasks.length ? Math.round((completedTasks / currentTasks.length) * 100) : 0,
    clients: clients.length,
    activeClients: clients.filter(client => client.status === 'active').length,
    members: members.filter(member => !member.isInvitation).length,
    activeMembers: members.filter(member => !member.isInvitation && member.status === 'active').length,
  };
}

export function getWeeklyTaskActivity(tasks, now = new Date()) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      key: dateKey(date),
      label: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date).replace('.', ''),
      created: 0,
      completed: 0,
    };
  });
  const daysByKey = new Map(days.map(day => [day.key, day]));
  tasks.filter(task => !task.isArchived && !task.projectArchived).forEach(task => {
    const createdDay = task.createdAt ? daysByKey.get(dateKey(task.createdAt)) : null;
    const completedDay = task.completedAt ? daysByKey.get(dateKey(task.completedAt)) : null;
    if (createdDay) createdDay.created += 1;
    if (completedDay) completedDay.completed += 1;
  });
  const maximum = Math.max(1, ...days.flatMap(day => [day.created, day.completed]));
  return days.map(day => ({
    ...day,
    createdHeight: Math.round((day.created / maximum) * 100),
    completedHeight: Math.round((day.completed / maximum) * 100),
  }));
}

export function getProjectDistribution(projects) {
  const currentProjects = projects.filter(project => !project.isArchived);
  const statuses = ['active', 'on_hold', 'planned', 'completed'];
  const items = statuses.map(status => ({
    status,
    label: PROJECT_STATUS_LABELS[status],
    color: PROJECT_STATUS_COLORS[status],
    count: currentProjects.filter(project => project.status === status).length,
  })).filter(item => item.count > 0);
  if (!currentProjects.length) {
    return { total: 0, items: [], gradient: 'var(--panel-soft)' };
  }
  let cursor = 0;
  const stops = items.map(item => {
    const start = cursor;
    cursor += (item.count / currentProjects.length) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  });
  return { total: currentProjects.length, items, gradient: `conic-gradient(${stops.join(', ')})` };
}

export function getRecentActiveProjects(projects, limit = 5) {
  return projects.filter(project => !project.isArchived && project.status !== 'completed')
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit);
}

export function getTodayAgenda(tasks, now = new Date()) {
  const today = dateKey(now);
  const items = tasks.filter(task => (
    !task.isArchived && !task.projectArchived && task.dueDate === today
  )).sort((left, right) => {
    if (left.status === 'done' && right.status !== 'done') return 1;
    if (right.status === 'done' && left.status !== 'done') return -1;
    return (PRIORITY_ORDER[left.priority] ?? 9) - (PRIORITY_ORDER[right.priority] ?? 9);
  });
  const importantItems = items.filter(task => ['urgent', 'high'].includes(task.priority));
  const focusItems = importantItems.length ? importantItems : items;
  return {
    items,
    focusCompleted: focusItems.filter(task => task.status === 'done').length,
    focusTotal: focusItems.length,
  };
}

