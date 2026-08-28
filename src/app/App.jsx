import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from '@/app/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import LoadingScreen from '@/components/LoadingScreen';
import { appRoutes } from '@/app/routes';
import { isAuthPath } from '@/lib/authReturnTo';
import { I18nProvider } from '@/lib/i18n';
import { AccessibilityProvider } from '@/lib/accessibility';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  const isPublicAuthPage = isAuthPath(location.pathname);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError?.type === 'user_not_registered' && !isPublicAuthPage) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {appRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.protected ? <ProtectedRoute adminOnly={route.adminOnly}>{route.element}</ProtectedRoute> : route.element}
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <I18nProvider>
            <AccessibilityProvider>
              <ScrollToTop />
              <AuthenticatedApp />
            </AccessibilityProvider>
          </I18nProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
