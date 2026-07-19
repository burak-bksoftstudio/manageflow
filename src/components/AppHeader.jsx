import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, CalendarDays, Command, FolderKanban, Megaphone, Menu,
  Moon, Plus, Search, Sun,
} from 'lucide-react';
import { notifications } from '../data/demo';

export default function AppHeader({ setMobileOpen, dark, setDark, openModal, setAgendaOpen, notificationOpen, setNotificationOpen }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const closeOnEscape = event => event.key === 'Escape' && setSearchOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [searchOpen]);

  return (
    <header className="header">
      <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Menüyü aç"><Menu /></button>
      <button className="agenda-button" onClick={() => setAgendaOpen(true)}><CalendarDays /> Bugünkü Gündem</button>
      <Link className="soft-button projects-shortcut" to="/projeler"><FolderKanban /> Projeler</Link>
      <span className="header-separator" />
      <button className="round-button" onClick={() => openModal('create')} aria-label="Yeni oluştur"><Plus /></button>
      <button className="round-button" onClick={() => setDark(!dark)} aria-label="Temayı değiştir">{dark ? <Sun /> : <Moon />}</button>
      <button className="round-button" onClick={() => setSearchOpen(true)} aria-label="Ara"><Search /></button>
      <div className="relative">
        <button className="round-button" onClick={() => setNotificationOpen(!notificationOpen)} aria-label="Bildirimler"><Bell /></button>
        <span className="dot" />
        {notificationOpen && (
          <div className="popover notifications">
            <div className="popover-title"><b>Bildirimler</b><span>Demo · Gerçek bildirimler yakında</span></div>
            {notifications.map((text, index) => (
              <div className="notification" key={text}>
                <i className={index === 2 ? 'amber' : ''} />
                <span>{text}<small>{index + 1} saat önce</small></span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="round-button badge-button soon-button" aria-label="Duyurular yakında" title="Duyurular yakında"><Megaphone /><b>Yakında</b></button>

      {searchOpen && (
        <div className="search-overlay" onMouseDown={() => setSearchOpen(false)}>
          <div className="search-box" onMouseDown={event => event.stopPropagation()}>
            <Search /><input autoFocus readOnly placeholder="Global arama yakında kullanılabilir olacak" /><kbd>ESC</kbd>
            <div className="search-hint"><Command /> Proje, görev, kişi ve dosya araması <span className="soon-inline">Yakında</span></div>
          </div>
        </div>
      )}
    </header>
  );
}
