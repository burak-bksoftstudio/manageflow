import { useEffect, useMemo, useState } from 'react';
import {
  Archive, ArchiveRestore, CalendarDays, Check, CheckCheck, CheckSquare2, CircleAlert,
  Columns3, CornerDownRight, FileText, FolderKanban, GitBranch, GripVertical, History, ListChecks, ListTodo,
  LoaderCircle, MessageSquare, Pencil, Plus, RefreshCw, Rows3, Search, Send, ShieldCheck, Timer,
  Trash2, UserRound, X,
} from 'lucide-react';
import { useOrganization } from '../features/organizations/OrganizationContext';
import { useProjectMembers } from '../features/projects/useProjectMembers';
import { useProjects } from '../features/projects/useProjects';
import {
  canManageTasks, canMoveTask, filterTasks, getTaskDescendantIds, getTaskErrorMessage,
  getTaskStats, groupTasksByStatus, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, validateTask,
} from '../features/tasks/taskUtils';
import { useTasks } from '../features/tasks/useTasks';
import {
  getChecklistErrorMessage, getChecklistProgress, validateChecklistTitle,
} from '../features/tasks/checklistUtils';
import { useTaskChecklist } from '../features/tasks/useTaskChecklist';
import {
  getTaskCommentErrorMessage, getTaskCommentPermissions, validateTaskComment,
} from '../features/tasks/commentUtils';
import { useTaskComments } from '../features/tasks/useTaskComments';
import { useTaskActivities } from '../features/tasks/useTaskActivities';

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

