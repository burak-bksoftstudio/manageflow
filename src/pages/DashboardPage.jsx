import {
  Activity, CheckSquare2, CirclePlus, FolderKanban,
  MessageSquare, Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Brand';

function StatCard({ label, value, helper, icon: Icon, progress }) {
  return (
    <article className="stat-card">
      <div className="stat-label"><span>{label}</span><i><Icon /></i></div>
      <strong>{value}</strong><p>{helper}</p>
      {progress !== undefined && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}
    </article>
  );
}

function WeeklyChart() {
  const values = [28, 50, 41, 70, 55, 82, 76];
  return (
    <div className="chart-area">
      <div className="chart-grid"><i /><i /><i /><i /></div>
      <div className="bars">
        {values.map((value, index) => (
          <div className="bar-wrap" key={index}>
            <div className="bar" style={{ height: `${value}%` }}><span /></div>
            <small>{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][index]}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectList({ projects }) {
  return (
    <div className="project-list">
      {projects.map(project => (
        <button className="project-row" key={project.name}>
          <span className="project-icon"><FolderKanban /></span>
          <span className="project-name"><b>{project.name}</b><small>{project.client}</small></span>
          <span className="project-status">{project.status}</span>
          <span className="project-progress"><i><em style={{ width: `${project.progress}%` }} /></i><small>%{project.progress}</small></span>
          <span className="row-soon">Yakında</span>
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage({ projects, taskCount }) {
  return (
    <>
      <section className="hero">
        <div className="eyebrow"><i /> DASHBOARD</div>
        <h1>Hoş geldiniz, Burak</h1>
        <div className="presence"><Avatar small /><span>Burak Enes</span><i /><Activity /><span>Canlı veri</span></div>
      </section>

      <section className="stats-grid">
        <StatCard label="TOPLAM PROJE" value={projects.length} helper={`${projects.length} aktif proje`} icon={FolderKanban} />
        <StatCard label="GÖREVLER" value={taskCount} helper={`${Math.round(taskCount * .64)} tamamlandı — %64`} icon={CheckSquare2} progress={64} />
        <StatCard label="MESAJLAR" value="12" helper="Son 30 gün" icon={MessageSquare} />
        <StatCard label="EKİP & MÜŞTERİ" value="8" helper="3 müşteri · 5 ekip üyesi" icon={Users} />
      </section>

      <section className="analytics-card">
        <div className="section-heading">
          <div><h2><i /> Haftalık İlerleme</h2><p>Son 7 günün özeti</p></div>
          <div className="legend"><span><i /> GÖREVLER</span><span><i /> TAMAMLANDI</span></div>
        </div>
        <div className="analytics-content">
          <WeeklyChart />
          <div className="project-summary">
            <span className="summary-label">PROJE DURUMLARI <CirclePlus /></span>
            <div className="donut"><div><b>3</b><small>PROJE</small></div></div>
            <div className="donut-key"><span><i /> Devam ediyor <b>1</b></span><span><i /> İncelemede <b>1</b></span><span><i /> Planlandı <b>1</b></span></div>
          </div>
        </div>
      </section>

      <section className="projects-card">
        <div className="section-heading">
          <div><h2><i /> Aktif Projeler</h2><p>Son güncellenen çalışmalar</p></div>
          <Link className="soft-button" to="/projeler">Tümünü gör <small className="soon-inline">Yakında</small></Link>
        </div>
        <ProjectList projects={projects} />
      </section>
    </>
  );
}
