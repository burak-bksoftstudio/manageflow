import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Check, CheckCheck, CheckSquare2, CircleAlert,
  FolderKanban, ListTodo, LoaderCircle, Plus, RefreshCw, Search, Timer, X,
} from 'lucide-react';
import { useOrganization } from '../features/organizations/OrganizationContext';
import { useProjectMembers } from '../features/projects/useProjectMembers';
import { useProjects } from '../features/projects/useProjects';
import {
  canManageTasks, filterTasks, getTaskErrorMessage, getTaskStats, TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS, validateTask,
} from '../features/tasks/taskUtils';
import { useTasks } from '../features/tasks/useTasks';

const statusOptions = Object.entries(TASK_STATUS_LABELS);
const priorityOptions = Object.entries(TASK_PRIORITY_LABELS);

function TaskStat({ label, value, helper, icon: Icon }) {
  return <article className="task-stat"><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
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

function CreateTaskModal({ projects, close, createTask }) {
  const [form, setForm] = useState({
    title: '', projectId: projects[0]?.id || '', assigneeId: '', description: '', status: 'todo', priority: 'normal', dueDate: '',
  });
  const { assignedMembers, loading: membersLoading } = useProjectMembers(form.projectId);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useModalDismiss(close, saving);

  useEffect(() => {
    setForm(current => assignedMembers.some(member => member.userId === current.assigneeId)
      ? current
      : { ...current, assigneeId: '' });
  }, [assignedMembers]);

  const update = event => {
    const { name, value } = event.target;
    setError('');
    setForm(current => name === 'projectId'
      ? { ...current, projectId: value, assigneeId: '' }
      : { ...current, [name]: value });
  };
  const submit = async event => {
    event.preventDefault();
    const validationError = validateTask(form);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = await createTask(form);
    setSaving(false);
    if (result.error) { setError(getTaskErrorMessage(result.error)); return; }
    close({ created: result.data });
  };

  return (
    <div className="modal-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <form className="modal task-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal-head"><div><span>YENİ GÖREV</span><h2 id="task-modal-title">Proje işini tanımlayın</h2><p>Görevi aktif projeye bağlayın ve isterseniz proje ekibinden birine atayın.</p></div><button type="button" className="icon-button" onClick={close} disabled={saving} aria-label="Pencereyi kapat"><X /></button></div>
        <div className="task-form-grid">
          <label className="full-field">Görev başlığı<input autoFocus required name="title" maxLength="200" value={form.title} onChange={update} placeholder="Örn. Ana sayfa tasarımını tamamla" /></label>
          <label className="full-field">Proje<select required name="projectId" value={form.projectId} onChange={update}>{projects.map(project => <option key={project.id} value={project.id}>{project.name} · {project.clientName}</option>)}</select></label>
          <label>Durum<select name="status" value={form.status} onChange={update}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Öncelik<select name="priority" value={form.priority} onChange={update}>{priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Bitiş tarihi<input name="dueDate" type="date" value={form.dueDate} onChange={update} /></label>
          <label className="full-field">Görevli<select name="assigneeId" value={form.assigneeId} onChange={update} disabled={membersLoading}><option value="">Atanmamış</option>{assignedMembers.map(member => <option key={member.userId} value={member.userId}>{member.name} · {member.title}</option>)}</select><small className="task-field-note">Yalnızca seçili projenin ekip üyeleri listelenir.</small></label>
          <label className="full-field">Açıklama<textarea name="description" maxLength="4000" value={form.description} onChange={update} placeholder="Görevin kapsamını ve beklenen çıktıyı yazın…" /></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="soft-button" onClick={close} disabled={saving}>Vazgeç</button><button className="agenda-button" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Plus />}{saving ? 'Kaydediliyor…' : 'Görevi oluştur'}</button></div>
      </form>
    </div>
  );
}

function formatDate(date) {
  if (!date) return 'Tarih yok';
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export default function TasksPage() {
  const { createTask, error, loading, refresh, tasks } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { activeOrganization } = useOrganization();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const canManage = canManageTasks(activeOrganization?.role);
  const activeProjects = useMemo(() => projects.filter(project => !project.isArchived), [projects]);
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);
  const filteredTasks = useMemo(
    () => filterTasks(tasks, { query, status, projectId }),
    [projectId, query, status, tasks],
  );
  const creationBlocked = projectsLoading || activeProjects.length === 0;

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const closeModal = result => {
    setModalOpen(false);
    if (result?.created) setToast(`${result.created.title} görevi oluşturuldu.`);
  };
  const createTitle = !canManage
    ? 'Görev oluşturmak için yönetici veya proje yöneticisi rolü gerekir'
    : creationBlocked ? 'Görev oluşturmak için önce aktif bir proje gerekir' : undefined;

  return (
    <>
      <section className="task-hero"><div><div className="eyebrow"><i /> GÖREV YÖNETİMİ</div><h1>Yapılacaklar, net ve görünür.</h1><p>Proje işlerini görevlere bölün; sorumluluğu, önceliği ve teslim tarihini belirleyin.</p></div><button className="agenda-button task-primary" onClick={() => setModalOpen(true)} disabled={!canManage || creationBlocked} title={createTitle}><Plus /> Yeni görev</button></section>

      <section className="task-stats-grid">
        <TaskStat label="TOPLAM GÖREV" value={stats.total} helper="Çalışma alanındaki görevler" icon={CheckSquare2} />
        <TaskStat label="YAPILACAK" value={stats.todo} helper="Başlamayı bekleyen işler" icon={ListTodo} />
        <TaskStat label="DEVAM EDİYOR" value={stats.inProgress} helper="Üzerinde çalışılan işler" icon={Timer} />
        <TaskStat label="TAMAMLANDI" value={stats.done} helper="Bitirilen görevler" icon={CheckCheck} />
      </section>

      <section className="task-list-card">
        <div className="task-list-head"><div><h2>Görev listesi</h2><p>{filteredTasks.length} görev görüntüleniyor</p></div></div>
        <div className="task-toolbar"><label className="task-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Görev, proje, görevli veya açıklama ara" /></label><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Görev durumuna göre filtrele"><option value="all">Tüm durumlar</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={projectId} onChange={event => setProjectId(event.target.value)} aria-label="Projeye göre filtrele"><option value="all">Tüm projeler</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
        <div className="task-table">
          <div className="task-table-head"><span>GÖREV</span><span>PROJE</span><span>GÖREVLİ</span><span>DURUM</span><span>ÖNCELİK</span><span>BİTİŞ</span><span>OLUŞTURULMA</span></div>
          {loading && <div className="tasks-state" role="status"><LoaderCircle className="spin" /><span>Görevler yükleniyor…</span></div>}
          {!loading && error && <div className="tasks-state error"><CircleAlert /><h3>Görevler yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
          {!loading && !error && filteredTasks.map(task => <article className="task-list-row" key={task.id}><span className="task-identity"><i><CheckSquare2 /></i><span><b>{task.title}</b><small>{task.description || 'Açıklama eklenmedi'}</small></span></span><span className="task-project"><FolderKanban /><span><b>{task.projectName}</b><small>{task.projectArchived ? 'Arşivlenmiş proje' : 'Aktif proje'}</small></span></span><span className="task-assignee"><i>{task.assigneeInitials}</i><span><b>{task.assigneeName}</b><small>Görevli</small></span></span><span className={`task-status ${task.status}`}>{task.statusLabel}</span><span className={`task-priority ${task.priority}`}>{task.priorityLabel}</span><span className="task-due"><CalendarDays />{formatDate(task.dueDate)}</span><span className="task-created">{task.createdAtLabel}</span></article>)}
          {!loading && !error && tasks.length === 0 && <div className="tasks-state empty"><CheckSquare2 /><h3>İlk görevinizi oluşturun</h3><p>{activeProjects.length ? 'Aktif projeniz için ilk yapılacak işi tanımlayın.' : 'Görev oluşturabilmek için önce aktif bir proje oluşturun.'}</p>{canManage && activeProjects.length > 0 && <button className="soft-button" onClick={() => setModalOpen(true)}><Plus /> Görev oluştur</button>}</div>}
          {!loading && !error && tasks.length > 0 && filteredTasks.length === 0 && <div className="tasks-state empty"><Search /><h3>Eşleşen görev bulunamadı</h3><p>Arama metnini veya filtreleri değiştirin.</p></div>}
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {modalOpen && <CreateTaskModal projects={activeProjects} close={closeModal} createTask={createTask} />}
    </>
  );
}
