import { useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import IngreviaLoader from '@/components/IngreviaLoader';
import { useI18n } from '@/lib/i18n';

const DefaultFallback = () => {
  const { t } = useI18n();
  return <IngreviaLoader message={t("loading.access")} fullScreen />;
};

export default function ProtectedRoute({ children, fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'profile_required') {
      return <Navigate to={`/register?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }
    if (authError.type === 'account_pending' || authError.type === 'account_blocked') {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
          <div className="max-w-md text-center rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h1 className="font-heading text-2xl font-bold mb-2">
              {authError.type === 'account_blocked' ? 'Account blocked' : 'Account pending approval'}
            </h1>
            <p className="text-sm text-muted-foreground mb-5">{authError.message}</p>
            <Link to="/register" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
              Go to Register
            </Link>
          </div>
        </div>
      );
    }
    return unauthenticatedElement || <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement || <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children || <Outlet />;
}
