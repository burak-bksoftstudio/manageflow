import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlarmClock, Bell, BriefcaseBusiness, CalendarDays, CheckSquare2,
  ChevronDown, ChevronLeft, ChevronRight, Files, FolderKanban,
  LayoutDashboard, MessageSquare, Settings2, Sparkles, Users, X,
} from 'lucide-react';
import { Avatar, Logo } from './Brand';

const navGroups = [
  {
    label: 'ÇALIŞMA',
    title: 'Proje & Görev',
    icon: BriefcaseBusiness,
    items: [
      { label: 'Projeler', to: '/projeler', icon: FolderKanban },
      { label: 'Görevler', to: '/gorevler', icon: CheckSquare2 },
      { label: 'Çalışma Alanı', to: '/calisma-alani', icon: Files },
      { label: 'Dosyalar', to: '/dosyalar', icon: Files },
      { label: 'Zaman Takibi', to: '/zaman-takibi', icon: AlarmClock },
      { label: 'Ekipler', to: '/ekipler', icon: Users },
      { label: 'Özelleştirme', to: '/ozellestirme', icon: Settings2 },
    ],
  },
  {
    label: 'İLETİŞİM',
    title: 'Ekip & Müşteri',
    icon: MessageSquare,
    items: [
      { label: 'Kanallar', to: '/kanallar', icon: MessageSquare },
      { label: 'Gelen Kutusu', to: '/gelen-kutusu', icon: Bell },
      { label: 'Takvim', to: '/takvim', icon: CalendarDays },
    ],
  },
];

function SideLink({ to, icon: Icon, label, topLevel = false, badge, closeMobile }) {
  return (
    <NavLink
      to={to}
      onClick={closeMobile}
      className={({ isActive }) => `nav-item ${topLevel ? 'top-level' : ''} ${isActive ? (topLevel ? 'active' : 'active-sub') : ''}`}
    >
      <Icon /><span>{label}</span>{badge && <em>{badge}</em>}
    </NavLink>
  );
}

export default function AppSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const [openGroups, setOpenGroups] = useState([true, false]);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {mobileOpen && <button className="scrim" aria-label="Menüyü kapat" onClick={closeMobile} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="side-top">
          <Logo />
          <button className="icon-button collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label="Menüyü daralt">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
          <button className="icon-button mobile-close" onClick={closeMobile} aria-label="Menüyü kapat"><X /></button>
        </div>

        <button className="organization">
          <Avatar />
          <span className="organization-copy"><b>Burak'ın Çalışma Alanı</b><small>Yönetici</small></span>
          <ChevronDown />
        </button>

        <nav>
          <SideLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" topLevel closeMobile={closeMobile} />
          <SideLink to="/flow-ai" icon={Sparkles} label="Flow AI" badge="AI" topLevel closeMobile={closeMobile} />

          {navGroups.map((group, groupIndex) => (
            <div className="nav-group" key={group.label}>
              <div className="group-label">{group.label}</div>
              <button
                className="nav-item group-title"
                onClick={() => setOpenGroups(value => value.map((open, index) => index === groupIndex ? !open : open))}
                aria-expanded={openGroups[groupIndex]}
              >
                <group.icon /><span>{group.title}</span><ChevronDown className={openGroups[groupIndex] ? 'rotated' : ''} />
              </button>
              {openGroups[groupIndex] && (
                <div className="subnav">
                  {group.items.map(item => <SideLink key={item.to} {...item} closeMobile={closeMobile} />)}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="account">
          <Avatar />
          <span><b>Burak Enes</b><small>burak@manageflow.co</small></span>
          <ChevronRight />
        </div>
      </aside>
    </>
  );
}
