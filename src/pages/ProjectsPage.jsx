import { useEffect, useMemo, useState } from 'react';
import {
  Archive, ArchiveRestore, Building2, CalendarDays, Check, CircleAlert, Clock3,
  FileText, FolderKanban, Gauge, LoaderCircle, Pencil, Plus, RefreshCw, Search,
  ShieldCheck, Sparkles, UserMinus, UserPlus, UsersRound, X,
} from 'lucide-react';
import { useClients } from '../features/clients/useClients';
import { useOrganization } from '../features/organizations/OrganizationContext';
import {
  canManageProjects, filterProjects, getProjectErrorMessage, getProjectStats,
  normalizeProjectProgress, PROJECT_STATUS_LABELS, validateProject,
} from '../features/projects/projectUtils';
import { getProjectMemberErrorMessage } from '../features/projects/projectMemberUtils';
import { useProjectMembers } from '../features/projects/useProjectMembers';
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

function ProjectTeamSection({ projectId, isArchived, canManage }) {
  const {
    assignMember, assignedMembers, availableMembers, error: loadError, loading, refresh, removeMember,
  } = useProjectMembers(projectId);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [savingUserId, setSavingUserId] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setSelectedUserId(current => availableMembers.some(member => member.userId === current)
      ? current
      : availableMembers[0]?.userId || '');
  }, [availableMembers]);

  const assign = async () => {
    if (!selectedUserId) return;
    setSavingUserId(selectedUserId);
    setActionError('');
    const result = await assignMember(selectedUserId);
    setSavingUserId('');
    if (result.error) setActionError(getProjectMemberErrorMessage(result.error));
  };
  const remove = async userId => {
    setSavingUserId(userId);
    setActionError('');
    const result = await removeMember(userId);
    setSavingUserId('');
    if (result.error) setActionError(getProjectMemberErrorMessage(result.error));
  };

  return (
    <section className="project-team-section">
      <div className="project-team-head"><span><UsersRound /></span><div><small>PROJE EKİBİ</small><b>{assignedMembers.length} kişi atanmış</b></div></div>
      {loading && <div className="project-team-state"><LoaderCircle className="spin" /> Ekip yükleniyor…</div>}
      {!loading && loadError && <div className="project-team-state error"><CircleAlert /> Ekip yüklenemedi.<button onClick={refresh}>Tekrar dene</button></div>}
      {!loading && !loadError && assignedMembers.length === 0 && <div className="project-team-empty"><UsersRound /><span><b>Henüz kimse atanmadı</b><small>Yetkili kullanıcılar aktif ekip üyelerini projeye ekleyebilir.</small></span></div>}
      {!loading && !loadError && assignedMembers.length > 0 && <div className="project-team-list">{assignedMembers.map(member => <div className="project-team-member" key={member.userId}><i>{member.initials}</i><span><b>{member.name}{member.isCurrentUser ? ' · Siz' : ''}</b><small>{member.title} · {member.department}</small></span>{canManage && !isArchived && <button onClick={() => remove(member.userId)} disabled={Boolean(savingUserId)} aria-label={`${member.name} üyesini projeden çıkar`} title="Projeden çıkar">{savingUserId === member.userId ? <LoaderCircle className="spin" /> : <UserMinus />}</button>}</div>)}</div>}
      {canManage && !isArchived && !loading && !loadError && availableMembers.length > 0 && <div className="project-team-assign"><select value={selectedUserId} onChange={event => setSelectedUserId(event.target.value)} aria-label="Projeye atanacak ekip üyesi">{availableMembers.map(member => <option value={member.userId} key={member.userId}>{member.name} · {member.title}</option>)}</select><button onClick={assign} disabled={!selectedUserId || Boolean(savingUserId)}>{savingUserId === selectedUserId ? <LoaderCircle className="spin" /> : <UserPlus />} Ekle</button></div>}
      {canManage && !isArchived && !loading && !loadError && assignedMembers.length > 0 && availableMembers.length === 0 && <p className="project-team-complete"><Check /> Tüm aktif ekip üyeleri bu projede.</p>}
      {isArchived && <p className="project-team-locked"><Archive /> Arşivlenmiş projelerde ekip değiştirilemez.</p>}
      {actionError && <div className="form-error" role="alert">{actionError}</div>}
    </section>
  );
}