function CreateTaskModal({ projects, tasks, close, createTask }) {
  const [form, setForm] = useState({
    title: '', projectId: projects[0]?.id || '', parentTaskId: '', assigneeId: '', description: '', status: 'todo', priority: 'normal', dueDate: '',
  });
  const { assignedMembers, loading: membersLoading } = useProjectMembers(form.projectId);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const availableParentTasks = useMemo(
    () => tasks.filter(task => task.projectId === form.projectId && !task.isArchived),
    [form.projectId, tasks],
  );
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
      ? { ...current, projectId: value, parentTaskId: '', assigneeId: '' }
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
          <label className="full-field">Üst görev<select name="parentTaskId" value={form.parentTaskId} onChange={update}><option value="">Üst görev yok · Ana görev</option>{availableParentTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select><small className="task-field-note">Yalnızca seçili projedeki aktif görevler listelenir.</small></label>
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

function formatDateTime(date) {
  if (!date) return 'Henüz tamamlanmadı';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

function TaskChecklistSection({ taskId, canChange }) {
  const {
    addItem, error: loadError, items, loading, refresh, removeItem, toggleItem,
  } = useTaskChecklist(taskId);
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [savingItemId, setSavingItemId] = useState('');
  const [actionError, setActionError] = useState('');
  const progress = useMemo(() => getChecklistProgress(items), [items]);

  const add = async event => {
    event.preventDefault();
    const validationError = validateChecklistTitle(title);
    if (validationError) { setActionError(validationError); return; }
    setAdding(true);
    setActionError('');
    const result = await addItem(title);
    setAdding(false);
    if (result.error) { setActionError(getChecklistErrorMessage(result.error)); return; }
    setTitle('');
  };
  const toggle = async item => {
    setSavingItemId(item.id);
    setActionError('');
    const result = await toggleItem(item);
    setSavingItemId('');
    if (result.error) setActionError(getChecklistErrorMessage(result.error));
  };
  const remove = async item => {
    setSavingItemId(item.id);
    setActionError('');
    const result = await removeItem(item.id);
    setSavingItemId('');
    if (result.error) setActionError(getChecklistErrorMessage(result.error));
  };

  return (
    <section className="task-checklist-section">
      <header><span><ListChecks /></span><div><small>CHECKLIST</small><b>{progress.completed}/{progress.total} tamamlandı</b></div><strong>%{progress.percentage}</strong></header>
      {progress.total > 0 && <div className="task-checklist-progress"><i style={{ width: `${progress.percentage}%` }} /></div>}
      {loading && <div className="task-checklist-state"><LoaderCircle className="spin" /> Checklist yükleniyor…</div>}
      {!loading && loadError && <div className="task-checklist-state error"><CircleAlert /> Checklist yüklenemedi.<button onClick={refresh}>Tekrar dene</button></div>}
      {!loading && !loadError && items.length === 0 && <div className="task-checklist-empty"><ListChecks /><span><b>Henüz checklist yok</b><small>{canChange ? 'İlk kontrol adımını aşağıdan ekleyin.' : 'Yetkili kullanıcılar kontrol adımı ekleyebilir.'}</small></span></div>}
      {!loading && !loadError && items.length > 0 && <div className="task-checklist-list">{items.map(item => <div className={`task-checklist-item ${item.isCompleted ? 'completed' : ''}`} key={item.id}><button className="task-checklist-toggle" onClick={() => toggle(item)} disabled={!canChange || Boolean(savingItemId)} aria-label={`${item.title} öğesini ${item.isCompleted ? 'yeniden aç' : 'tamamla'}`}>{savingItemId === item.id ? <LoaderCircle className="spin" /> : item.isCompleted ? <Check /> : null}</button><span><b>{item.title}</b><small>{item.isCompleted ? `${formatDateTime(item.completedAt)} tamamlandı` : 'Bekliyor'}</small></span>{canChange && <button className="task-checklist-remove" onClick={() => remove(item)} disabled={Boolean(savingItemId)} aria-label={`${item.title} öğesini kaldır`} title="Checklist öğesini kaldır"><Trash2 /></button>}</div>)}</div>}
      {canChange && !loading && !loadError && <form className="task-checklist-add" onSubmit={add}><input value={title} onChange={event => { setTitle(event.target.value); setActionError(''); }} maxLength="180" placeholder="Yeni kontrol adımı…" aria-label="Yeni checklist öğesi" /><button disabled={adding}>{adding ? <LoaderCircle className="spin" /> : <Plus />} Ekle</button></form>}
      {!canChange && !loading && !loadError && items.length > 0 && <p className="task-checklist-readonly"><ShieldCheck /> Checklist salt okunur.</p>}
      {actionError && <div className="form-error" role="alert">{actionError}</div>}
    </section>
  );
}

function TaskCommentsSection({ taskId, canComment }) {
  const { activeOrganization } = useOrganization();
  const {
    addComment, comments, currentUserId, error: loadError, loading, refresh,
    removeComment, updateComment,
  } = useTaskComments(taskId);
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [savingId, setSavingId] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState('');

  const submit = async event => {
    event.preventDefault();
    const validationError = validateTaskComment(body);
    if (validationError) { setActionError(validationError); return; }
    setSending(true);
    setActionError('');
    const result = await addComment(body);
    setSending(false);
    if (result.error) { setActionError(getTaskCommentErrorMessage(result.error)); return; }
    setBody('');
  };
  const saveEdit = async commentId => {
    const validationError = validateTaskComment(editingBody);
    if (validationError) { setActionError(validationError); return; }
    setSavingId(commentId);
    setActionError('');
    const result = await updateComment(commentId, editingBody);
    setSavingId('');
    if (result.error) { setActionError(getTaskCommentErrorMessage(result.error)); return; }
    setEditingId('');
    setEditingBody('');
  };
  const remove = async commentId => {
    setSavingId(commentId);
    setActionError('');
    const result = await removeComment(commentId);
    setSavingId('');
    if (result.error) { setActionError(getTaskCommentErrorMessage(result.error)); return; }
    setConfirmDeleteId('');
  };

  return (
    <section className="task-comments-section">
      <header><span><MessageSquare /></span><div><small>YORUMLAR</small><b>{comments.length} mesaj</b></div></header>
      {loading && <div className="task-comment-state"><LoaderCircle className="spin" /> Yorumlar yükleniyor…</div>}
      {!loading && loadError && <div className="task-comment-state error"><CircleAlert /> Yorumlar yüklenemedi.<button type="button" onClick={refresh}>Tekrar dene</button></div>}
      {!loading && !loadError && comments.length === 0 && <div className="task-comment-empty"><MessageSquare /><span><b>Henüz yorum yok</b><small>{canComment ? 'İlk notu veya güncellemeyi paylaşın.' : 'Bu görevde yeni yorum yazılamıyor.'}</small></span></div>}
      {!loading && !loadError && comments.length > 0 && (
        <div className="task-comment-list">
          {comments.map(comment => {
            const permissions = getTaskCommentPermissions(comment, currentUserId, activeOrganization?.role);
            return (
              <article className="task-comment" key={comment.id}>
                <i>{comment.authorInitials}</i>
                <div>
                  <header><b>{comment.authorName}</b><span>{formatDateTime(comment.createdAt)}{comment.editedAt ? ' · düzenlendi' : ''}</span></header>
                  {editingId === comment.id ? (
                    <div className="task-comment-edit">
                      <textarea autoFocus maxLength="4000" value={editingBody} onChange={event => { setEditingBody(event.target.value); setActionError(''); }} />
                      <div><button type="button" onClick={() => { setEditingId(''); setEditingBody(''); }} disabled={savingId === comment.id}>Vazgeç</button><button type="button" className="primary" onClick={() => saveEdit(comment.id)} disabled={savingId === comment.id}>{savingId === comment.id ? <LoaderCircle className="spin" /> : <Check />} Kaydet</button></div>
                    </div>
                  ) : (
                    <p>{comment.body}</p>
                  )}
                  {confirmDeleteId === comment.id && <div className="task-comment-delete-confirm"><span>Yorum kalıcı olarak silinsin mi?</span><button type="button" onClick={() => setConfirmDeleteId('')} disabled={savingId === comment.id}>Vazgeç</button><button type="button" onClick={() => remove(comment.id)} disabled={savingId === comment.id}>{savingId === comment.id ? 'Siliniyor…' : 'Sil'}</button></div>}
                </div>
                {!editingId && !confirmDeleteId && (permissions.canEdit || permissions.canDelete) && <div className="task-comment-actions">{permissions.canEdit && <button type="button" onClick={() => { setEditingId(comment.id); setEditingBody(comment.body); setActionError(''); }} aria-label={`${comment.authorName} yorumunu düzenle`} title="Yorumu düzenle"><Pencil /></button>}{permissions.canDelete && <button type="button" onClick={() => setConfirmDeleteId(comment.id)} aria-label={`${comment.authorName} yorumunu sil`} title="Yorumu sil"><Trash2 /></button>}</div>}
              </article>
            );
          })}
        </div>
      )}
      {canComment && !loading && !loadError && <form className="task-comment-compose" onSubmit={submit}><textarea value={body} onChange={event => { setBody(event.target.value); setActionError(''); }} maxLength="4000" placeholder="Görevle ilgili bir güncelleme yazın…" aria-label="Yeni görev yorumu" /><div><small>{body.length}/4000</small><button disabled={sending}>{sending ? <LoaderCircle className="spin" /> : <Send />}{sending ? 'Gönderiliyor…' : 'Gönder'}</button></div></form>}
      {!canComment && !loading && !loadError && <p className="task-comment-readonly"><Archive /> Arşivlenmiş görev veya projede yeni yorum yazılamaz.</p>}
      {actionError && <div className="form-error" role="alert">{actionError}</div>}
    </section>
  );
}

function TaskActivitySection({ taskId }) {
  const { activities, error, loading, refresh } = useTaskActivities(taskId);
  return (
    <section className="task-activity-section">
      <header><span><History /></span><div><small>AKTİVİTE</small><b>{activities.length ? `Son ${activities.length} hareket` : 'Görev geçmişi'}</b></div></header>
      {loading && <div className="task-activity-state"><LoaderCircle className="spin" /> Aktivite geçmişi yükleniyor…</div>}
      {!loading && error && <div className="task-activity-state error"><CircleAlert /> Aktivite geçmişi yüklenemedi.<button type="button" onClick={refresh}>Tekrar dene</button></div>}
      {!loading && !error && activities.length === 0 && <div className="task-activity-empty"><History /><span><b>Henüz aktivite yok</b><small>Görev değişiklikleri burada otomatik olarak görünecek.</small></span></div>}
      {!loading && !error && activities.length > 0 && <div className="task-activity-list">{activities.map(activity => <article className={`task-activity-item ${activity.eventType}`} key={activity.id}><i>{activity.actorInitials}</i><div><p><b>{activity.actorName}</b> {activity.description}</p><time>{formatDateTime(activity.createdAt)}</time></div></article>)}</div>}
      {!loading && !error && activities.length >= 60 && <p className="task-activity-limit">En güncel 60 hareket gösteriliyor.</p>}
    </section>
  );
}

function TaskSubtasksSection({ task, openTask }) {
  const childTasks = task.childTasks || [];
  return (
    <section className="task-subtasks-section">
      <header><span><GitBranch /></span><div><small>ALT GÖREVLER</small><b>{task.subtaskCompleted || 0}/{task.subtaskTotal || 0} tamamlandı</b></div><strong>%{task.subtaskPercentage || 0}</strong></header>
      {task.subtaskTotal > 0 && <div className="task-subtasks-progress"><i style={{ width: `${task.subtaskPercentage}%` }} /></div>}
      {childTasks.length === 0 && <div className="task-subtasks-empty"><GitBranch /><span><b>Alt görev bulunmuyor</b><small>Görevi düzenleyerek veya yeni görev oluştururken bu görevi üst görev seçebilirsiniz.</small></span></div>}
      {childTasks.length > 0 && <div className="task-subtasks-list">{childTasks.map(child => <button type="button" key={child.id} onClick={() => openTask(child)}><span className={`task-subtask-check ${child.status === 'done' ? 'done' : ''}`}>{child.status === 'done' && <Check />}</span><span><b>{child.title}</b><small>{child.isArchived ? 'Arşivlendi' : `${TASK_STATUS_LABELS[child.status]} · ${child.assigneeName}`}</small></span><CornerDownRight /></button>)}</div>}
      {childTasks.some(child => child.isArchived) && <p className="task-subtasks-note">Arşivlenmiş alt görevler ilerleme oranına dahil edilmez.</p>}
    </section>
  );
}

function TaskDrawer({ task, tasks, projects, close, openTask, updateTask, setTaskArchived, canManage }) {
  const [draft, setDraft] = useState(task);
  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { assignedMembers, loading: membersLoading } = useProjectMembers(draft.projectId);
  useModalDismiss(close, saving);
  const projectLocked = draft.projectArchived;
  const canChange = canManage && !projectLocked;
  const availableProjects = useMemo(
    () => projects.filter(project => !project.isArchived || project.id === draft.projectId),
    [draft.projectId, projects],
  );
  const descendantIds = useMemo(() => getTaskDescendantIds(tasks, draft.id), [draft.id, tasks]);
  const availableParentTasks = useMemo(
    () => tasks.filter(candidate => candidate.projectId === draft.projectId
      && candidate.id !== draft.id
      && !descendantIds.has(candidate.id)
      && (!candidate.isArchived || candidate.id === draft.parentTaskId)),
    [descendantIds, draft.id, draft.parentTaskId, draft.projectId, tasks],
  );

  useEffect(() => {
    if (!editing || membersLoading) return;
    setDraft(current => assignedMembers.some(member => member.userId === current.assigneeId)
      ? current
      : { ...current, assigneeId: '' });
  }, [assignedMembers, editing, membersLoading]);

  const update = event => {
    const { name, value } = event.target;
    setError('');
    setDraft(current => name === 'projectId'
      ? { ...current, projectId: value, parentTaskId: '', assigneeId: '' }
      : { ...current, [name]: value });
  };
  const persist = async () => {
    const validationError = validateTask(draft);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = await updateTask(task.id, draft);
    setSaving(false);
    if (result.error) { setError(getTaskErrorMessage(result.error)); return; }
    setDraft(result.data);
    setEditing(false);
  };
  const changeArchive = async archived => {
    setSaving(true);
    setError('');
    const result = await setTaskArchived(task.id, archived);
    setSaving(false);
    if (result.error) { setError(getTaskErrorMessage(result.error)); return; }
    setDraft(result.data);
    setConfirmingArchive(false);
  };

  return (
    <div className="drawer-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <aside className="drawer task-drawer" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="task-drawer-title">
        <div className="drawer-head"><div><span>GÖREV DETAYI</span><h2 id="task-drawer-title">Görev özeti</h2></div><button className="icon-button" onClick={close} disabled={saving} aria-label="Paneli kapat"><X /></button></div>
        <div className="task-drawer-profile"><i><CheckSquare2 /></i><h3>{draft.title}</h3><p>{draft.projectName}</p><span className={`task-status ${draft.isArchived ? 'archived' : draft.status}`}>{draft.isArchived ? 'Arşivlendi' : TASK_STATUS_LABELS[draft.status]}</span></div>

        {editing ? (
          <div className="drawer-form task-drawer-form">
            <label>Görev başlığı<input required name="title" maxLength="200" value={draft.title} onChange={update} /></label>
            <label>Proje<select required name="projectId" value={draft.projectId} onChange={update}>{availableProjects.map(project => <option key={project.id} value={project.id}>{project.name}{project.isArchived ? ' · Arşivde' : ''}</option>)}</select></label>
            <label>Üst görev<select name="parentTaskId" value={draft.parentTaskId} onChange={update}><option value="">Üst görev yok · Ana görev</option>{availableParentTasks.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.title}{candidate.isArchived ? ' · Arşivde' : ''}</option>)}</select><small className="task-field-note">Kendisi ve kendi alt görevleri döngü oluşmaması için listelenmez.</small></label>
            <label>Durum<select name="status" value={draft.status} onChange={update}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Öncelik<select name="priority" value={draft.priority} onChange={update}>{priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Bitiş tarihi<input name="dueDate" type="date" value={draft.dueDate} onChange={update} /></label>
            <label>Görevli<select name="assigneeId" value={draft.assigneeId} onChange={update} disabled={membersLoading}><option value="">Atanmamış</option>{assignedMembers.map(member => <option key={member.userId} value={member.userId}>{member.name} · {member.title}</option>)}</select><small className="task-field-note">Yalnızca seçili projenin ekip üyeleri listelenir.</small></label>
            <label>Açıklama<textarea name="description" maxLength="4000" value={draft.description} onChange={update} placeholder="Görevin kapsamını yazın…" /></label>
            {draft.status === 'done' && <p className="task-completion-note"><Check /> Tamamlanma zamanı kaydetme sırasında otomatik tutulur.</p>}
            {error && <div className="form-error" role="alert">{error}</div>}
          </div>
        ) : (
          <>
            <div className="task-details">
              <div><FolderKanban /><span><small>PROJE</small><b>{draft.projectName}</b></span></div>
              <div><GitBranch /><span><small>ÜST GÖREV</small><b>{draft.parentTaskTitle || 'Ana görev'}</b></span></div>
              <div><UserRound /><span><small>GÖREVLİ</small><b>{draft.assigneeName}</b></span></div>
              <div><CircleAlert /><span><small>ÖNCELİK</small><b>{TASK_PRIORITY_LABELS[draft.priority]}</b></span></div>
              <div><CalendarDays /><span><small>BİTİŞ TARİHİ</small><b>{formatDate(draft.dueDate)}</b></span></div>
              <div><CheckCheck /><span><small>TAMAMLANMA</small><b>{formatDateTime(draft.completedAt)}</b></span></div>
              <div><FileText /><span><small>AÇIKLAMA</small><b className="task-description">{draft.description || 'Henüz açıklama eklenmedi.'}</b></span></div>
            </div>
            {!canManage && <p className="owner-note"><ShieldCheck /> Bu görevi görüntüleyebilirsiniz; düzenleme için yönetici veya proje yöneticisi rolü gerekir.</p>}
            {projectLocked && <p className="task-archive-note"><Archive /> Bağlı proje arşivde olduğu için görev salt okunur. İşlem yapmak için önce projeyi yeniden açın.</p>}
            {draft.isArchived && !projectLocked && <p className="task-archive-note"><Archive /> Bu görev arşivde tutuluyor. Silinmedi ve yetkili kullanıcı tarafından yeniden açılabilir.</p>}
            {error && <div className="form-error" role="alert">{error}</div>}
          </>
        )}

        {!editing && <TaskSubtasksSection task={draft} openTask={openTask} />}
        {!editing && <TaskChecklistSection taskId={draft.id} canChange={canChange && !draft.isArchived} />}
        {!editing && <TaskCommentsSection taskId={draft.id} canComment={!projectLocked && !draft.isArchived} />}
        {!editing && <TaskActivitySection key={`${draft.id}-${draft.archivedAt}`} taskId={draft.id} />}

        {confirmingArchive && <div className="deactivate-confirm" role="alert"><b>Görev arşivlensin mi?</b><p>Görev silinmeyecek; proje bağlantısı, sorumlusu ve tamamlanma geçmişi korunacak.</p>{error && <div className="form-error">{error}</div>}<div><button className="soft-button" onClick={() => setConfirmingArchive(false)} disabled={saving}>Vazgeç</button><button className="danger-button" onClick={() => changeArchive(true)} disabled={saving}>{saving ? 'Arşivleniyor…' : 'Arşivle'}</button></div></div>}
        {!confirmingArchive && canChange && <div className="drawer-actions task-drawer-actions">
          {editing ? <><button className="soft-button" onClick={() => { setDraft(task); setEditing(false); setError(''); }} disabled={saving}>Vazgeç</button><button className="agenda-button" onClick={persist} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Check />}{saving ? 'Kaydediliyor…' : 'Kaydet'}</button></> : draft.isArchived ? <button className="agenda-button" onClick={() => changeArchive(false)} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <ArchiveRestore />}{saving ? 'Açılıyor…' : 'Arşivden çıkar'}</button> : <><button className="agenda-button" onClick={() => setEditing(true)}><Pencil /> Düzenle</button><button className="soft-button task-archive-button" onClick={() => setConfirmingArchive(true)}><Archive /> Arşivle</button></>}
        </div>}
      </aside>
    </div>
  );
}

