import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  AlarmClock, ArrowLeftRight, Bell, BriefcaseBusiness, Building2, CalendarDays, Check, CheckSquare2,
  ChevronDown, ChevronLeft, ChevronRight, Files, FolderKanban,
  LayoutDashboard, LogOut, MessageSquare, Settings2, Sparkles, Users, X,
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
      { label: 'Dosyalar', to: '/dosyalar', icon: Files, badge: 'Yakında' },
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
      { label: 'Müşteriler', to: '/musteriler', icon: Building2 },
      { label: 'Kanallar', to: '/kanallar', icon: MessageSquare, badge: 'Yakında' },
      { label: 'Gelen Kutusu', to: '/gelen-kutusu', icon: Bell, badge: 'Yakında' },
      { label: 'Takvim', to: '/takvim', icon: CalendarDays, badge: 'Yakında' },
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

export default function AppSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, account, organization, onSignOut }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState([true, location.pathname === '/musteriler']);
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false);
  const organizationMenuRef = useRef(null);
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!organizationMenuOpen) return undefined;
    const closeOnOutsideClick = event => {
      if (!organizationMenuRef.current?.contains(event.target)) setOrganizationMenuOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setOrganizationMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [organizationMenuOpen]);

  useEffect(() => setOrganizationMenuOpen(false), [location.pathname, location.hash]);

  const toggleOrganizationMenu = () => {
    if (collapsed) setCollapsed(false);
    setOrganizationMenuOpen(open => !open);
  };

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

        <div className="organization-switcher" ref={organizationMenuRef}>
          <button
            className="organization"
            onClick={toggleOrganizationMenu}
            aria-haspopup="menu"
            aria-expanded={organizationMenuOpen}
          >
            <Avatar initials={organization.initials} imageUrl={organization.logoUrl} />
            <span className="organization-copy"><b>{organization.name}</b><small>{organization.roleLabel} · Çalışma alanı</small></span>
            <ChevronDown className={organizationMenuOpen ? 'rotated' : ''} />
          </button>
          {organizationMenuOpen && (
            <div className="organization-menu" role="menu">
              <div className="organization-menu-label">AKTİF ÇALIŞMA ALANI</div>
              <div className="organization-current" role="menuitem">
                <Avatar initials={organization.initials} imageUrl={organization.logoUrl} />
                <span><b>{organization.name}</b><small>{organization.roleLabel}</small></span>
                <Check />
              </div>
              <Link to="/ozellestirme#calisma-alani" role="menuitem" onClick={closeMobile}>
                <Settings2 /><span><b>Çalışma alanı ayarları</b><small>Ajans adı ve görünüm</small></span><ChevronRight />
              </Link>
              <div className="organization-menu-disabled" role="menuitem" aria-disabled="true">
                <ArrowLeftRight /><span><b>Çalışma alanı değiştir</b><small>Birden fazla ajans desteği</small></span><em>Yakında</em>
              </div>
            </div>
          )}
        </div>

        <nav>
          <SideLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" topLevel closeMobile={closeMobile} />
          <SideLink to="/flow-ai" icon={Sparkles} label="Flow AI" badge="Yakında" topLevel closeMobile={closeMobile} />

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
          <Link className="account-profile" to="/ozellestirme#profil" onClick={closeMobile} title="Profil ayarlarını aç">
            <Avatar initials={account.initials} imageUrl={account.avatarUrl} />
            <span className="account-copy"><b>{account.fullName}</b><small>{account.email}</small></span>
            {!onSignOut && <ChevronRight />}
          </Link>
          {onSignOut ? (
            <button className="account-logout" onClick={onSignOut} aria-label="Çıkış yap" title="Çıkış yap"><LogOut /></button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
