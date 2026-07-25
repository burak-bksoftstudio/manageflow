import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  CheckSquare2, Heading2, LoaderCircle, NotebookPen, Plus, Search, Star, Table2, Trash2, Type, X,
} from 'lucide-react';
import { usePrivateNotes } from '../features/private-notes/usePrivateNotes';

const newBlock = type => ({
  id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type,
  ...(type === 'table' ? { rows: [['', ''], ['', '']] } : { text: '', checked: false }),
});

function TableBlock({ block, change }) {
  const updateCell = (rowIndex, columnIndex, value) => change({
    ...block,
    rows: block.rows.map((row, r) => row.map((cell, c) => r === rowIndex && c === columnIndex ? value : cell)),
  });
  const addRow = () => change({ ...block, rows: [...block.rows, Array(block.rows[0]?.length || 2).fill('')] });
  const addColumn = () => change({ ...block, rows: block.rows.map(row => [...row, '']) });
  return <div className="private-table-block"><table><tbody>{block.rows.map((row, rowIndex) => <tr key={`${block.id}-r-${rowIndex}`}>{row.map((cell, columnIndex) => <td key={`${block.id}-${rowIndex}-${columnIndex}`}><input value={cell} onChange={event => updateCell(rowIndex, columnIndex, event.target.value)} placeholder={rowIndex === 0 ? 'Başlık' : 'Değer'} /></td>)}</tr>)}</tbody></table><div><button onClick={addRow}>+ Satır</button><button onClick={addColumn}>+ Sütun</button></div></div>;
}

function BlockEditor({ blocks, onChange }) {
  const change = (id, value) => onChange(blocks.map(block => block.id === id ? value : block));
  const remove = id => onChange(blocks.filter(block => block.id !== id));
  return <div className="private-block-editor">{blocks.map(block => <div className={`private-block ${block.type}`} key={block.id}><span className="private-block-handle">⋮⋮</span>{block.type === 'heading' && <input className="private-heading-input" value={block.text} onChange={event => change(block.id, { ...block, text: event.target.value })} placeholder="Başlık" />}{block.type === 'paragraph' && <textarea rows="1" value={block.text} onChange={event => change(block.id, { ...block, text: event.target.value })} placeholder="Bir şeyler yazın…" />}{block.type === 'todo' && <><button className={block.checked ? 'checked' : ''} onClick={() => change(block.id, { ...block, checked: !block.checked })}><CheckSquare2 /></button><input className={block.checked ? 'checked' : ''} value={block.text} onChange={event => change(block.id, { ...block, text: event.target.value })} placeholder="Yapılacak" /></>}{block.type === 'table' && <TableBlock block={block} change={value => change(block.id, value)} />}<button className="private-block-delete" onClick={() => remove(block.id)} title="Bloğu sil"><X /></button></div>)}</div>;
}

export default function PrivateNotesPage() {
  const {
    archiveNote, createNote, error, loading, notes, updateNote,
  } = usePrivateNotes();
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(null);
  const saveTimer = useRef(null);
  const selected = notes.find(note => note.id === selectedId);
  const filtered = useMemo(() => notes.filter(note => `${note.title} ${note.blocks.map(block => block.text || '').join(' ')}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'))), [notes, query]);

  useEffect(() => { if (!selectedId && notes[0]) setSelectedId(notes[0].id); }, [notes, selectedId]);
  useEffect(() => { if (selected) setDraft(selected); }, [selected]);
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const patchDraft = patch => {
    const next = { ...draft, ...patch };
    setDraft(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateNote(next.id, patch), 650);
  };
  const add = async () => { const result = await createNote(); if (result.data) setSelectedId(result.data.id); };
  const archive = async () => {
    if (!draft || !window.confirm(`“${draft.title}” notu arşivlensin mi?`)) return;
    await archiveNote(draft.id); setSelectedId(''); setDraft(null);
  };

  return <div className="private-notes-page"><aside className="private-notes-sidebar"><header><div><NotebookPen /><span><b>Kişisel Notlar</b><small>Yalnızca siz görebilirsiniz</small></span></div><button className="icon-button" onClick={add}><Plus /></button></header><label className="private-notes-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Notlarda ara" /></label><div className="private-note-list">{loading ? <div className="private-notes-state"><LoaderCircle className="spin" /> Notlar yükleniyor…</div> : filtered.map(note => <button key={note.id} className={selectedId === note.id ? 'active' : ''} onClick={() => setSelectedId(note.id)}><i style={{ background: `${note.color}18`, color: note.color }}>{note.icon}</i><span><b>{note.title}</b><small>{new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(note.updatedAt))}</small></span>{note.isFavorite && <Star />}</button>)}</div><button className="private-new-note" onClick={add}><Plus /> Yeni sayfa</button></aside><section className="private-note-workspace">{error && <div className="form-error">Notlar yüklenirken bir hata oluştu.</div>}{draft ? <article className="private-note-document"><header><div className="private-note-meta"><input className="private-note-icon" value={draft.icon} maxLength="2" onChange={event => patchDraft({ icon: event.target.value })} /><input type="color" value={draft.color} onChange={event => patchDraft({ color: event.target.value })} /></div><div><button className={draft.isFavorite ? 'icon-button active' : 'icon-button'} onClick={() => { patchDraft({ isFavorite: !draft.isFavorite }); }} title="Favori"><Star /></button><button className="icon-button danger" onClick={archive} title="Arşivle"><Trash2 /></button></div></header><input className="private-note-title" value={draft.title} onChange={event => patchDraft({ title: event.target.value })} placeholder="Başlıksız not" /><BlockEditor blocks={draft.blocks} onChange={blocks => patchDraft({ blocks })} /><div className="private-add-block"><span>BLOK EKLE</span><button onClick={() => patchDraft({ blocks: [...draft.blocks, newBlock('paragraph')] })}><Type /> Metin</button><button onClick={() => patchDraft({ blocks: [...draft.blocks, newBlock('heading')] })}><Heading2 /> Başlık</button><button onClick={() => patchDraft({ blocks: [...draft.blocks, newBlock('todo')] })}><CheckSquare2 /> Yapılacak</button><button onClick={() => patchDraft({ blocks: [...draft.blocks, newBlock('table')] })}><Table2 /> Tablo</button></div><small className="private-save-state">Değişiklikler otomatik kaydedilir</small></article> : <div className="private-notes-empty"><NotebookPen /><h1>Kendinize ait bir çalışma alanı.</h1><p>Toplantı notları, fikirler, yapılacaklar ve küçük tablolar için kişisel sayfalar oluşturun.</p><button className="agenda-button" onClick={add}><Plus /> İlk notu oluştur</button></div>}</section></div>;
}
