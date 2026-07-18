import { useState } from 'react';
import { Check, FolderKanban, ListTodo, Plus, X, Zap } from 'lucide-react';
import { agendaItems } from '../data/demo';

export function QuickCreateModal({ type, close, addProject, addTask }) {
  const [name, setName] = useState('');
  const [choice, setChoice] = useState('project');
  const submit = event => {
    event.preventDefault();
    if (!name.trim()) return;
    if ((type === 'create' ? choice : type) === 'project') addProject(name.trim());
    else addTask();
    close();
  };

  return (
    <div className="modal-layer" onMouseDown={close}>
      <form className="modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()}>
        <div className="modal-head">
          <div><span>HIZLI OLUŞTUR</span><h2>Yeni bir şey başlatın</h2></div>
          <button type="button" className="icon-button" onClick={close} aria-label="Pencereyi kapat"><X /></button>
        </div>
        {type === 'create' && (
          <div className="choice-row">
            <button type="button" className={choice === 'project' ? 'selected' : ''} onClick={() => setChoice('project')}><FolderKanban /> Proje</button>
            <button type="button" className={choice === 'task' ? 'selected' : ''} onClick={() => setChoice('task')}><ListTodo /> Görev</button>
          </div>
        )}
        <label>{(type === 'task' || choice === 'task') ? 'Görev adı' : 'Proje adı'}
          <input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Örn. Yeni web sitesi" />
        </label>
        <label>Müşteri / Proje
          <select><option>North Studio</option><option>Atlas Labs</option><option>Mono Coffee</option></select>
        </label>
        <div className="modal-actions">
          <button type="button" className="soft-button" onClick={close}>Vazgeç</button>
          <button className="agenda-button"><Plus /> Oluştur</button>
        </div>
      </form>
    </div>
  );
}

export function AgendaDrawer({ close }) {
  return (
    <div className="drawer-layer" onMouseDown={close}>
      <aside className="drawer" onMouseDown={event => event.stopPropagation()}>
        <div className="drawer-head">
          <div><span>19 TEMMUZ, PAZAR</span><h2>Bugünkü Gündem</h2></div>
          <button className="icon-button" onClick={close} aria-label="Gündemi kapat"><X /></button>
        </div>
        <div className="focus-card"><Zap /><span><small>GÜNÜN ODAĞI</small><b>3 önemli işi tamamla</b></span><strong>2/3</strong></div>
        {agendaItems.map(([time, title, type], index) => (
          <div className="agenda-item" key={title}>
            <span>{time}</span><i className={index === 1 ? 'done' : ''}>{index === 1 && <Check />}</i>
            <div><b>{title}</b><small>{type}</small></div>
          </div>
        ))}
        <button className="soft-button full"><Plus /> Gündeme ekle</button>
      </aside>
    </div>
  );
}
