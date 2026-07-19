import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, CircleAlert, FolderKanban, ListTodo, LoaderCircle, RefreshCw, X, Zap,
} from 'lucide-react';
import { getTodayAgenda } from '../features/dashboard/dashboardUtils';
import { TASK_PRIORITY_LABELS } from '../features/tasks/taskUtils';
import { useTasks } from '../features/tasks/useTasks';

function useOverlayDismiss(close) {
  useEffect(() => {
    const closeOnEscape = event => event.key === 'Escape' && close();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [close]);
}

export function QuickCreateModal({ close }) {
  useOverlayDismiss(close);
  return (
    <div className="modal-layer" onMouseDown={close}>
      <div className="modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="quick-create-title">
        <div className="modal-head">
          <div><span>HIZLI OLUŞTUR</span><h2 id="quick-create-title">Yeni bir şey başlatın</h2></div>
          <button type="button" className="icon-button" onClick={close} aria-label="Pencereyi kapat"><X /></button>
        </div>
        <p className="quick-create-copy">Bağlantıları ve yetkileri koruyan gerçek oluşturma formuna ilerleyin.</p>
        <div className="choice-row quick-create-choices">
          <Link to="/projeler" onClick={close}><FolderKanban /><span><b>Yeni proje</b><small>Müşteri bağlantısıyla oluştur</small></span></Link>
          <Link to="/gorevler" onClick={close}><ListTodo /><span><b>Yeni görev</b><small>Proje ve görevli seç</small></span></Link>
        </div>
      </div>
    </div>
  );
}

export function AgendaDrawer({ close }) {
  const { error, loading, refresh, tasks } = useTasks();
  const agenda = getTodayAgenda(tasks);
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'long', weekday: 'long',
  }).format(now).toLocaleUpperCase('tr-TR');
  useOverlayDismiss(close);

  return (
    <div className="drawer-layer" onMouseDown={close}>
      <aside className="drawer" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="agenda-title">
        <div className="drawer-head">
          <div><span>{dateLabel}</span><h2 id="agenda-title">Bugünkü Gündem</h2></div>
          <button className="icon-button" onClick={close} aria-label="Gündemi kapat"><X /></button>
        </div>
        <div className="focus-card"><Zap /><span><small>GÜNÜN ODAĞI</small><b>{agenda.focusTotal ? `${agenda.focusTotal} öncelikli işi tamamla` : 'Bugün için öncelikli iş yok'}</b></span><strong>{agenda.focusCompleted}/{agenda.focusTotal}</strong></div>
        {loading && <div className="agenda-state"><LoaderCircle className="spin" /> Görevler yükleniyor…</div>}
        {!loading && error && <div className="agenda-state error"><CircleAlert /> Gündem yüklenemedi.<button onClick={refresh}><RefreshCw /> Tekrar dene</button></div>}
        {!loading && !error && agenda.items.map(task => (
          <div className="agenda-item" key={task.id}>
            <span>{TASK_PRIORITY_LABELS[task.priority]}</span><i className={task.status === 'done' ? 'done' : ''}>{task.status === 'done' && <Check />}</i>
            <div><b>{task.title}</b><small>{task.projectName} · {task.statusLabel}</small></div>
          </div>
        ))}
        {!loading && !error && agenda.items.length === 0 && <div className="agenda-state empty"><Check /><b>Bugün için görev yok</b><span>Takviminiz şu an açık görünüyor.</span></div>}
        <Link className="soft-button full" to="/gorevler" onClick={close}><ListTodo /> Tüm görevleri gör</Link>
      </aside>
    </div>
  );
}
