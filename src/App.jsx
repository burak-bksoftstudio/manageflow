import {
  lazy, Suspense, useEffect, useMemo, useState,
} from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import { AgendaDrawer, QuickCreateModal } from './components/AppOverlays';
import AppSidebar from './components/AppSidebar';
import { useAuth } from './features/auth/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './features/auth/AuthRouteGuards';
import { getUserIdentity } from './features/auth/authUtils';
import { useOrganization } from './features/organizations/OrganizationContext';
import OrganizationRouteGuard from './features/organizations/OrganizationRouteGuard';
import { getOrganizationRoleLabel } from './features/organizations/organizationUtils';
import { getSettingsInitials } from './features/settings/settingsUtils';
import {
  ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage, VerifyEmailPage,
} from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import { NotFoundPage, PlaceholderPage } from './pages/PlaceholderPage';

const OrganizationOnboardingPage = lazy(() => import('./pages/OrganizationOnboardingPage'));
const InvitationAcceptancePage = lazy(() => import('./pages/InvitationAcceptancePage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TimeTrackingPage = lazy(() => import('./pages/TimeTrackingPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function LazyPage({ children }) {
  return <Suspense fallback={<div className="page-inline-loading">Sayfa hazırlanıyor…</div>}>{children}</Suspense>;
}

const placeholderRoutes = [
  ['/flow-ai', 'Flow AI'],
  ['/dosyalar', 'Dosyalar'],
  ['/kanallar', 'Kanallar'],
  ['/gelen-kutusu', 'Gelen Kutusu'],
  ['/takvim', 'Takvim'],
];

function AppLayout({ shellState }) {
  const { isDemoMode, signOut, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const {
    collapsed, setCollapsed, mobileOpen, setMobileOpen, dark, setDark,
    setModal, setAgendaOpen, notificationOpen, setNotificationOpen,
  } = shellState;
  const account = user ? getUserIdentity(user) : {
    avatarUrl: '', email: 'burak@manageflow.co', fullName: 'Burak Enes', initials: 'BE',
  };
  const organization = activeOrganization ? {
    initials: getSettingsInitials(activeOrganization.name),
    logoUrl: activeOrganization.logoUrl,
    name: activeOrganization.name,
    roleLabel: getOrganizationRoleLabel(activeOrganization.role),
  } : { initials: 'BE', logoUrl: '', name: "Burak'ın Çalışma Alanı", roleLabel: 'Yönetici' };

  return (
    <>
      <AppSidebar
        {...{ collapsed, setCollapsed, mobileOpen, setMobileOpen, account, organization }}
        onSignOut={isDemoMode ? null : signOut}
      />
      <main>
        <AppHeader
          {...{ setMobileOpen, dark, setDark, setAgendaOpen, notificationOpen, setNotificationOpen }}
          openModal={setModal}
        />
        <div className="page-content"><Outlet /></div>
      </main>
    </>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => window.localStorage.getItem('manageflow-theme') === 'dark');
  const [modal, setModal] = useState(null);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem('manageflow-theme', dark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [dark]);

  const shellClass = useMemo(() => `${dark ? 'dark' : ''} ${collapsed ? 'is-collapsed' : ''}`, [dark, collapsed]);
  const shellState = {
    collapsed, setCollapsed, mobileOpen, setMobileOpen, dark, setDark,
    setModal, setAgendaOpen, notificationOpen, setNotificationOpen,
  };

  return (
    <div className={`app-shell ${shellClass}`}>
      <Routes>
        <Route path="/" element={<LazyPage><LandingPage /></LazyPage>} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/kayit" element={<RegisterPage />} />
          <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
        </Route>
        <Route path="/eposta-dogrula" element={<VerifyEmailPage />} />
        <Route path="/sifre-yenile" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/davet-kabul" element={<LazyPage><InvitationAcceptancePage /></LazyPage>} />
          <Route path="/kurulum" element={<LazyPage><OrganizationOnboardingPage /></LazyPage>} />
          <Route element={<OrganizationRouteGuard />}>
            <Route element={<AppLayout shellState={shellState} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ekipler" element={<LazyPage><TeamPage /></LazyPage>} />
              <Route path="/musteriler" element={<LazyPage><ClientsPage /></LazyPage>} />
              <Route path="/projeler" element={<LazyPage><ProjectsPage /></LazyPage>} />
              <Route path="/gorevler" element={<LazyPage><TasksPage /></LazyPage>} />
              <Route path="/zaman-takibi" element={<LazyPage><TimeTrackingPage /></LazyPage>} />
              <Route path="/calisma-alani" element={<LazyPage><WorkspacePage /></LazyPage>} />
              <Route path="/arsiv" element={<LazyPage><ArchivePage /></LazyPage>} />
              <Route path="/ozellestirme" element={<LazyPage><SettingsPage /></LazyPage>} />
              {placeholderRoutes.map(([path, page]) => <Route key={path} path={path} element={<PlaceholderPage page={page} />} />)}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      {modal && <QuickCreateModal close={() => setModal(null)} />}
      {agendaOpen && <AgendaDrawer close={() => setAgendaOpen(false)} />}
    </div>
  );
}
