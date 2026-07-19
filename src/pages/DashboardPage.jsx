import {
  Activity, Building2, CheckSquare2, CircleAlert, FolderKanban,
  LoaderCircle, RefreshCw, Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Brand';
import { useAuth } from '../features/auth/AuthContext';
import { getUserIdentity } from '../features/auth/authUtils';
import { useClients } from '../features/clients/useClients';
import {
  getDashboardMetrics, getProjectDistribution, getRecentActiveProjects, getWeeklyTaskActivity,
} from '../features/dashboard/dashboardUtils';
import { useProjects } from '../features/projects/useProjects';
import { useTasks } from '../features/tasks/useTasks';
import { useTeamMembers } from '../features/team/useTeamMembers';

function StatCard({ label, value, helper, icon: Icon, progress }) {
  return (
    <article className="stat-card">
      <div className="stat-label"><span>{label}</span><i><Icon /></i></div>
      <strong>{value}</strong><p>{helper}</p>
      {progress !== undefined && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}
    </article>
  );
}

function WeeklyChart({ activity }) {
  return (
    <div className="chart-area">
      <div className="chart-grid"><i /><i /><i /><i /></div>
      <div className="bars">
        {activity.map(day => (
          <div className="bar-wrap" key={day.key}>
            <div className="bar-series">
              <i className="created" style={{ height: `${day.createdHeight}%` }} title={`${day.created} görev oluşturuldu`} />
              <i className="completed" style={{ height: `${day.completedHeight}%` }} title={`${day.completed} görev tamamlandı`} />
            </div>
            <small>{day.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectDistribution({ distribution }) {
  return (
    <div className="project-summary">
      <span className="summary-label">PROJE DURUMLARI <FolderKanban /></span>
      <div className="donut" style={{ background: distribution.gradient }}><div><b>{distribution.total}</b><small>PROJE</small></div></div>
      {distribution.items.length > 0 ? (
        <div className="donut-key">{distribution.items.map(item => <span key={item.status}><i style={{ background: item.color }} /> {item.label} <b>{item.count}</b></span>)}</div>
      ) : <p className="dashboard-summary-empty">Henüz aktif proje bulunmuyor.</p>}
    </div>
  );
}

function formatDueDate(date) {
  if (!date) return 'Teslim tarihi yok';
  return `${new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00`))} teslim`;
}

function ProjectList({ projects }) {
  if (!projects.length) {
    return <div className="dashboard-empty"><FolderKanban /><h3>Aktif proje bulunmuyor</h3><p>İlk müşteri projenizi oluşturduğunuzda burada görünecek.</p><Link className="soft-button" to="/projeler">Projelere git</Link></div>;
  }
  return (
    <div className="project-list">
      {projects.map(project => (
        <Link className="project-row" key={project.id} to="/projeler">
          <span className="project-icon"><FolderKanban /></span>
          <span className="project-name"><b>{project.name}</b><small>{project.clientName}</small></span>
          <span className="project-status">{project.statusLabel}</span>
          <span className="project-progress"><i><em style={{ width: `${project.progress}%` }} /></i><small>%{project.progress}</small></span>
          <span className="project-due-short">{formatDueDate(project.dueDate)}</span>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { clients, error: clientsError, loading: clientsLoading, refresh: refreshClients } = useClients();
  const { members, error: membersError, loading: membersLoading, refresh: refreshMembers } = useTeamMembers();
  const { projects, error: projectsError, loading: projectsLoading, refresh: refreshProjects } = useProjects();
  const { tasks, error: tasksError, loading: tasksLoading, refresh: refreshTasks } = useTasks();
  const identity = user ? getUserIdentity(user) : { firstName: 'Burak', fullName: 'Burak Enes', initials: 'BE' };
  const loading = clientsLoading || membersLoading || projectsLoading || tasksLoading;
  const error = clientsError || membersError || projectsError || tasksError;
  const metrics = getDashboardMetrics({ clients, members, projects, tasks });
  const activity = getWeeklyTaskActivity(tasks);
  const distribution = getProjectDistribution(projects);
  const recentProjects = getRecentActiveProjects(projects);
  const refresh = () => Promise.all([refreshClients(), refreshMembers(), refreshProjects(), refreshTasks()]);

  return (
    <>
      <section className="hero">
        <div className="eyebrow"><i /> DASHBOARD</div>
        <h1>Hoş geldiniz, {identity.firstName}</h1>
        <div className="presence"><Avatar small initials={identity.initials} /><span>{identity.fullName}</span><i /><Activity /><span>Canlı veri</span></div>
      </section>

      {loading && <section className="dashboard-state" role="status"><LoaderCircle className="spin" /><span>Çalışma alanı özeti hazırlanıyor…</span></section>}
      {!loading && error && <section className="dashboard-state error"><CircleAlert /><h2>Dashboard yüklenemedi</h2><p>Verilerden biri alınamadı. Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></section>}
      {!loading && !error && (
        <>
          <section className="stats-grid">
            <StatCard label="TOPLAM PROJE" value={metrics.projects} helper={`${metrics.activeProjects} proje devam ediyor`} icon={FolderKanban} />
            <StatCard label="GÖREVLER" value={metrics.tasks} helper={`${metrics.completedTasks} tamamlandı — %${metrics.taskCompletionRate}`} icon={CheckSquare2} progress={metrics.taskCompletionRate} />
            <StatCard label="MÜŞTERİLER" value={metrics.clients} helper={`${metrics.activeClients} aktif müşteri`} icon={Building2} />
            <StatCard label="EKİP" value={metrics.members} helper={`${metrics.activeMembers} aktif ekip üyesi`} icon={Users} />
          </section>

          <section className="analytics-card">
            <div className="section-heading">
              <div><h2><i /> Haftalık İlerleme</h2><p>Son 7 günün gerçek görev hareketi</p></div>
              <div className="legend"><span><i /> OLUŞTURULDU</span><span><i /> TAMAMLANDI</span></div>
            </div>
            <div className="analytics-content"><WeeklyChart activity={activity} /><ProjectDistribution distribution={distribution} /></div>
          </section>

          <section className="projects-card">
            <div className="section-heading">
              <div><h2><i /> Aktif Projeler</h2><p>Son oluşturulan devam eden çalışmalar</p></div>
              <Link className="soft-button" to="/projeler">Tümünü gör</Link>
            </div>
            <ProjectList projects={recentProjects} />
          </section>
        </>
      )}
    </>
  );
}
