import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { appApi, supabase } from '@/api/supabaseClient';
import { isAuthPath } from '@/lib/authReturnTo';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await appApi.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      const limitedUser = error?.authUser
        ? {
            id: error.authUser.id,
            email: error.authUser.email,
            full_name: error.profile?.full_name || error.authUser.user_metadata?.full_name || error.authUser.user_metadata?.name || error.authUser.email,
            role: error.profile?.role || error.authUser.user_metadata?.role || 'user',
            status: error.profile?.status,
          }
        : null;
      setUser(limitedUser);
      setIsAuthenticated(Boolean(limitedUser));
      setAuthChecked(true);
      
      setAuthError({
        type: error?.type || 'auth_required',
        message: error?.message || 'Authentication required'
      });
      throw error;
    }
  }, []);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(false);
    setAppPublicSettings({ public_settings: {} });
    try {
      await checkUserAuth();
    } catch {
      // Auth errors are stored in state for route-level handling.
    }
  }, [checkUserAuth]);

  useEffect(() => {
    checkAppState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserAuth().catch(() => {});
    });

    return () => subscription.unsubscribe();
  }, [checkAppState, checkUserAuth]);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      appApi.auth.logout("/");
    } else {
      appApi.auth.logout();
    }
  };

  const navigateToLogin = () => {
    if (isAuthPath(window.location.pathname)) return;
    appApi.auth.redirectToLogin(window.location.pathname + window.location.search);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
