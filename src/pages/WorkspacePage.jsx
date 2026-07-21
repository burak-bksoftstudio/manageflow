import {
  useEffect, useMemo, useState,
} from 'react';
import {
  Archive, ArchiveRestore, BookOpenText, Check, CircleAlert, Clock3, FilePenLine,
  FolderKanban, LoaderCircle, NotebookPen, Pencil, Pin, PinOff, Plus, RefreshCw,
  Search, Tag, UserRound, X,
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

function ProjectNoteModal({
  canArchive, canEdit, close, createNote, note, projects, selectedProjectId,
  setNoteArchived, updateNote,
}) {
  const availableProjects = note ? projects : projects.filter(project => !project.isArchived);
  const initialProjectId = selectedProjectId === 'independent'
    ? ''
    : availableProjects.some(project => project.id === selectedProjectId)
    ? selectedProjectId
    : availableProjects[0]?.id || '';
  const [form, setForm] = useState({
    content: note?.content || '',
    isPinned: note?.isPinned || false,
    projectId: note?.projectId || initialProjectId,
    tags: (note?.tags || []).join(', '),
    title: note?.title || '',
  });
  const [error, setError] = useState('');
  const [confirmingArchive, setConfirmingArchive] = useState(false);
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
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm(current => ({ ...current, [event.target.name]: value }));
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
  const archiveNote = async () => {
    setSaving(true);
    setError('');
    const result = await setNoteArchived(note.id, true);
    setSaving(false);
    if (result.error) { setError(getProjectNoteErrorMessage(result.error)); return; }
    close({ archived: result.data });
  };

  return (
    <div className="modal-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <form className="modal workspace-note-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="workspace-note-title">
        <div className="modal-head"><div><span>{note ? (isReadOnly ? 'ÇALIŞMA ALANI NOTU' : 'NOTU DÜZENLE') : 'YENİ NOT'}</span><h2 id="workspace-note-title">{note ? note.title : 'Ekip bağlamını kaydedin'}</h2><p>{isReadOnly ? `${note.authorName} tarafından güncellendi.` : 'Kararları, toplantı çıktılarını ve ortak bilgileri ekip için kalıcı hale getirin.'}</p></div><button type="button" className="icon-button" onClick={close} disabled={saving} aria-label="Pencereyi kapat"><X /></button></div>
        <div className="workspace-note-form">
          <label>Bağlam <small>İsteğe bağlı</small><select name="projectId" value={form.projectId} onChange={update} disabled={saving || Boolean(note) || isReadOnly}><option value="">Bağımsız ekip notu</option>{availableProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label>Not başlığı<input autoFocus={!note} name="title" maxLength="160" value={form.title} onChange={update} placeholder="Örn. Müşteri toplantısı kararları" disabled={saving || isReadOnly} /></label>
          <label>Etiketler <small>Virgülle ayırın · en fazla 8</small><div className="workspace-tag-input"><Tag /><input name="tags" value={form.tags} onChange={update} placeholder="toplantı, brief, karar" disabled={saving || isReadOnly} /></div></label>
          <label>Not içeriği<textarea name="content" maxLength="10000" value={form.content} onChange={update} placeholder="Ekip veya proje için önemli bilgileri yazın…" disabled={saving || isReadOnly} /></label>
          <small>{form.content.length.toLocaleString('tr-TR')} / 10.000 karakter</small>
          {!isReadOnly && <label className="workspace-pin-option"><input type="checkbox" name="isPinned" checked={form.isPinned} onChange={update} disabled={saving} /><span><Pin /><b>Notu sabitle</b><small>Sabitlediğiniz not, listede diğer notların üzerinde görünür.</small></span></label>}
        </div>
        {isReadOnly && <div className="workspace-readonly-note"><UserRound /><span><b>Salt okunur not</b><small>Bu notu yalnız yazarı veya çalışma alanı yöneticileri düzenleyebilir.</small></span></div>}
        {confirmingArchive && <div className="workspace-archive-confirm"><Archive /><span><b>Bu not arşivlensin mi?</b><small>Not silinmez; Çalışma Alanı filtresinden veya Merkezi Arşiv’den geri yüklenebilir.</small></span><button type="button" className="soft-button" onClick={() => setConfirmingArchive(false)} disabled={saving}>Vazgeç</button><button type="button" className="danger-button" onClick={archiveNote} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Archive />} Arşivle</button></div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions">{note && canArchive && !note.isArchived && !confirmingArchive && <button type="button" className="danger-button workspace-archive-trigger" onClick={() => setConfirmingArchive(true)} disabled={saving}><Archive /> Arşivle</button>}<button type="button" className="soft-button" onClick={close} disabled={saving}>{isReadOnly ? 'Kapat' : 'Vazgeç'}</button>{!isReadOnly && !confirmingArchive && <button className="agenda-button" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : note ? <Check /> : <Plus />}{saving ? 'Kaydediliyor…' : note ? 'Değişiklikleri kaydet' : 'Notu oluştur'}</button>}</div>
      </form>
    </div>
  );
}

export default function WorkspacePage() {
  const {
    createNote, currentUserId, error, loading, notes, projects, refresh, setNoteArchived,
    setNotePinned, updateNote,
  } = useProjectNotes();
  const { activeOrganization } = useOrganization();
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [archiveFilter, setArchiveFilter] = useState('active');
  const [query, setQuery] = useState('');
  const [modalState, setModalState] = useState(null);
  const [toast, setToast] = useState('');
  const stats = useMemo(() => getWorkspaceStats(notes, currentUserId), [currentUserId, notes]);
  const filteredNotes = useMemo(() => filterProjectNotes(notes, {
    archive: archiveFilter, projectId: selectedProjectId, query,
  }), [archiveFilter, notes, query, selectedProjectId]);
  const countedNotes = useMemo(() => notes.filter(note => archiveFilter === 'all'
    || (archiveFilter === 'archived' ? note.isArchived : !note.isArchived)), [archiveFilter, notes]);
  const noteCounts = useMemo(() => countedNotes.reduce((counts, note) => (
    counts.set(note.projectId, (counts.get(note.projectId) || 0) + 1)
  ), new Map()), [countedNotes]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const closeModal = result => {
    setModalState(null);
    if (result?.saved) setToast(`${result.saved.title} kaydedildi.`);
    if (result?.archived) setToast(`${result.archived.title} arşivlendi.`);
  };
  const openNote = note => {
    const permissions = getProjectNotePermissions(note, currentUserId, activeOrganization?.role);
    setModalState({ canArchive: permissions.canArchive, canEdit: permissions.canEdit, note });
  };
  const togglePinned = async note => {
    const result = await setNotePinned(note.id, !note.isPinned);
    if (result.error) { setToast(getProjectNoteErrorMessage(result.error)); return; }
    setToast(note.isPinned ? `${note.title} sabitlemeden çıkarıldı.` : `${note.title} sabitlendi.`);
  };
  const restoreNote = async note => {
    const result = await setNoteArchived(note.id, false);
    if (result.error) { setToast(getProjectNoteErrorMessage(result.error)); return; }
    setToast(`${note.title} arşivden çıkarıldı.`);
  };

  return (
    <>
      <section className="workspace-hero"><div><div className="eyebrow"><i /> ÇALIŞMA ALANI</div><h1>Bilgi, doğru bağlamda.</h1><p>Ekip bilgisini bağımsız tutun veya toplantı kararlarını ve brief detaylarını ilgili projeye bağlayın.</p></div><button className="agenda-button workspace-primary" onClick={() => setModalState({ canArchive: false, canEdit: true, note: null })} disabled={loading}><Plus /> Yeni not</button></section>

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
            <button className={selectedProjectId === 'all' ? 'active' : ''} onClick={() => setSelectedProjectId('all')}><span><BookOpenText /><b>Tüm notlar</b></span><em>{countedNotes.length}</em></button>
            <button className={selectedProjectId === 'independent' ? 'active' : ''} onClick={() => setSelectedProjectId('independent')}><span><NotebookPen /><b>Bağımsız notlar</b><small>Genel ekip bilgisi</small></span><em>{noteCounts.get(null) || 0}</em></button>
            {projects.map(project => <button key={project.id} className={selectedProjectId === project.id ? 'active' : ''} onClick={() => setSelectedProjectId(project.id)}><span><FolderKanban /><b>{project.name}</b><small>{project.isArchived ? 'Arşivlendi' : project.statusLabel}</small></span><em>{noteCounts.get(project.id) || 0}</em></button>)}
          </div>
        </aside>

        <div className="workspace-notes-card">
          <header><div><small>EKİP BİLGİSİ</small><h2>{selectedProjectId === 'all' ? 'Ortak bilgi alanı' : selectedProjectId === 'independent' ? 'Bağımsız notlar' : projects.find(project => project.id === selectedProjectId)?.name}</h2><p>{filteredNotes.length} not görüntüleniyor</p></div><div className="workspace-note-toolbar"><label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Başlık, içerik, etiket veya yazar ara" /></label><select value={archiveFilter} onChange={event => setArchiveFilter(event.target.value)} aria-label="Not durumuna göre filtrele"><option value="active">Aktif notlar</option><option value="archived">Arşivlenenler</option><option value="all">Tüm notlar</option></select></div></header>

          {loading && <div className="workspace-state" role="status"><LoaderCircle className="spin" /><span>Çalışma alanı hazırlanıyor…</span></div>}
          {!loading && error && <div className="workspace-state error"><CircleAlert /><h3>Proje notları yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
          {!loading && !error && (
            <div className="workspace-note-grid">
              {filteredNotes.map(note => {
                const { canArchive, canEdit, canPin } = getProjectNotePermissions(note, currentUserId, activeOrganization?.role);
                return <article key={note.id} className={`${note.isPinned ? 'pinned' : ''} ${note.isArchived ? 'archived' : ''}`}><header><span>{note.authorInitials}</span><div><small>{note.projectName}{note.isArchived ? ' · ARŞİV' : note.isPinned ? ' · SABİT' : ''}</small><b>{note.title}</b></div>{canPin ? <button className="workspace-pin-button" onClick={() => togglePinned(note)} title={note.isPinned ? 'Sabitlemeden çıkar' : 'Notu sabitle'} aria-label={note.isPinned ? `${note.title} notunu sabitlemeden çıkar` : `${note.title} notunu sabitle`}>{note.isPinned ? <PinOff /> : <Pin />}</button> : canEdit ? <Pencil /> : note.isPinned ? <Pin /> : null}</header>{note.tags.length > 0 && <div className="workspace-note-tags">{note.tags.map(tag => <span key={tag}><Tag />{tag}</span>)}</div>}<p>{note.content}</p><footer><span><UserRound />{note.authorName}</span><small>{formatProjectNoteDate(note.updatedAt)}</small>{note.isArchived && canArchive ? <button onClick={() => restoreNote(note)} aria-label={`${note.title} notunu geri yükle`}><ArchiveRestore />Geri yükle</button> : <button onClick={() => openNote(note)} aria-label={`${note.title} notunu aç`}>{canEdit ? <FilePenLine /> : <BookOpenText />}{canEdit ? 'Aç ve düzenle' : 'Notu aç'}</button>}</footer></article>;
              })}
            </div>
          )}
          {!loading && !error && notes.length === 0 && <div className="workspace-state empty"><NotebookPen /><h3>İlk ekip notunu oluşturun</h3><p>Kararlar ve ortak bilgiler ekibin kalıcı hafızasını burada oluşturacak.</p><button className="soft-button" onClick={() => setModalState({ canArchive: false, canEdit: true, note: null })}><Plus /> Not oluştur</button></div>}
          {!loading && !error && notes.length > 0 && filteredNotes.length === 0 && <div className="workspace-state empty">{archiveFilter === 'archived' ? <Archive /> : <Search />}<h3>{archiveFilter === 'archived' ? 'Arşivlenmiş not yok' : 'Eşleşen not bulunamadı'}</h3><p>{archiveFilter === 'archived' ? 'Arşivlediğiniz notlar burada ve Merkezi Arşiv’de görünür.' : 'Proje seçimini, filtreyi veya arama metnini değiştirin.'}</p></div>}
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {modalState && <ProjectNoteModal {...modalState} close={closeModal} createNote={createNote} projects={projects} selectedProjectId={selectedProjectId} setNoteArchived={setNoteArchived} updateNote={updateNote} />}
    </>
  );
}
