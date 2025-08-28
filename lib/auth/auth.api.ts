import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../api';
import type { ApiResponse, AuthResponse, LoginCredentials } from './auth.type';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const res = await apiService.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    // Persist tokens on success
    await AsyncStorage.multiSet([
      ['token', res.data.token],
      ['refreshToken', res.data.refreshToken],
    ]);
    return res;
  },
  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'refreshToken']);
      console.log('Logout success');
    } catch (e) {
      console.log('Logout error:', e);
      throw e;
    }
  },
};