import { useEffect, useMemo, useState } from 'react';
import {
  Building2, CalendarDays, Check, CircleAlert, CirclePause, Clock3, FolderKanban,
  LoaderCircle, Plus, RefreshCw, Search, Sparkles, X,
} from 'lucide-react';
import { useClients } from '../features/clients/useClients';
import { useOrganization } from '../features/organizations/OrganizationContext';
import {
  canManageProjects, filterProjects, getProjectErrorMessage, getProjectStats,
  PROJECT_STATUS_LABELS, validateProject,
} from '../features/projects/projectUtils';
import { useProjects } from '../features/projects/useProjects';

const statusOptions = Object.entries(PROJECT_STATUS_LABELS);

function ProjectStat({ label, value, helper, icon: Icon }) {
  return <article className="project-stat"><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}

function useModalDismiss(close, disabled) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = event => event.key === 'Escape' && !disabled && close();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [close, disabled]);
}

function CreateProjectModal({ clients, close, createProject }) {
  const [form, setForm] = useState({
    name: '', clientId: clients[0]?.id || '', description: '', status: 'planned', startDate: '', dueDate: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useModalDismiss(close, saving);
  const update = event => {
    setError('');
    setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  };
  const submit = async event => {
    event.preventDefault();
    const validationError = validateProject(form);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = await createProject(form);
    setSaving(false);
    if (result.error) { setError(getProjectErrorMessage(result.error)); return; }
    close({ created: result.data });
  };

  return (
    <div className="modal-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <form className="modal project-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
        <div className="modal-head"><div><span>YENİ PROJE</span><h2 id="project-modal-title">Müşteri işini başlatın</h2><p>Projeyi bir müşteriye bağlayarak çalışma bağlamını oluşturun.</p></div><button type="button" className="icon-button" onClick={close} disabled={saving} aria-label="Pencereyi kapat"><X /></button></div>
        <div className="project-form-grid">
          <label className="full-field">Proje adı<input autoFocus required name="name" maxLength="160" value={form.name} onChange={update} placeholder="Örn. Kurumsal web sitesi" /></label>
          <label className="full-field">Müşteri<select required name="clientId" value={form.clientId} onChange={update}><option value="" disabled>Müşteri seçin</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label>Durum<select name="status" value={form.status} onChange={update}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Başlangıç tarihi<input name="startDate" type="date" value={form.startDate} onChange={update} /></label>
          <label>Bitiş tarihi<input name="dueDate" type="date" min={form.startDate || undefined} value={form.dueDate} onChange={update} /></label>
          <label className="full-field">Açıklama<textarea name="description" maxLength="2000" value={form.description} onChange={update} placeholder="Projenin kapsamını kısaca yazın…" /></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="soft-button" onClick={close} disabled={saving}>Vazgeç</button><button className="agenda-button" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Plus />}{saving ? 'Kaydediliyor…' : 'Projeyi oluştur'}</button></div>
      </form>
    </div>
  );
}

function formatDate(date) {
  if (!date) return 'Tarih belirlenmedi';
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export default function ProjectsPage() {
  const { projects, createProject, error, loading, refresh } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const { activeOrganization } = useOrganization();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [clientId, setClientId] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const canManage = canManageProjects(activeOrganization?.role);
  const activeClients = useMemo(() => clients.filter(client => client.status === 'active'), [clients]);
  const stats = useMemo(() => getProjectStats(projects), [projects]);
  const filteredProjects = useMemo(
    () => filterProjects(projects, { query, status, clientId }),
    [clientId, projects, query, status],
  );
  const creationBlocked = clientsLoading || activeClients.length === 0;

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const closeModal = result => {
    setModalOpen(false);
    if (result?.created) setToast(`${result.created.name} projesi oluşturuldu.`);
  };

  const createTitle = !canManage
    ? 'Proje oluşturmak için yönetici veya proje yöneticisi rolü gerekir'
    : creationBlocked ? 'Proje oluşturmak için önce aktif bir müşteri gerekir' : undefined;

  return (
    <>
      <section className="project-hero"><div><div className="eyebrow"><i /> PROJE YÖNETİMİ</div><h1>İşleriniz, doğru bağlamda.</h1><p>Müşteri işlerini projelere dönüştürün; ilerlemeyi tek çalışma alanından izleyin.</p></div><button className="agenda-button project-primary" onClick={() => setModalOpen(true)} disabled={!canManage || creationBlocked} title={createTitle}><Plus /> Yeni proje</button></section>

      <section className="project-stats-grid">
        <ProjectStat label="TOPLAM PROJE" value={stats.total} helper="Çalışma alanındaki projeler" icon={FolderKanban} />
        <ProjectStat label="DEVAM EDİYOR" value={stats.active} helper="Aktif yürütülen işler" icon={Sparkles} />
        <ProjectStat label="PLANLANDI" value={stats.planned} helper="Başlamayı bekleyen işler" icon={Clock3} />
        <ProjectStat label="TAMAMLANDI" value={stats.completed} helper="Teslim edilen projeler" icon={Check} />
      </section>

      <section className="project-list-card">
        <div className="project-list-head"><div><h2>Proje listesi</h2><p>{filteredProjects.length} proje görüntüleniyor</p></div></div>
        <div className="project-toolbar">
          <label className="project-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Proje, müşteri veya açıklama ara" /></label>
          <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Proje durumuna göre filtrele"><option value="all">Tüm durumlar</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={clientId} onChange={event => setClientId(event.target.value)} aria-label="Müşteriye göre filtrele"><option value="all">Tüm müşteriler</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
        </div>
        <div className="project-table">
          <div className="project-table-head"><span>PROJE</span><span>MÜŞTERİ</span><span>DURUM</span><span>İLERLEME</span><span>TAKVİM</span><span>OLUŞTURULMA</span></div>
          {loading && <div className="projects-state" role="status"><LoaderCircle className="spin" /><span>Projeler yükleniyor…</span></div>}
          {!loading && error && <div className="projects-state error"><CircleAlert /><h3>Projeler yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
          {!loading && !error && filteredProjects.map(project => (
            <article className="project-list-row" key={project.id}>
              <span className="project-list-identity"><i><FolderKanban /></i><span><b>{project.name}</b><small>{project.description || 'Açıklama eklenmedi'}</small></span></span>
              <span className="project-client"><Building2 /><span><b>{project.clientName}</b><small>Müşteri</small></span></span>
              <span className={`project-status-pill ${project.status}`}>{project.status === 'on_hold' && <CirclePause />}{project.statusLabel}</span>
              <span className="project-list-progress"><i><em style={{ width: `${project.progress}%` }} /></i><small>%{project.progress}</small></span>
              <span className="project-dates"><span><CalendarDays />{formatDate(project.startDate)}</span><small>{project.dueDate ? `${formatDate(project.dueDate)} teslim` : 'Teslim tarihi yok'}</small></span>
              <span className="project-created">{project.createdAtLabel}</span>
            </article>
          ))}
          {!loading && !error && projects.length === 0 && <div className="projects-state empty"><FolderKanban /><h3>İlk projenizi oluşturun</h3><p>{activeClients.length ? 'Aktif müşteriniz için ilk işi başlatabilirsiniz.' : 'Proje oluşturabilmek için önce aktif bir müşteri ekleyin.'}</p>{canManage && activeClients.length > 0 && <button className="soft-button" onClick={() => setModalOpen(true)}><Plus /> Proje oluştur</button>}</div>}
          {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && <div className="projects-state empty"><Search /><h3>Eşleşen proje bulunamadı</h3><p>Arama metnini veya filtreleri değiştirin.</p></div>}
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {modalOpen && <CreateProjectModal clients={activeClients} close={closeModal} createProject={createProject} />}
    </>
  );
}