function ProjectDrawer({ project, clients, close, updateProject, setProjectArchived, canManage }) {
  const [draft, setDraft] = useState(project);
  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useModalDismiss(close, saving);
  const availableClients = useMemo(
    () => clients.filter(client => client.status === 'active' || client.id === draft.clientId),
    [clients, draft.clientId],
  );
  const update = event => {
    const { name, value } = event.target;
    setError('');
    setDraft(current => {
      if (name !== 'status') return { ...current, [name]: value };
      return {
        ...current,
        status: value,
        progress: normalizeProjectProgress(value, current.progress, current.status),
      };
    });
  };
  const persist = async () => {
    const validationError = validateProject(draft);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = await updateProject(project.id, draft);
    setSaving(false);
    if (result.error) { setError(getProjectErrorMessage(result.error)); return; }
    setDraft(result.data);
    setEditing(false);
  };
  const changeArchive = async archived => {
    setSaving(true);
    setError('');
    const result = await setProjectArchived(project.id, archived);
    setSaving(false);
    if (result.error) { setError(getProjectErrorMessage(result.error)); return; }
    setDraft(result.data);
    setConfirmingArchive(false);
  };

  return (
    <div className="drawer-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <aside className="drawer project-drawer" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="project-drawer-title">
        <div className="drawer-head"><div><span>PROJE DETAYI</span><h2 id="project-drawer-title">Proje özeti</h2></div><button className="icon-button" onClick={close} disabled={saving} aria-label="Paneli kapat"><X /></button></div>
        <div className="project-drawer-profile"><i><FolderKanban /></i><h3>{draft.name}</h3><p>{draft.clientName}</p><span className={`project-status-pill ${draft.isArchived ? 'archived' : draft.status}`}>{draft.isArchived ? 'Arşivlendi' : PROJECT_STATUS_LABELS[draft.status]}</span></div>

        {editing ? (
          <div className="drawer-form project-drawer-form">
            <label>Proje adı<input required name="name" maxLength="160" value={draft.name} onChange={update} /></label>
            <label>Müşteri<select name="clientId" value={draft.clientId} onChange={update}>{availableClients.map(client => <option key={client.id} value={client.id}>{client.name}{client.status !== 'active' ? ' · Pasif' : ''}</option>)}</select></label>
            <label>Durum<select name="status" value={draft.status} onChange={update}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>İlerleme (%)<input name="progress" type="number" min="0" max={draft.status === 'completed' ? '100' : '99'} step="1" value={draft.progress} onChange={update} disabled={draft.status === 'completed'} /></label>
            <div className="project-progress-preview"><i><em style={{ width: `${draft.progress}%` }} /></i><b>%{draft.progress}</b></div>
            <label>Başlangıç tarihi<input name="startDate" type="date" value={draft.startDate} onChange={update} /></label>
            <label>Bitiş tarihi<input name="dueDate" type="date" min={draft.startDate || undefined} value={draft.dueDate} onChange={update} /></label>
            <label>Açıklama<textarea name="description" maxLength="2000" value={draft.description} onChange={update} placeholder="Projenin kapsamını yazın…" /></label>
            {draft.status === 'completed' && <p className="project-completion-note"><Check /> Tamamlanan projelerin ilerlemesi otomatik olarak %100 tutulur.</p>}
            {error && <div className="form-error" role="alert">{error}</div>}
          </div>
        ) : (
          <>
            <div className="project-details">
              <div><Building2 /><span><small>MÜŞTERİ</small><b>{draft.clientName}</b></span></div>
              <div><Gauge /><span><small>İLERLEME</small><b>%{draft.progress}</b><i><em style={{ width: `${draft.progress}%` }} /></i></span></div>
              <div><CalendarDays /><span><small>TAKVİM</small><b>{formatDate(draft.startDate)} → {formatDate(draft.dueDate)}</b></span></div>
              <div><FileText /><span><small>AÇIKLAMA</small><b className="project-description">{draft.description || 'Henüz açıklama eklenmedi.'}</b></span></div>
            </div>
            {!canManage && <p className="owner-note"><ShieldCheck /> Bu projeyi görüntüleyebilirsiniz; düzenleme için yönetici veya proje yöneticisi rolü gerekir.</p>}
            {draft.isArchived && <p className="project-archive-note"><Archive /> Bu proje arşivde tutuluyor. Verileri silinmedi ve yetkili kullanıcı tarafından yeniden açılabilir.</p>}
          </>
        )}

        {!editing && <ProjectTeamSection projectId={draft.id} isArchived={draft.isArchived} canManage={canManage} />}

        {confirmingArchive && <div className="deactivate-confirm" role="alert"><b>Proje arşivlensin mi?</b><p>Proje silinmeyecek; müşteri bağlantısı ve geçmiş çalışma bağlamı korunacak.</p>{error && <div className="form-error">{error}</div>}<div><button className="soft-button" onClick={() => setConfirmingArchive(false)} disabled={saving}>Vazgeç</button><button className="danger-button" onClick={() => changeArchive(true)} disabled={saving}>{saving ? 'Arşivleniyor…' : 'Arşivle'}</button></div></div>}
        {!confirmingArchive && canManage && <div className="drawer-actions project-drawer-actions">
          {editing ? <><button className="soft-button" onClick={() => { setDraft(project); setEditing(false); setError(''); }} disabled={saving}>Vazgeç</button><button className="agenda-button" onClick={persist} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Check />}{saving ? 'Kaydediliyor…' : 'Kaydet'}</button></> : draft.isArchived ? <button className="agenda-button" onClick={() => changeArchive(false)} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <ArchiveRestore />}{saving ? 'Açılıyor…' : 'Arşivden çıkar'}</button> : <><button className="agenda-button" onClick={() => setEditing(true)}><Pencil /> Düzenle</button><button className="soft-button project-archive-button" onClick={() => setConfirmingArchive(true)}><Archive /> Arşivle</button></>}
        </div>}
      </aside>
    </div>
  );
}

