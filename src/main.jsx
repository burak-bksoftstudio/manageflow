import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlarmClock, Bell, BriefcaseBusiness, CalendarDays, Check,
  CheckSquare2, ChevronDown, ChevronLeft, ChevronRight, CirclePlus,
  Clock3, Command, Files, FolderKanban, LayoutDashboard, ListTodo,
  Megaphone, Menu, MessageSquare, Moon, MoreHorizontal, Plus, Search,
  Settings2, Sparkles, Sun, Users, X, Zap
} from 'lucide-react';
import './styles.css';

const navGroups = [
  {
    label: 'ÇALIŞMA',
    title: 'Proje & Görev',
    icon: BriefcaseBusiness,
    items: [
      ['Projeler', FolderKanban],
      ['Görevler', CheckSquare2],
      ['Çalışma Alanı', Files],
      ['Dosyalar', Files],
      ['Zaman Takibi', AlarmClock],
      ['Takımlar', Users],
      ['Özelleştirme', Settings2],
    ],
  },
  {
    label: 'İLETİŞİM',
    title: 'Ekip & Müşteri',
    icon: MessageSquare,
    items: [
      ['Kanallar', MessageSquare],
      ['Gelen Kutusu', Bell],
      ['Takvim', CalendarDays],
    ],
  },
];

const initialProjects = [
  { name: 'Yeni web sitesi', client: 'North Studio', progress: 72, status: 'Devam ediyor' },
  { name: 'Mobil uygulama', client: 'Atlas Labs', progress: 46, status: 'Planlandı' },
  { name: 'Marka yenileme', client: 'Mono Coffee', progress: 91, status: 'İncelemede' },
];

function Logo() {
  return <div className="logo" aria-label="Manage"><span>M</span><i /></div>;
}

function Avatar({ small = false }) {
  return <span className={`avatar ${small ? 'small' : ''}`}>BE</span>;
}

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, active, setActive }) {
  const [openGroups, setOpenGroups] = useState([true, false]);
  const choose = (name) => { setActive(name); setMobileOpen(false); };
  return (
    <>
      {mobileOpen && <button className="scrim" aria-label="Menüyü kapat" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="side-top">
          <Logo />
          <button className="icon-button collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label="Menüyü daralt">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)}><X /></button>
        </div>

        <button className="organization">
          <Avatar />
          <span className="organization-copy"><b>Burak'ın Çalışma Alanı</b><small>Yönetici</small></span>
          <ChevronDown />
        </button>

        <nav>
          <button className={`nav-item top-level ${active === 'Dashboard' ? 'active' : ''}`} onClick={() => choose('Dashboard')}>
            <LayoutDashboard /><span>Dashboard</span>
          </button>
          <button className={`nav-item top-level ${active === 'Mana' ? 'active' : ''}`} onClick={() => choose('Mana')}>
            <Sparkles /><span>Mana</span><em>AI</em>
          </button>

          {navGroups.map((group, groupIndex) => (
            <div className="nav-group" key={group.label}>
              <div className="group-label">{group.label}</div>
              <button className="nav-item group-title" onClick={() => setOpenGroups(v => v.map((x, i) => i === groupIndex ? !x : x))}>
                <group.icon /><span>{group.title}</span><ChevronDown className={openGroups[groupIndex] ? 'rotated' : ''} />
              </button>
              {openGroups[groupIndex] && <div className="subnav">
                {group.items.map(([name, Icon]) => (
                  <button key={name} className={`nav-item ${active === name ? 'active-sub' : ''}`} onClick={() => choose(name)}>
                    <Icon /><span>{name}</span>
                  </button>
                ))}
              </div>}
            </div>
          ))}
        </nav>

        <div className="account">
          <Avatar />
          <span><b>Burak Enes</b><small>burak@manage.co</small></span>
          <ChevronRight />
        </div>
      </aside>
    </>
  );
}

function Header({ setMobileOpen, dark, setDark, openModal, setAgendaOpen, notificationOpen, setNotificationOpen }) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="header">
      <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Menu /></button>
      <button className="agenda-button" onClick={() => setAgendaOpen(true)}><CalendarDays /> Bugünkü Gündem</button>
      <button className="soft-button projects-shortcut"><FolderKanban /> Projeler</button>
      <span className="header-separator" />
      <button className="round-button" onClick={() => openModal('create')} aria-label="Yeni oluştur"><Plus /></button>
      <button className="round-button" onClick={() => setDark(!dark)} aria-label="Temayı değiştir">{dark ? <Sun /> : <Moon />}</button>
      <button className="round-button" onClick={() => setSearchOpen(true)} aria-label="Ara"><Search /></button>
      <div className="relative">
        <button className="round-button" onClick={() => setNotificationOpen(!notificationOpen)} aria-label="Bildirimler"><Bell /></button>
        <span className="dot" />
        {notificationOpen && <div className="popover notifications">
          <div className="popover-title"><b>Bildirimler</b><span>3 yeni</span></div>
          {['Ece yeni görevi sana atadı.', 'Web sitesi projesinde yorum var.', 'Toplantın 30 dakika sonra.'].map((x, i) => <div className="notification" key={x}><i className={i === 2 ? 'amber' : ''} /><span>{x}<small>{i + 1} saat önce</small></span></div>)}
        </div>}
      </div>
      <button className="round-button badge-button" aria-label="Duyurular"><Megaphone /><b>9+</b></button>

      {searchOpen && <div className="search-overlay" onMouseDown={() => setSearchOpen(false)}>
        <div className="search-box" onMouseDown={e => e.stopPropagation()}>
          <Search /><input autoFocus placeholder="Proje, görev, kişi veya dosya ara..." /><kbd>ESC</kbd>
          <div className="search-hint"><Command /> Aramaya başlayın — sonuçlar burada görünecek.</div>
        </div>
      </div>}
    </header>
  );
}

