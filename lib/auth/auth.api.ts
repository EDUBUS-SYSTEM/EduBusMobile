import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../api';
import type { ApiResponse, AuthResponse, LoginCredentials } from './auth.type';

const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const res = await apiService.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    
    // Persist tokens and user info on success
    if (res.success && res.data) {
      const decodedToken = decodeJWT(res.data.accessToken);
      const userId = decodedToken?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    
      const storageData: [string, string][] = [
        ['accessToken', res.data.accessToken],
        ['refreshToken', res.data.refreshToken],
        ['userRole', res.data.role],
        ['userFullName', res.data.fullName],
        ['tokenExpiresAt', res.data.expiresAtUtc],
      ];
      
      if (userId) {
        storageData.push(['userId', userId]);
        console.log('Extracted userId from JWT:', userId);
      } else {
        console.warn('Could not extract userId from JWT token');
      }
      
      await AsyncStorage.multiSet(storageData);
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
        'userId', 
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
      const [role, fullName, userId] = await AsyncStorage.multiGet(['userRole', 'userFullName', 'userId']);
      return {
        role: role[1] as "Admin" | "Driver" | "Parent" | "Supervisor" | null,
        fullName: fullName[1] || null,
        userId: userId[1] || null,
      };
    } catch (e) {
      console.log('Get user info error:', e);
      return { role: null, fullName: null, userId: null };
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