import {
  lazy, Suspense, useEffect, useMemo, useState,
} from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import { AgendaDrawer, QuickCreateModal } from './components/AppOverlays';
import AppSidebar from './components/AppSidebar';
import { initialProjects } from './data/demo';
import { useAuth } from './features/auth/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './features/auth/AuthRouteGuards';
import { getUserIdentity } from './features/auth/authUtils';
import { useOrganization } from './features/organizations/OrganizationContext';
import OrganizationRouteGuard from './features/organizations/OrganizationRouteGuard';
import { getOrganizationRoleLabel } from './features/organizations/organizationUtils';
import {
  ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage, VerifyEmailPage,
} from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import { NotFoundPage, PlaceholderPage } from './pages/PlaceholderPage';

const OrganizationOnboardingPage = lazy(() => import('./pages/OrganizationOnboardingPage'));
const InvitationAcceptancePage = lazy(() => import('./pages/InvitationAcceptancePage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));

function LazyPage({ children }) {
  return <Suspense fallback={<div className="page-inline-loading">Sayfa hazırlanıyor…</div>}>{children}</Suspense>;
}

const placeholderRoutes = [
  ['/flow-ai', 'Flow AI'],
  ['/projeler', 'Projeler'],
  ['/gorevler', 'Görevler'],
  ['/calisma-alani', 'Çalışma Alanı'],
  ['/dosyalar', 'Dosyalar'],
  ['/zaman-takibi', 'Zaman Takibi'],
  ['/ozellestirme', 'Özelleştirme'],
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
    email: 'burak@manageflow.co', fullName: 'Burak Enes', initials: 'BE',
  };
  const organization = activeOrganization ? {
    name: activeOrganization.name,
    roleLabel: getOrganizationRoleLabel(activeOrganization.role),
  } : { name: "Burak'ın Çalışma Alanı", roleLabel: 'Yönetici' };

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
  const [projects, setProjects] = useState(initialProjects);
  const [taskCount, setTaskCount] = useState(28);

  useEffect(() => {
    window.localStorage.setItem('manageflow-theme', dark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [dark]);

  const addProject = name => setProjects(value => [{ name, client: 'Yeni müşteri', progress: 0, status: 'Planlandı' }, ...value]);
  const addTask = () => setTaskCount(value => value + 1);
  const shellClass = useMemo(() => `${dark ? 'dark' : ''} ${collapsed ? 'is-collapsed' : ''}`, [dark, collapsed]);
  const shellState = {
    collapsed, setCollapsed, mobileOpen, setMobileOpen, dark, setDark,
    setModal, setAgendaOpen, notificationOpen, setNotificationOpen,
  };

  return (
    <div className={`app-shell ${shellClass}`}>
      <Routes>
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
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage {...{ projects, taskCount }} />} />
              <Route path="/ekipler" element={<LazyPage><TeamPage /></LazyPage>} />
              {placeholderRoutes.map(([path, page]) => <Route key={path} path={path} element={<PlaceholderPage page={page} />} />)}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      {modal && <QuickCreateModal type={modal} close={() => setModal(null)} {...{ addProject, addTask }} />}
      {agendaOpen && <AgendaDrawer close={() => setAgendaOpen(false)} />}
    </div>
  );
}