export default function ProjectsPage() {
  const {
    projects, createProject, error, loading, refresh, setProjectArchived: persistArchive, updateProject: persistProject,
  } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const { activeOrganization } = useOrganization();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [clientId, setClientId] = useState('all');
  const [archive, setArchive] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState('');
  const canManage = canManageProjects(activeOrganization?.role);
  const activeClients = useMemo(() => clients.filter(client => client.status === 'active'), [clients]);
  const stats = useMemo(() => getProjectStats(projects), [projects]);
  const filteredProjects = useMemo(
    () => filterProjects(projects, { query, status, clientId, archive }),
    [archive, clientId, projects, query, status],
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
  const updateProject = async (projectId, form) => {
    const result = await persistProject(projectId, form);
    if (!result.error) {
      setSelectedProject(result.data);
      setToast(`${result.data.name} güncellendi.`);
    }
    return result;
  };
  const setProjectArchived = async (projectId, archived) => {
    const result = await persistArchive(projectId, archived);
    if (!result.error) {
      setSelectedProject(result.data);
      setToast(archived ? `${result.data.name} arşivlendi.` : `${result.data.name} yeniden açıldı.`);
    }
    return result;
  };

  const createTitle = !canManage
    ? 'Proje oluşturmak için yönetici veya proje yöneticisi rolü gerekir'
    : creationBlocked ? 'Proje oluşturmak için önce aktif bir müşteri gerekir' : undefined;

  return (
    <>
      <section className="project-hero"><div><div className="eyebrow"><i /> PROJE YÖNETİMİ</div><h1>İşleriniz, doğru bağlamda.</h1><p>Müşteri işlerini projelere dönüştürün; ilerlemeyi tek çalışma alanından izleyin.</p></div><button className="agenda-button project-primary" onClick={() => setModalOpen(true)} disabled={!canManage || creationBlocked} title={createTitle}><Plus /> Yeni proje</button></section>

      <section className="project-stats-grid">
        <ProjectStat label="TOPLAM PROJE" value={stats.total} helper="Arşiv dışındaki projeler" icon={FolderKanban} />
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
          <select value={archive} onChange={event => setArchive(event.target.value)} aria-label="Arşiv durumuna göre filtrele"><option value="active">Aktif projeler</option><option value="archived">Arşivlenenler</option><option value="all">Tümü</option></select>
        </div>
        <div className="project-table">
          <div className="project-table-head"><span>PROJE</span><span>MÜŞTERİ</span><span>DURUM</span><span>İLERLEME</span><span>TAKVİM</span><span>OLUŞTURULMA</span></div>
          {loading && <div className="projects-state" role="status"><LoaderCircle className="spin" /><span>Projeler yükleniyor…</span></div>}
          {!loading && error && <div className="projects-state error"><CircleAlert /><h3>Projeler yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
          {!loading && !error && filteredProjects.map(project => (
            <button className="project-list-row" key={project.id} onClick={() => setSelectedProject(project)}>
              <span className="project-list-identity"><i><FolderKanban /></i><span><b>{project.name}</b><small>{project.description || 'Açıklama eklenmedi'}</small></span></span>
              <span className="project-client"><Building2 /><span><b>{project.clientName}</b><small>Müşteri</small></span></span>
              <span className={`project-status-pill ${project.isArchived ? 'archived' : project.status}`}>{project.isArchived ? 'Arşivlendi' : project.statusLabel}</span>
              <span className="project-list-progress"><i><em style={{ width: `${project.progress}%` }} /></i><small>%{project.progress}</small></span>
              <span className="project-dates"><span><CalendarDays />{formatDate(project.startDate)}</span><small>{project.dueDate ? `${formatDate(project.dueDate)} teslim` : 'Teslim tarihi yok'}</small></span>
              <span className="project-created">{project.createdAtLabel}</span>
            </button>
          ))}
          {!loading && !error && projects.length === 0 && <div className="projects-state empty"><FolderKanban /><h3>İlk projenizi oluşturun</h3><p>{activeClients.length ? 'Aktif müşteriniz için ilk işi başlatabilirsiniz.' : 'Proje oluşturabilmek için önce aktif bir müşteri ekleyin.'}</p>{canManage && activeClients.length > 0 && <button className="soft-button" onClick={() => setModalOpen(true)}><Plus /> Proje oluştur</button>}</div>}
          {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && <div className="projects-state empty"><Search /><h3>Eşleşen proje bulunamadı</h3><p>Arama metnini veya filtreleri değiştirin.</p></div>}
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {modalOpen && <CreateProjectModal clients={activeClients} close={closeModal} createProject={createProject} />}
      {selectedProject && <ProjectDrawer project={selectedProject} clients={clients} close={() => setSelectedProject(null)} updateProject={updateProject} setProjectArchived={setProjectArchived} canManage={canManage} />}
    </>
  );
}
