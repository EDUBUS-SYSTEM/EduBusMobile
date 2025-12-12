import { useState, useEffect } from 'react';
import { authApi } from '@/lib/auth/auth.api';
import { isRoleAllowed, getRoleErrorMessage } from '@/lib/auth/auth.utils';
import { signalRService } from '@/lib/signalr/notificationHub.service';
import { store } from '@/store';
import { setSignalRConnecting, setSignalRConnected, setSignalRError } from '@/store/slices/signalRSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushNotificationService } from '@/lib/notification/pushNotification.service';

interface UserInfo {
  role: "Admin" | "Driver" | "Parent" | "Supervisor" | null;
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

        // Reinitialize SignalR connection with new token
        // This fixes the issue where notifications don't work when switching accounts
        try {
          console.log('🔄 Reinitializing SignalR after login...');

          // Stop existing connection if any
          if (signalRService.isConnected()) {
            console.log('🛑 Stopping existing SignalR connection...');
            await signalRService.stop();
          }

          // Get the new token and initialize SignalR
          const token = await AsyncStorage.getItem('accessToken');
          if (token) {
            console.log('🔌 Starting new SignalR connection with fresh token...');
            store.dispatch(setSignalRConnecting());
            await signalRService.initialize(token);
            store.dispatch(setSignalRConnected());
            console.log('✅ SignalR reinitialized successfully');
          } else {
            console.warn('⚠️ No access token found after login');
          }
        } catch (signalRError: any) {
          // Don't fail the login if SignalR fails, just log the error
          console.error('❌ Failed to reinitialize SignalR:', signalRError);
          store.dispatch(setSignalRError(signalRError?.message || 'SignalR initialization failed'));
        }

        // Register push notification token after login
        try {
          console.log('📱 Registering push notification token after login...');
          await pushNotificationService.reinitializeToken();
        } catch (pushError) {
          console.error('❌ Error registering push token:', pushError);
          // Don't fail login if push notification fails
        }

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
      // Unregister push notification token before logging out
      try {
        console.log('📱 Unregistering push notification token...');
        await pushNotificationService.unregisterToken();
      } catch (pushError) {
        console.error('❌ Error unregistering push token:', pushError);
        // Don't fail logout if push notification fails
      }

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
