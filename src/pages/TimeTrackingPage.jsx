import {
  useEffect, useMemo, useState,
} from 'react';
import {
  Activity, CalendarClock, Check, CircleAlert, Clock3, FolderKanban, ListTodo,
  LoaderCircle, Play, RefreshCw, Square, TimerReset,
} from 'lucide-react';
import { useTimeEntries } from '../features/time-tracking/useTimeEntries';
import {
  formatCompactDuration, formatTimeEntryRange, formatTimerDuration, getElapsedSeconds,
  getTimeTrackingErrorMessage, getTimeTrackingStats, getTodaySeconds, validateTimerForm,
} from '../features/time-tracking/timeTrackingUtils';

function TimeStat({ icon: Icon, label, value, helper, active = false }) {
  return <article className={`time-stat ${active ? 'active' : ''}`}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}

export default function TimeTrackingPage() {
  const {
    activeEntry, entries, error: loadError, loading, projects, refresh, startTimer, stopTimer, tasks,
  } = useTimeEntries();
  const [form, setForm] = useState({ projectId: '', taskId: '', note: '' });
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  const activeProjects = useMemo(() => projects.filter(project => !project.isArchived), [projects]);
  const availableTasks = useMemo(() => tasks.filter(task => (
    !task.isArchived && !task.projectArchived && task.projectId === form.projectId
  )), [form.projectId, tasks]);
  const stats = useMemo(() => getTimeTrackingStats(entries, now), [entries, now]);
  const todayEntries = useMemo(() => entries.filter(entry => (
    entry.isActive || getTodaySeconds(entry, now) > 0
  )).slice(0, 12), [entries, now]);

  useEffect(() => {
    if (form.projectId || !activeProjects.length || activeEntry) return;
    setForm(value => ({ ...value, projectId: activeProjects[0].id }));
  }, [activeEntry, activeProjects, form.projectId]);

  useEffect(() => {
    if (!activeEntry) return undefined;
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [activeEntry]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateForm = event => {
    const { name, value } = event.target;
    setFormError('');
    setForm(current => ({
      ...current,
      [name]: value,
      ...(name === 'projectId' ? { taskId: '' } : {}),
    }));
  };

  const begin = async event => {
    event.preventDefault();
    const validationError = validateTimerForm(form, tasks);
    if (validationError) { setFormError(validationError); return; }
    const project = activeProjects.find(item => item.id === form.projectId);
    const task = availableTasks.find(item => item.id === form.taskId);
    setBusy(true);
    const result = await startTimer({
      ...form, projectName: project?.name, taskTitle: task?.title,
    });
    setBusy(false);
    if (result.error) { setFormError(getTimeTrackingErrorMessage(result.error)); return; }
    setNow(new Date());
    setToast('Zaman sayacı başlatıldı. Sayfadan ayrılsanız da kayıt devam eder.');
  };

  const stop = async () => {
    if (!activeEntry) return;
    setBusy(true);
    setFormError('');
    const result = await stopTimer(activeEntry.id);
    setBusy(false);
    if (result.error) { setFormError(getTimeTrackingErrorMessage(result.error)); return; }
    setForm({ projectId: result.data?.projectId || form.projectId, taskId: '', note: '' });
    setNow(new Date());
    setToast(`Sayaç durduruldu: ${formatCompactDuration(result.data?.durationSeconds || 0)} kaydedildi.`);
  };

  return (
    <>
      <section className="time-hero">
        <div><div className="eyebrow"><i /> ZAMAN TAKİBİ</div><h1>Emeğiniz, görünür zamanda.</h1><p>Projelerde harcadığınız süreyi görevlere bağlayın; günün akışını kaybetmeden takip edin.</p></div>
        <div className={`time-live-badge ${activeEntry ? 'running' : ''}`}><span>{activeEntry ? <Activity /> : <Clock3 />}</span><div><small>{activeEntry ? 'SAYAÇ ÇALIŞIYOR' : 'SAYAÇ HAZIR'}</small><strong>{activeEntry ? formatTimerDuration(getElapsedSeconds(activeEntry, now)) : '00:00:00'}</strong></div></div>
      </section>

      <section className="time-stats-grid">
        <TimeStat icon={CalendarClock} label="BUGÜN" value={formatCompactDuration(stats.todaySeconds)} helper="Bugünkü toplam çalışma" />
        <TimeStat icon={TimerReset} label="OTURUM" value={stats.sessions} helper="Bugün açılan sayaçlar" />
        <TimeStat icon={FolderKanban} label="PROJE" value={stats.projects} helper="Bugün süre girilen işler" />
        <TimeStat icon={Activity} label="DURUM" value={activeEntry ? 'Aktif' : 'Hazır'} helper={activeEntry ? activeEntry.projectName : 'Yeni sayaç başlatılabilir'} active={Boolean(activeEntry)} />
      </section>

      <section className="time-workspace">
        <div className="time-tracker-card">
          <header><span><Clock3 /></span><div><small>{activeEntry ? 'AKTİF ZAMAN KAYDI' : 'YENİ ZAMAN KAYDI'}</small><h2>{activeEntry ? 'Sayaç arka planda çalışıyor' : 'Çalışmaya başlayın'}</h2></div></header>

          {loading && <div className="time-state" role="status"><LoaderCircle className="spin" /><span>Zaman çalışma alanı hazırlanıyor…</span></div>}
          {!loading && loadError && <div className="time-state error"><CircleAlert /><h3>Zaman kayıtları yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}

          {!loading && !loadError && activeEntry && (
            <div className="active-timer-panel">
              <div className="active-timer-context"><i><FolderKanban /></i><span><small>PROJE</small><strong>{activeEntry.projectName}</strong>{activeEntry.taskTitle && <em><ListTodo /> {activeEntry.taskTitle}</em>}</span></div>
              <strong className="active-timer-clock" aria-live="off">{formatTimerDuration(getElapsedSeconds(activeEntry, now))}</strong>
              {activeEntry.note && <p>{activeEntry.note}</p>}
              {formError && <div className="form-error" role="alert">{formError}</div>}
              <button className="time-stop-button" onClick={stop} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Square />}{busy ? 'Durduruluyor…' : 'Sayacı durdur'}</button>
              <small className="time-persistence-note">Başlangıç sunucuda kaydedildi. Sekmeyi kapatsanız bile sayaç devam eder.</small>
            </div>
          )}

          {!loading && !loadError && !activeEntry && (
            <form className="time-start-form" onSubmit={begin}>
              <label>Proje<select name="projectId" value={form.projectId} onChange={updateForm} disabled={busy || !activeProjects.length}><option value="">Proje seçin</option>{activeProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label>Görev <small>İsteğe bağlı</small><select name="taskId" value={form.taskId} onChange={updateForm} disabled={busy || !form.projectId}><option value="">Yalnızca projeye kaydet</option>{availableTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
              <label className="full-field">Kısa açıklama <small>İsteğe bağlı</small><textarea name="note" maxLength="500" value={form.note} onChange={updateForm} placeholder="Örn. Ana sayfa tasarım revizyonları" /></label>
              {!activeProjects.length && <div className="time-project-warning"><CircleAlert />Zaman takibi başlatmak için arşivlenmemiş bir proje gerekir.</div>}
              {formError && <div className="form-error full-field" role="alert">{formError}</div>}
              <button className="time-start-button full-field" disabled={busy || !activeProjects.length}>{busy ? <LoaderCircle className="spin" /> : <Play />}{busy ? 'Başlatılıyor…' : 'Sayacı başlat'}</button>
            </form>
          )}
        </div>

        <div className="time-today-card">
          <header><div><small>BUGÜNÜN AKIŞI</small><h2>Zaman kayıtlarınız</h2></div><strong>{formatCompactDuration(stats.todaySeconds)}</strong></header>
          <div className="time-entry-list">
            {!loading && !loadError && todayEntries.map(entry => (
              <article className={entry.isActive ? 'running' : ''} key={entry.id}>
                <i>{entry.isActive ? <Activity /> : <Check />}</i>
                <span><b>{entry.taskTitle || entry.projectName}</b><small>{entry.taskTitle ? entry.projectName : 'Proje geneli'} · {formatTimeEntryRange(entry)}</small>{entry.note && <p>{entry.note}</p>}</span>
                <strong>{formatCompactDuration(getElapsedSeconds(entry, now))}</strong>
              </article>
            ))}
            {!loading && !loadError && todayEntries.length === 0 && <div className="time-empty"><Clock3 /><h3>Bugün henüz zaman kaydı yok</h3><p>İlk sayacı başlattığınızda günün akışı burada görünecek.</p></div>}
          </div>
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
    </>
  );
}
