import {
  useEffect, useMemo, useState,
} from 'react';
import {
  BookOpenText, Check, CircleAlert, Clock3, FilePenLine, FolderKanban, LoaderCircle,
  NotebookPen, Pencil, Plus, RefreshCw, Search, UserRound, X,
} from 'lucide-react';
import { useOrganization } from '../features/organizations/OrganizationContext';
import { useProjectNotes } from '../features/workspace/useProjectNotes';
import {
  filterProjectNotes, formatProjectNoteDate, getProjectNoteErrorMessage, getProjectNotePermissions,
  getWorkspaceStats, validateProjectNote,
} from '../features/workspace/workspaceUtils';

function WorkspaceStat({ icon: Icon, label, value, helper }) {
  return <article className="workspace-stat"><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}

function ProjectNoteModal({ canEdit, close, createNote, note, projects, selectedProjectId, updateNote }) {
  const availableProjects = note ? projects : projects.filter(project => !project.isArchived);
  const initialProjectId = availableProjects.some(project => project.id === selectedProjectId)
    ? selectedProjectId
    : availableProjects[0]?.id || '';
  const [form, setForm] = useState({
    content: note?.content || '',
    projectId: note?.projectId || initialProjectId,
    title: note?.title || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isReadOnly = Boolean(note) && !canEdit;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = event => event.key === 'Escape' && !saving && close();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [close, saving]);

  const update = event => {
    setError('');
    setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  };
  const submit = async event => {
    event.preventDefault();
    if (isReadOnly) return;
    const validationError = validateProjectNote(form, projects);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = note ? await updateNote(note.id, form) : await createNote(form);
    setSaving(false);
    if (result.error) { setError(getProjectNoteErrorMessage(result.error)); return; }
    close({ saved: result.data });
  };

  return (
    <div className="modal-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <form className="modal workspace-note-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="workspace-note-title">
        <div className="modal-head"><div><span>{note ? (isReadOnly ? 'PROJE NOTU' : 'NOTU DÜZENLE') : 'YENİ PROJE NOTU'}</span><h2 id="workspace-note-title">{note ? note.title : 'Ekip bağlamını kaydedin'}</h2><p>{isReadOnly ? `${note.authorName} tarafından güncellendi.` : 'Kararları, toplantı çıktılarını ve proje bilgisini ekip için kalıcı hale getirin.'}</p></div><button type="button" className="icon-button" onClick={close} disabled={saving} aria-label="Pencereyi kapat"><X /></button></div>
        <div className="workspace-note-form">
          <label>Proje<select name="projectId" value={form.projectId} onChange={update} disabled={saving || Boolean(note) || isReadOnly}><option value="">Proje seçin</option>{availableProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label>Not başlığı<input autoFocus={!note} name="title" maxLength="160" value={form.title} onChange={update} placeholder="Örn. Müşteri toplantısı kararları" disabled={saving || isReadOnly} /></label>
          <label>Not içeriği<textarea name="content" maxLength="10000" value={form.content} onChange={update} placeholder="Proje için önemli bilgileri yazın…" disabled={saving || isReadOnly} /></label>
          <small>{form.content.length.toLocaleString('tr-TR')} / 10.000 karakter</small>
        </div>
        {isReadOnly && <div className="workspace-readonly-note"><UserRound /><span><b>Salt okunur not</b><small>Bu notu yalnız yazarı veya çalışma alanı yöneticileri düzenleyebilir.</small></span></div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="soft-button" onClick={close} disabled={saving}>{isReadOnly ? 'Kapat' : 'Vazgeç'}</button>{!isReadOnly && <button className="agenda-button" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : note ? <Check /> : <Plus />}{saving ? 'Kaydediliyor…' : note ? 'Değişiklikleri kaydet' : 'Notu oluştur'}</button>}</div>
      </form>
    </div>
  );
}

export default function WorkspacePage() {
  const {
    createNote, currentUserId, error, loading, notes, projects, refresh, updateNote,
  } = useProjectNotes();
  const { activeOrganization } = useOrganization();
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [query, setQuery] = useState('');
  const [modalState, setModalState] = useState(null);
  const [toast, setToast] = useState('');
  const activeProjects = useMemo(() => projects.filter(project => !project.isArchived), [projects]);
  const stats = useMemo(() => getWorkspaceStats(notes, currentUserId), [currentUserId, notes]);
  const filteredNotes = useMemo(() => filterProjectNotes(notes, {
    projectId: selectedProjectId, query,
  }), [notes, query, selectedProjectId]);
  const noteCounts = useMemo(() => notes.reduce((counts, note) => (
    counts.set(note.projectId, (counts.get(note.projectId) || 0) + 1)
  ), new Map()), [notes]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const closeModal = result => {
    setModalState(null);
    if (result?.saved) setToast(`${result.saved.title} kaydedildi.`);
  };
  const openNote = note => {
    const permissions = getProjectNotePermissions(note, currentUserId, activeOrganization?.role);
    setModalState({ canEdit: permissions.canEdit, note });
  };

  return (
    <>
      <section className="workspace-hero"><div><div className="eyebrow"><i /> ÇALIŞMA ALANI</div><h1>Bilgi, proje bağlamında.</h1><p>Toplantı kararlarını, brief detaylarını ve ekip notlarını dağılmadan ilgili projede tutun.</p></div><button className="agenda-button workspace-primary" onClick={() => setModalState({ canEdit: true, note: null })} disabled={loading || !activeProjects.length}><Plus /> Yeni not</button></section>

      <section className="workspace-stats-grid">
        <WorkspaceStat icon={BookOpenText} label="TOPLAM NOT" value={stats.total} helper="Çalışma alanındaki bilgi" />
        <WorkspaceStat icon={FolderKanban} label="PROJE" value={stats.projects} helper="Not bulunan projeler" />
        <WorkspaceStat icon={UserRound} label="NOTLARIM" value={stats.mine} helper="Sizin oluşturduklarınız" />
        <WorkspaceStat icon={Clock3} label="BU HAFTA" value={stats.updatedThisWeek} helper="Eklenen veya güncellenen" />
      </section>

      <section className="workspace-board">
        <aside className="workspace-projects">
          <header><span><FolderKanban /></span><div><small>PROJE BAĞLAMI</small><h2>Projeler</h2></div></header>
          <div className="workspace-project-list">
            <button className={selectedProjectId === 'all' ? 'active' : ''} onClick={() => setSelectedProjectId('all')}><span><BookOpenText /><b>Tüm notlar</b></span><em>{notes.length}</em></button>
            {projects.map(project => <button key={project.id} className={selectedProjectId === project.id ? 'active' : ''} onClick={() => setSelectedProjectId(project.id)}><span><FolderKanban /><b>{project.name}</b><small>{project.isArchived ? 'Arşivlendi' : project.statusLabel}</small></span><em>{noteCounts.get(project.id) || 0}</em></button>)}
          </div>
        </aside>

        <div className="workspace-notes-card">
          <header><div><small>PROJE NOTLARI</small><h2>{selectedProjectId === 'all' ? 'Ortak bilgi alanı' : projects.find(project => project.id === selectedProjectId)?.name}</h2><p>{filteredNotes.length} not görüntüleniyor</p></div><label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Başlık, içerik, proje veya yazar ara" /></label></header>

          {loading && <div className="workspace-state" role="status"><LoaderCircle className="spin" /><span>Çalışma alanı hazırlanıyor…</span></div>}
          {!loading && error && <div className="workspace-state error"><CircleAlert /><h3>Proje notları yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
          {!loading && !error && (
            <div className="workspace-note-grid">
              {filteredNotes.map(note => {
                const { canEdit } = getProjectNotePermissions(note, currentUserId, activeOrganization?.role);
                return <article key={note.id}><header><span>{note.authorInitials}</span><div><small>{note.projectName}</small><b>{note.title}</b></div>{canEdit && <Pencil />}</header><p>{note.content}</p><footer><span><UserRound />{note.authorName}</span><small>{formatProjectNoteDate(note.updatedAt)}</small><button onClick={() => openNote(note)} aria-label={`${note.title} notunu aç`}>{canEdit ? <FilePenLine /> : <BookOpenText />}{canEdit ? 'Aç ve düzenle' : 'Notu aç'}</button></footer></article>;
              })}
            </div>
          )}
          {!loading && !error && notes.length === 0 && <div className="workspace-state empty"><NotebookPen /><h3>İlk proje notunu oluşturun</h3><p>Kararlar ve proje bilgileri ekibin ortak hafızasını burada oluşturacak.</p>{activeProjects.length > 0 && <button className="soft-button" onClick={() => setModalState({ canEdit: true, note: null })}><Plus /> Not oluştur</button>}</div>}
          {!loading && !error && notes.length > 0 && filteredNotes.length === 0 && <div className="workspace-state empty"><Search /><h3>Eşleşen not bulunamadı</h3><p>Proje seçimini veya arama metnini değiştirin.</p></div>}
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {modalState && <ProjectNoteModal {...modalState} close={closeModal} createNote={createNote} projects={projects} selectedProjectId={selectedProjectId} updateNote={updateNote} />}
    </>
  );
}
