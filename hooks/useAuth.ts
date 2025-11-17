import { useState, useEffect } from 'react';
import { authApi } from '@/lib/auth/auth.api';
import { isRoleAllowed, getRoleErrorMessage } from '@/lib/auth/auth.utils';
import { signalRService } from '@/lib/signalr/notificationHub.service';

interface UserInfo {
  role: "Admin" | "Driver" | "Parent" | null;
  fullName: string | null;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({ role: null, fullName: null });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const isLoggedIn = await authApi.isLoggedIn();
      setIsAuthenticated(isLoggedIn);

      if (isLoggedIn) {
        const info = await authApi.getUserInfo();
        setUserInfo(info);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUserInfo({ role: null, fullName: null });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password });
      
      if (res.success && res.data) {
        // Check if user role is allowed
        if (!isRoleAllowed(res.data.role)) {
          return { 
            success: false, 
            error: getRoleErrorMessage(res.data.role)
          };
        }
        
        setIsAuthenticated(true);
        setUserInfo({
          role: res.data.role,
          fullName: res.data.fullName,
        });
        return { success: true, data: res.data };
      } else {
        return { success: false, error: res.error?.message || 'Login failed' };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Disconnect SignalR before logging out
      console.log('🔌 Disconnecting SignalR...');
      await signalRService.stop();
      
      // Logout from API
      await authApi.logout();
      
      setIsAuthenticated(false);
      setUserInfo({ role: null, fullName: null });
      
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    isLoading,
    isAuthenticated,
    userInfo,
    login,
    logout,
    checkAuthStatus,
  };
};