function StatCard({ label, value, helper, icon: Icon, progress }) {
  return <article className="stat-card">
    <div className="stat-label"><span>{label}</span><i><Icon /></i></div>
    <strong>{value}</strong>
    <p>{helper}</p>
    {progress !== undefined && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}
  </article>;
}

function WeeklyChart() {
  const values = [28, 50, 41, 70, 55, 82, 76];
  return <div className="chart-area">
    <div className="chart-grid"><i /><i /><i /><i /></div>
    <div className="bars">{values.map((v, i) => <div className="bar-wrap" key={i}><div className="bar" style={{ height: `${v}%` }}><span /></div><small>{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</small></div>)}</div>
  </div>;
}

function ProjectList({ projects }) {
  return <div className="project-list">
    {projects.map((project) => <button className="project-row" key={project.name}>
      <span className="project-icon"><FolderKanban /></span>
      <span className="project-name"><b>{project.name}</b><small>{project.client}</small></span>
      <span className="project-status">{project.status}</span>
      <span className="project-progress"><i><em style={{ width: `${project.progress}%` }} /></i><small>%{project.progress}</small></span>
      <MoreHorizontal />
    </button>)}
  </div>;
}

function Dashboard({ projects, taskCount, openModal }) {
  return <>
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
        <button className="soft-button" onClick={() => openModal('project')}>Tümünü gör <ChevronRight /></button>
      </div>
      <ProjectList projects={projects} />
    </section>
  </>;
}

function Placeholder({ page }) {
  return <section className="placeholder-page"><div className="eyebrow"><i /> ÇALIŞMA ALANI</div><h1>{page}</h1><p>Bu modül dashboard tasarım sistemiyle birlikte kullanıma hazırlanıyor.</p><div className="placeholder-card"><Sparkles /><h2>{page} alanınız hazır</h2><p>Yeni kayıt ekleyerek çalışma alanınızı oluşturmaya başlayın.</p><button className="agenda-button"><Plus /> Yeni oluştur</button></div></section>;
}

function Modal({ type, close, addProject, addTask }) {
  const [name, setName] = useState('');
  const [choice, setChoice] = useState('project');
  const submit = e => {
    e.preventDefault();
    if (!name.trim()) return;
    if ((type === 'create' ? choice : type) === 'project') addProject(name);
    else addTask();
    close();
  };
  return <div className="modal-layer" onMouseDown={close}><form className="modal" onSubmit={submit} onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><div><span>HIZLI OLUŞTUR</span><h2>Yeni bir şey başlatın</h2></div><button type="button" className="icon-button" onClick={close}><X /></button></div>
    {type === 'create' && <div className="choice-row"><button type="button" className={choice === 'project' ? 'selected' : ''} onClick={() => setChoice('project')}><FolderKanban /> Proje</button><button type="button" className={choice === 'task' ? 'selected' : ''} onClick={() => setChoice('task')}><ListTodo /> Görev</button></div>}
    <label>{(type === 'task' || choice === 'task') ? 'Görev adı' : 'Proje adı'}<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Örn. Yeni web sitesi" /></label>
    <label>Müşteri / Proje<select><option>North Studio</option><option>Atlas Labs</option><option>Mono Coffee</option></select></label>
    <div className="modal-actions"><button type="button" className="soft-button" onClick={close}>Vazgeç</button><button className="agenda-button"><Plus /> Oluştur</button></div>
  </form></div>;
}

function AgendaDrawer({ close }) {
  return <div className="drawer-layer" onMouseDown={close}><aside className="drawer" onMouseDown={e => e.stopPropagation()}>
    <div className="drawer-head"><div><span>18 TEMMUZ, CUMARTESİ</span><h2>Bugünkü Gündem</h2></div><button className="icon-button" onClick={close}><X /></button></div>
    <div className="focus-card"><Zap /><span><small>GÜNÜN ODAĞI</small><b>3 önemli işi tamamla</b></span><strong>2/3</strong></div>
    {[['09:30', 'Haftalık ekip toplantısı', 'Toplantı'], ['12:00', 'Ana sayfa tasarımını gözden geçir', 'Görev'], ['15:30', 'Müşteri sunumu', 'Toplantı']].map(([time, title, type], i) => <div className="agenda-item" key={title}><span>{time}</span><i className={i === 1 ? 'done' : ''}>{i === 1 && <Check />}</i><div><b>{title}</b><small>{type}</small></div></div>)}
    <button className="soft-button full"><Plus /> Gündeme ekle</button>
  </aside></div>;
}

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState('Dashboard');
  const [dark, setDark] = useState(false);
  const [modal, setModal] = useState(null);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [projects, setProjects] = useState(initialProjects);
  const [taskCount, setTaskCount] = useState(28);

  const addProject = name => setProjects(v => [{ name, client: 'Yeni müşteri', progress: 0, status: 'Planlandı' }, ...v]);
  const addTask = () => setTaskCount(v => v + 1);
  const shellClass = useMemo(() => `${dark ? 'dark' : ''} ${collapsed ? 'is-collapsed' : ''}`, [dark, collapsed]);

  return <div className={`app-shell ${shellClass}`}>
    <Sidebar {...{ collapsed, setCollapsed, mobileOpen, setMobileOpen, active, setActive }} />
    <main>
      <Header {...{ setMobileOpen, dark, setDark, setAgendaOpen, notificationOpen, setNotificationOpen }} openModal={setModal} />
      <div className="page-content">
        {active === 'Dashboard' ? <Dashboard {...{ projects, taskCount }} openModal={setModal} /> : <Placeholder page={active} />}
      </div>
    </main>
    {modal && <Modal type={modal} close={() => setModal(null)} {...{ addProject, addTask }} />}
    {agendaOpen && <AgendaDrawer close={() => setAgendaOpen(false)} />}
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
