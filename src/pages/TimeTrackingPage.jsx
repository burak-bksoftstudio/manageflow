import {
  useEffect, useMemo, useState,
} from 'react';
import {
  Activity, CalendarClock, CalendarDays, Check, ChevronLeft, ChevronRight, CircleAlert, Clock3,
  FolderKanban, History, ListTodo, LoaderCircle, Plus, Play, RefreshCw, Square, TimerReset, X,
} from 'lucide-react';
import { useTimeEntries } from '../features/time-tracking/useTimeEntries';
import {
  formatCompactDuration, formatTimeEntryDate, formatTimeEntryRange, formatTimerDuration, formatWeekRange,
  getElapsedSeconds, getTimeTrackingErrorMessage, getTimeTrackingStats, getTodaySeconds, getWeekBounds,
  getWeeklyHistory, validateManualTimeForm, validateTimerForm,
} from '../features/time-tracking/timeTrackingUtils';

function TimeStat({ icon: Icon, label, value, helper, active = false }) {
  return <article className={`time-stat ${active ? 'active' : ''}`}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}

function localInputParts(value = new Date()) {
  const pad = part => String(part).padStart(2, '0');
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

function ManualTimeEntryModal({ close, createManualEntry, projects, tasks }) {
  const initialStart = new Date(Date.now() - 60 * 60 * 1000);
  const initialParts = localInputParts(initialStart);
  const [form, setForm] = useState({
    date: initialParts.date,
    durationMinutes: '60',
    note: '',
    projectId: projects[0]?.id || '',
    startTime: initialParts.time,
    taskId: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const availableTasks = useMemo(() => tasks.filter(task => (
    !task.isArchived && !task.projectArchived && task.projectId === form.projectId
  )), [form.projectId, tasks]);

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
    const { name, value } = event.target;
    setError('');
    setForm(current => ({
      ...current,
      [name]: value,
      ...(name === 'projectId' ? { taskId: '' } : {}),
    }));
  };
  const submit = async event => {
    event.preventDefault();
    const validationError = validateManualTimeForm(form, tasks);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = await createManualEntry(form);
    setSaving(false);
    if (result.error) { setError(getTimeTrackingErrorMessage(result.error)); return; }
    close({ created: result.data });
  };

  return (
    <div className="modal-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <form className="modal time-manual-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="manual-time-title">
        <div className="modal-head"><div><span>MANUEL SÜRE</span><h2 id="manual-time-title">Geçmiş çalışmayı kaydedin</h2><p>Başlangıç ve süre sunucuda doğrulanır; geleceğe uzanan kayıtlar kabul edilmez.</p></div><button type="button" className="icon-button" onClick={close} disabled={saving} aria-label="Pencereyi kapat"><X /></button></div>
        <div className="time-manual-form">
          <label>Proje<select name="projectId" value={form.projectId} onChange={update} disabled={saving}><option value="">Proje seçin</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label>Görev <small>İsteğe bağlı</small><select name="taskId" value={form.taskId} onChange={update} disabled={saving || !form.projectId}><option value="">Yalnızca projeye kaydet</option>{availableTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
          <label>Tarih<input name="date" type="date" value={form.date} max={localInputParts().date} onChange={update} disabled={saving} /></label>
          <label>Başlangıç<input name="startTime" type="time" value={form.startTime} onChange={update} disabled={saving} /></label>
          <label className="full-field">Toplam süre <small>Dakika olarak, en fazla 24 saat</small><input name="durationMinutes" type="number" min="1" max="1440" step="1" value={form.durationMinutes} onChange={update} disabled={saving} /></label>
          <label className="full-field">Kısa açıklama <small>İsteğe bağlı</small><textarea name="note" maxLength="500" value={form.note} onChange={update} placeholder="Örn. Müşteri toplantısı ve revizyon notları" disabled={saving} /></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="soft-button" onClick={close} disabled={saving}>Vazgeç</button><button className="agenda-button" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Plus />}{saving ? 'Kaydediliyor…' : 'Süreyi kaydet'}</button></div>
      </form>
    </div>
  );
}

export default function TimeTrackingPage() {
  const {
    activeEntry, createManualEntry, entries, error: loadError, loading, projects, refresh, startTimer,
    stopTimer, tasks,
  } = useTimeEntries();
  const [form, setForm] = useState({ projectId: '', taskId: '', note: '' });
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [historyFilters, setHistoryFilters] = useState({ projectId: '', taskId: '' });

  const activeProjects = useMemo(() => projects.filter(project => !project.isArchived), [projects]);
  const availableTasks = useMemo(() => tasks.filter(task => (
    !task.isArchived && !task.projectArchived && task.projectId === form.projectId
  )), [form.projectId, tasks]);
  const stats = useMemo(() => getTimeTrackingStats(entries, now), [entries, now]);
  const todayEntries = useMemo(() => entries.filter(entry => (
    entry.isActive || getTodaySeconds(entry, now) > 0
  )).slice(0, 12), [entries, now]);
  const selectedWeek = useMemo(() => {
    const { start } = getWeekBounds(now);
    start.setDate(start.getDate() + weekOffset * 7);
    return start;
  }, [now, weekOffset]);
  const historyTasks = useMemo(() => tasks.filter(task => (
    (!historyFilters.projectId || task.projectId === historyFilters.projectId)
  )), [historyFilters.projectId, tasks]);
  const weeklyHistory = useMemo(() => getWeeklyHistory(
    entries, selectedWeek, historyFilters, now,
  ), [entries, historyFilters, now, selectedWeek]);

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

  const closeManual = result => {
    setManualOpen(false);
    if (!result?.created) return;
    setNow(new Date());
    setWeekOffset(0);
    setToast(`${formatCompactDuration(result.created.durationSeconds)} manuel süre kaydedildi.`);
  };

  const updateHistoryFilter = event => {
    const { name, value } = event.target;
    setHistoryFilters(current => ({
      ...current,
      [name]: value,
      ...(name === 'projectId' ? { taskId: '' } : {}),
    }));
  };

  return (
    <>
      <section className="time-hero">
        <div><div className="eyebrow"><i /> ZAMAN TAKİBİ</div><h1>Emeğiniz, görünür zamanda.</h1><p>Projelerde harcadığınız süreyi görevlere bağlayın; günün akışını kaybetmeden takip edin.</p></div>
        <div className="time-hero-actions"><button className="soft-button time-manual-button" onClick={() => setManualOpen(true)} disabled={loading || !activeProjects.length}><Plus /> Manuel süre</button><div className={`time-live-badge ${activeEntry ? 'running' : ''}`}><span>{activeEntry ? <Activity /> : <Clock3 />}</span><div><small>{activeEntry ? 'SAYAÇ ÇALIŞIYOR' : 'SAYAÇ HAZIR'}</small><strong>{activeEntry ? formatTimerDuration(getElapsedSeconds(activeEntry, now)) : '00:00:00'}</strong></div></div></div>
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
                <span><b>{entry.taskTitle || entry.projectName}{entry.entryType === 'manual' && <em className="time-manual-tag">Manuel</em>}</b><small>{entry.taskTitle ? entry.projectName : 'Proje geneli'} · {formatTimeEntryRange(entry)}</small>{entry.note && <p>{entry.note}</p>}</span>
                <strong>{formatCompactDuration(getElapsedSeconds(entry, now))}</strong>
              </article>
            ))}
            {!loading && !loadError && todayEntries.length === 0 && <div className="time-empty"><Clock3 /><h3>Bugün henüz zaman kaydı yok</h3><p>İlk sayacı başlattığınızda günün akışı burada görünecek.</p></div>}
          </div>
        </div>
      </section>

      <section className="time-history-card">
        <header><div><span><History /></span><div><small>KİŞİSEL GEÇMİŞ</small><h2>Haftalık çalışma dökümü</h2></div></div><strong>{formatCompactDuration(weeklyHistory.totalSeconds)}</strong></header>
        <div className="time-history-toolbar">
          <div className="time-week-nav"><button onClick={() => setWeekOffset(value => value - 1)} aria-label="Önceki hafta"><ChevronLeft /></button><button className="week-label" onClick={() => setWeekOffset(0)}><CalendarDays />{weekOffset === 0 ? 'Bu hafta' : formatWeekRange(selectedWeek)}</button><button onClick={() => setWeekOffset(value => value + 1)} disabled={weekOffset >= 0} aria-label="Sonraki hafta"><ChevronRight /></button></div>
          <select name="projectId" value={historyFilters.projectId} onChange={updateHistoryFilter} aria-label="Geçmişi projeye göre filtrele"><option value="">Tüm projeler</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
          <select name="taskId" value={historyFilters.taskId} onChange={updateHistoryFilter} aria-label="Geçmişi göreve göre filtrele"><option value="">Tüm görevler</option>{historyTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select>
        </div>
        <div className="time-history-list">
          {weeklyHistory.entries.map(entry => (
            <article key={entry.id}><span className="time-history-date"><CalendarDays /><b>{formatTimeEntryDate(entry)}</b></span><span className="time-history-context"><b>{entry.taskTitle || entry.projectName}{entry.entryType === 'manual' && <em className="time-manual-tag">Manuel</em>}</b><small>{entry.taskTitle ? entry.projectName : 'Proje geneli'} · {formatTimeEntryRange(entry)}</small>{entry.note && <p>{entry.note}</p>}</span><strong>{formatCompactDuration(getElapsedSeconds(entry, now))}</strong></article>
          ))}
          {!loading && !loadError && weeklyHistory.entries.length === 0 && <div className="time-history-empty"><History /><h3>Bu hafta için kayıt bulunamadı</h3><p>Haftayı veya filtreleri değiştirin; yeni süreler burada görünecek.</p></div>}
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {manualOpen && <ManualTimeEntryModal close={closeManual} createManualEntry={createManualEntry} projects={activeProjects} tasks={tasks} />}
    </>
  );
}