function TaskViewToggle({ view, setView }) {
  return (
    <div className="task-view-toggle" aria-label="Görev görünümü">
      <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'}><Rows3 /> Liste</button>
      <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')} aria-pressed={view === 'kanban'}><Columns3 /> Kanban</button>
    </div>
  );
}

function TaskKanban({ tasks, statusFilter, role, movingTaskId, moveTask, selectTask }) {
  const [draggingTaskId, setDraggingTaskId] = useState('');
  const [overStatus, setOverStatus] = useState('');
  const groupedTasks = useMemo(() => groupTasksByStatus(tasks), [tasks]);
  const columns = statusFilter === 'all'
    ? statusOptions
    : statusOptions.filter(([status]) => status === statusFilter);

  const startDrag = (event, task) => {
    if (!canMoveTask(task, role) || movingTaskId) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
    setDraggingTaskId(task.id);
  };
  const drop = (event, nextStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId;
    const task = tasks.find(item => item.id === taskId);
    setDraggingTaskId('');
    setOverStatus('');
    if (task && task.status !== nextStatus && canMoveTask(task, role)) moveTask(task, nextStatus);
  };

  return (
    <div className={`task-kanban ${columns.length === 1 ? 'single-column' : ''}`}>
      {columns.map(([columnStatus, label]) => (
        <section
          className={`task-kanban-column ${columnStatus} ${overStatus === columnStatus ? 'is-over' : ''}`}
          key={columnStatus}
          onDragOver={event => { if (canManageTasks(role)) { event.preventDefault(); setOverStatus(columnStatus); } }}
          onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOverStatus(''); }}
          onDrop={event => drop(event, columnStatus)}
        >
          <header><span><i />{label}</span><b>{groupedTasks[columnStatus].length}</b></header>
          <div className="task-kanban-stack">
            {groupedTasks[columnStatus].map(task => {
              const movable = canMoveTask(task, role);
              const moving = movingTaskId === task.id;
              return (
                <article
                  className={`task-kanban-card ${moving ? 'is-moving' : ''} ${!movable ? 'is-locked' : ''}`}
                  draggable={movable && !movingTaskId}
                  key={task.id}
                  onDragStart={event => startDrag(event, task)}
                  onDragEnd={() => { setDraggingTaskId(''); setOverStatus(''); }}
                >
                  <button className="task-kanban-main" onClick={() => selectTask(task)}>
                    <span className="task-kanban-card-top"><span className={`task-priority ${task.priority}`}>{task.priorityLabel}</span>{movable && <GripVertical />}</span>
                    <b>{task.title}</b>
                    {task.parentTaskId && <small className="task-kanban-parent"><GitBranch />{task.parentTaskTitle || 'Üst görev'}</small>}
                    {task.subtaskTotal > 0 && <small className="task-kanban-subtasks"><CornerDownRight />{task.subtaskCompleted}/{task.subtaskTotal} alt görev tamamlandı</small>}
                    <small><FolderKanban />{task.projectName}</small>
                    <span className="task-kanban-meta"><i>{task.assigneeInitials}</i><span>{task.assigneeName}</span><span><CalendarDays />{formatDate(task.dueDate)}</span></span>
                    {(task.isArchived || task.projectArchived) && <em><Archive />{task.isArchived ? 'Görev arşivde' : 'Proje arşivde'}</em>}
                  </button>
                  <div className="task-kanban-card-actions">
                    <label>Durum<select value={task.status} onChange={event => moveTask(task, event.target.value)} disabled={!movable || Boolean(movingTaskId)} aria-label={`${task.title} görev durumunu değiştir`}>{statusOptions.map(([value, statusLabel]) => <option value={value} key={value}>{statusLabel}</option>)}</select></label>
                    {moving && <LoaderCircle className="spin" />}
                  </div>
                </article>
              );
            })}
            {groupedTasks[columnStatus].length === 0 && <div className="task-kanban-empty"><CheckSquare2 /><span>Bu sütunda görev yok</span></div>}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function TasksPage() {
  const {
    createTask, error, loading, refresh, setTaskArchived: persistArchive, tasks, updateTask: persistTask,
  } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { activeOrganization } = useOrganization();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [archive, setArchive] = useState('active');
  const [view, setView] = useState(() => window.localStorage.getItem('manageflow-task-view') === 'kanban' ? 'kanban' : 'list');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState('');
  const [moveError, setMoveError] = useState('');
  const [toast, setToast] = useState('');
  const canManage = canManageTasks(activeOrganization?.role);
  const activeProjects = useMemo(() => projects.filter(project => !project.isArchived), [projects]);
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);
  const filteredTasks = useMemo(
    () => filterTasks(tasks, { query, status, projectId, archive }),
    [archive, projectId, query, status, tasks],
  );
  const creationBlocked = projectsLoading || activeProjects.length === 0;

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    window.localStorage.setItem('manageflow-task-view', view);
  }, [view]);

  const closeModal = result => {
    setModalOpen(false);
    if (result?.created) setToast(`${result.created.title} görevi oluşturuldu.`);
  };
  const updateTask = async (taskId, form) => {
    const result = await persistTask(taskId, form);
    if (!result.error) {
      setSelectedTask(result.data);
      setToast(`${result.data.title} güncellendi.`);
    }
    return result;
  };
  const setTaskArchived = async (taskId, archived) => {
    const result = await persistArchive(taskId, archived);
    if (!result.error) {
      setSelectedTask(result.data);
      setToast(archived ? `${result.data.title} arşivlendi.` : `${result.data.title} yeniden açıldı.`);
    }
    return result;
  };
  const moveTask = async (task, nextStatus) => {
    if (task.status === nextStatus || movingTaskId || !canMoveTask(task, activeOrganization?.role)) return;
    setMovingTaskId(task.id);
    setMoveError('');
    const result = await persistTask(task.id, { ...task, status: nextStatus });
    setMovingTaskId('');
    if (result.error) { setMoveError(getTaskErrorMessage(result.error)); return; }
    if (selectedTask?.id === task.id) setSelectedTask(result.data);
    setToast(`${result.data.title} · ${result.data.statusLabel}`);
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
        <div className="task-list-head"><div><h2>{view === 'kanban' ? 'Görev panosu' : 'Görev listesi'}</h2><p>{filteredTasks.length} görev görüntüleniyor</p></div><TaskViewToggle view={view} setView={setView} /></div>
        <div className="task-toolbar"><label className="task-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Görev, proje, görevli veya açıklama ara" /></label><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Görev durumuna göre filtrele"><option value="all">Tüm durumlar</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={projectId} onChange={event => setProjectId(event.target.value)} aria-label="Projeye göre filtrele"><option value="all">Tüm projeler</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><select value={archive} onChange={event => setArchive(event.target.value)} aria-label="Arşiv durumuna göre filtrele"><option value="active">Aktif görevler</option><option value="archived">Arşivlenenler</option><option value="all">Tümü</option></select></div>
        {moveError && <div className="task-move-error form-error" role="alert"><CircleAlert />{moveError}<button onClick={() => setMoveError('')} aria-label="Hatayı kapat"><X /></button></div>}
        {loading && <div className="tasks-state" role="status"><LoaderCircle className="spin" /><span>Görevler yükleniyor…</span></div>}
        {!loading && error && <div className="tasks-state error"><CircleAlert /><h3>Görevler yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
        {!loading && !error && tasks.length === 0 && <div className="tasks-state empty"><CheckSquare2 /><h3>İlk görevinizi oluşturun</h3><p>{activeProjects.length ? 'Aktif projeniz için ilk yapılacak işi tanımlayın.' : 'Görev oluşturabilmek için önce aktif bir proje oluşturun.'}</p>{canManage && activeProjects.length > 0 && <button className="soft-button" onClick={() => setModalOpen(true)}><Plus /> Görev oluştur</button>}</div>}
        {!loading && !error && tasks.length > 0 && filteredTasks.length === 0 && <div className="tasks-state empty"><Search /><h3>Eşleşen görev bulunamadı</h3><p>Arama metnini veya filtreleri değiştirin.</p></div>}
        {!loading && !error && filteredTasks.length > 0 && view === 'list' && <div className="task-table"><div className="task-table-head"><span>GÖREV</span><span>PROJE</span><span>GÖREVLİ</span><span>DURUM</span><span>ÖNCELİK</span><span>BİTİŞ</span><span>OLUŞTURULMA</span></div>{filteredTasks.map(task => <button className={`task-list-row ${task.parentTaskId ? 'is-subtask' : ''}`} key={task.id} onClick={() => setSelectedTask(task)}><span className="task-identity"><i>{task.parentTaskId ? <CornerDownRight /> : <CheckSquare2 />}</i><span><b>{task.title}</b><small>{task.parentTaskId ? `Üst görev · ${task.parentTaskTitle}` : task.subtaskTotal > 0 ? `${task.subtaskCompleted}/${task.subtaskTotal} alt görev tamamlandı` : task.description || 'Açıklama eklenmedi'}</small></span></span><span className="task-project"><FolderKanban /><span><b>{task.projectName}</b><small>{task.projectArchived ? 'Arşivlenmiş proje' : 'Aktif proje'}</small></span></span><span className="task-assignee"><i>{task.assigneeInitials}</i><span><b>{task.assigneeName}</b><small>Görevli</small></span></span><span className={`task-status ${task.isArchived ? 'archived' : task.status}`}>{task.isArchived ? 'Arşivlendi' : task.statusLabel}</span><span className={`task-priority ${task.priority}`}>{task.priorityLabel}</span><span className="task-due"><CalendarDays />{formatDate(task.dueDate)}</span><span className="task-created">{task.createdAtLabel}</span></button>)}</div>}
        {!loading && !error && filteredTasks.length > 0 && view === 'kanban' && <TaskKanban tasks={filteredTasks} statusFilter={status} role={activeOrganization?.role} movingTaskId={movingTaskId} moveTask={moveTask} selectTask={setSelectedTask} />}
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {modalOpen && <CreateTaskModal projects={activeProjects} tasks={tasks} close={closeModal} createTask={createTask} />}
      {selectedTask && <TaskDrawer key={selectedTask.id} task={selectedTask} tasks={tasks} projects={projects} close={() => setSelectedTask(null)} openTask={candidate => setSelectedTask(tasks.find(task => task.id === candidate.id) || candidate)} updateTask={updateTask} setTaskArchived={setTaskArchived} canManage={canManage} />}
    </>
  );
}
