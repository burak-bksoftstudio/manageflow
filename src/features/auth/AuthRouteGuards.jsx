import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function AuthLoading() {
  return (
    <div className="auth-route-loading" role="status" aria-live="polite">
      <span className="auth-loading-mark">MF</span>
      <p>Çalışma alanınız hazırlanıyor…</p>
    </div>
  );
}

export function ProtectedRoute() {
  const { isDemoMode, loading, session } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (isDemoMode) return <Outlet />;
  if (!session) return <Navigate to="/giris" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { loading, session } = useAuth();
  if (loading) return <AuthLoading />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
