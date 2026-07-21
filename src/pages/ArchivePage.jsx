import { useMemo, useState } from 'react';
import {
  Archive, ArchiveRestore, BookOpenText, Check, CheckSquare2, CircleAlert, Clock3,
  FolderKanban, LoaderCircle, RefreshCw, Search,
} from 'lucide-react';
import {
  ARCHIVE_TYPE_LABELS, filterArchiveItems, formatArchiveDate, getArchiveStats, getCentralArchiveItems,
} from '../features/archive/archiveUtils';
import { useOrganization } from '../features/organizations/OrganizationContext';
import { canManageProjects } from '../features/projects/projectUtils';
import { useProjects } from '../features/projects/useProjects';
import { canManageTasks } from '../features/tasks/taskUtils';
import { useTasks } from '../features/tasks/useTasks';
import { useTimeEntries } from '../features/time-tracking/useTimeEntries';
import { useProjectNotes } from '../features/workspace/useProjectNotes';
import { getProjectNotePermissions } from '../features/workspace/workspaceUtils';

const typeIcons = { note: BookOpenText, project: FolderKanban, task: CheckSquare2, time: Clock3 };

function ArchiveStat({ icon: Icon, label, value, helper }) {
  return <article className="archive-stat"><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}

export default function ArchivePage() {
  const { activeOrganization } = useOrganization();
  const {
    projects, error: projectError, loading: projectsLoading, refresh: refreshProjects, setProjectArchived,
  } = useProjects();
  const {
    tasks, error: taskError, loading: tasksLoading, refresh: refreshTasks, setTaskArchived,
  } = useTasks();
  const {
    entries: timeEntries, error: timeError, loading: timeLoading, refresh: refreshTime,
    restoreTimeEntry,
  } = useTimeEntries();
  const {
    currentUserId, error: noteError, loading: notesLoading, notes, refresh: refreshNotes,
    setNoteArchived,
  } = useProjectNotes();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');
  const loading = projectsLoading || tasksLoading || timeLoading || notesLoading;
  const loadError = projectError || taskError || timeError || noteError;
  const canRestoreWork = canManageProjects(activeOrganization?.role) && canManageTasks(activeOrganization?.role);
  const items = useMemo(
    () => getCentralArchiveItems({ notes, projects, tasks, timeEntries }),
    [notes, projects, tasks, timeEntries],
  );
  const filteredItems = useMemo(() => filterArchiveItems(items, { query, type }), [items, query, type]);
  const stats = useMemo(() => getArchiveStats(items), [items]);

  const refresh = () => Promise.all([refreshProjects(), refreshTasks(), refreshTime(), refreshNotes()]);
  const restore = async item => {
    setBusyId(item.id);
    setActionError('');
    let result;
    if (item.type === 'project') result = await setProjectArchived(item.id, false);
    if (item.type === 'task') result = await setTaskArchived(item.id, false);
    if (item.type === 'time') result = await restoreTimeEntry(item.id);
    if (item.type === 'note') result = await setNoteArchived(item.id, false);
    setBusyId('');
    if (result?.error) {
      setActionError(`${item.title} geri yüklenemedi. Yetkinizi ve bağlı proje durumunu kontrol edin.`);
      return;
    }
    setToast(`${item.title} arşivden çıkarıldı.`);
    window.setTimeout(() => setToast(''), 3200);
  };

  return (
    <>
      <section className="archive-hero"><div><div className="eyebrow"><i /> MERKEZİ ARŞİV</div><h1>Geçmiş, kaybolmadan.</h1><p>Arşivlenen proje, görev, çalışma alanı notu ve kişisel zaman kayıtlarını tek yerde bulun; uygun kayıtları güvenle geri yükleyin.</p></div></section>

      <section className="archive-stats-grid">
        <ArchiveStat icon={Archive} label="TOPLAM" value={stats.total} helper="Arşivdeki tüm kayıtlar" />
        <ArchiveStat icon={FolderKanban} label="PROJE" value={stats.projects} helper="Arşivlenen müşteri işleri" />
        <ArchiveStat icon={CheckSquare2} label="GÖREV" value={stats.tasks} helper="Arşivlenen görevler" />
        <ArchiveStat icon={BookOpenText} label="NOT" value={stats.notes} helper="Arşivlenen ekip bilgisi" />
        <ArchiveStat icon={Clock3} label="ZAMAN" value={stats.timeEntries} helper="Kişisel süre kayıtları" />
      </section>

      <section className="archive-card">
        <header><div><span><Archive /></span><div><small>KAYIT MERKEZİ</small><h2>Arşivlenenler</h2><p>{filteredItems.length} kayıt görüntüleniyor</p></div></div></header>
        <div className="archive-toolbar">
          <label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Proje, görev, müşteri veya not ara" /></label>
          <select value={type} onChange={event => setType(event.target.value)} aria-label="Arşiv türüne göre filtrele"><option value="all">Tüm kayıt türleri</option><option value="project">Projeler</option><option value="task">Görevler</option><option value="note">Çalışma alanı notları</option><option value="time">Zaman kayıtları</option></select>
        </div>

        {actionError && <div className="archive-error" role="alert"><CircleAlert />{actionError}</div>}
        {loading && <div className="archive-state" role="status"><LoaderCircle className="spin" /><span>Arşiv hazırlanıyor…</span></div>}
        {!loading && loadError && <div className="archive-state error"><CircleAlert /><h3>Arşiv yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
        {!loading && !loadError && <div className="archive-list">{filteredItems.map(item => {
          const Icon = typeIcons[item.type];
          const canRestoreNote = item.type !== 'note' || getProjectNotePermissions({
            authorId: item.authorId, isArchived: true, projectArchived: item.contextArchived,
          }, currentUserId, activeOrganization?.role).canArchive;
          const restoreBlocked = item.contextArchived
            || (item.type !== 'time' && item.type !== 'note' && !canRestoreWork)
            || !canRestoreNote;
          const blockedTitle = item.contextArchived
            ? 'Önce bağlı projeyi arşivden çıkarın'
            : restoreBlocked ? 'Bu kayıt için yönetim yetkiniz yok' : '';
          return <article key={`${item.type}-${item.id}`}><i><Icon /></i><span><small>{ARCHIVE_TYPE_LABELS[item.type]}</small><b>{item.title}</b><p>{item.context}</p></span><time>{formatArchiveDate(item.archivedAt)}</time><button className="soft-button" onClick={() => restore(item)} disabled={busyId === item.id || restoreBlocked} title={blockedTitle}>{busyId === item.id ? <LoaderCircle className="spin" /> : <ArchiveRestore />}{busyId === item.id ? 'Yükleniyor…' : 'Geri yükle'}</button></article>;
        })}</div>}
        {!loading && !loadError && items.length === 0 && <div className="archive-state empty"><Archive /><h3>Arşiviniz boş</h3><p>Arşivlenen proje, görev, çalışma alanı notu veya zaman kayıtları burada görünecek.</p></div>}
        {!loading && !loadError && items.length > 0 && filteredItems.length === 0 && <div className="archive-state empty"><Search /><h3>Eşleşen kayıt bulunamadı</h3><p>Arama metnini veya kayıt türünü değiştirin.</p></div>}
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
    </>
  );
}
