import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../api';
import type { ApiResponse, AuthResponse, LoginCredentials } from './auth.type';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const res = await apiService.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    
    // Persist tokens and user info on success
    if (res.success && res.data) {
      await AsyncStorage.multiSet([
        ['accessToken', res.data.accessToken],
        ['refreshToken', res.data.refreshToken],
        ['userRole', res.data.role],
        ['userFullName', res.data.fullName],
        ['tokenExpiresAt', res.data.expiresAtUtc],
      ]);
    }
    
    return res;
  },
  
  logout: async () => {
    try {
      await AsyncStorage.multiRemove([
        'accessToken', 
        'refreshToken', 
        'userRole', 
        'userFullName', 
        'tokenExpiresAt'
      ]);
      console.log('Logout success');
    } catch (e) {
      console.log('Logout error:', e);
      throw e;
    }
  },
  
  // Helper function to get stored user info
  getUserInfo: async () => {
    try {
      const [role, fullName] = await AsyncStorage.multiGet(['userRole', 'userFullName']);
      return {
        role: role[1] as "Admin" | "Driver" | "Parent" | null,
        fullName: fullName[1] || null,
      };
    } catch (e) {
      console.log('Get user info error:', e);
      return { role: null, fullName: null };
    }
  },
  
  // Helper function to check if user is logged in
  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    } catch (e) {
      return false;
    }
  },
};