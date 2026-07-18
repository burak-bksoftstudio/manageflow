import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from './OrganizationContext';

export default function OrganizationRouteGuard() {
  const { isDemoMode } = useAuth();
  const { activeOrganization, loading } = useOrganization();

  if (loading) {
    return (
      <div className="auth-route-loading" role="status" aria-live="polite">
        <span className="auth-loading-mark">MF</span>
        <p>Çalışma alanlarınız yükleniyor…</p>
      </div>
    );
  }
  if (!isDemoMode && !activeOrganization) return <Navigate to="/kurulum" replace />;
  return <Outlet />;
}
