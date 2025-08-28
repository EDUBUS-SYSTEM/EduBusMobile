import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Cấu hình base URL cho API (Expo uses EXPO_PUBLIC_* for client-side env)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '/api';

// Tạo axios instance với cấu hình mặc định
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token vào header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để xử lý lỗi
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      // Xử lý khi token hết hạn
      try {
        await AsyncStorage.removeItem('token');
      } catch {}
      // Ở mobile không có window.location; có thể phát broadcast / điều hướng ở nơi gọi
      // Tối thiểu: ghi log
      console.warn('Unauthorized - token cleared');
    }
    return Promise.reject(error);
  }
);

// Các hàm helper cho API calls
export const apiService = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const response = await apiClient.get(url, { params });
    return response.data;
  },
  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await apiClient.post(url, data);
    return response.data;
  },
  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await apiClient.put(url, data);
    return response.data;
  },
  delete: async <T>(url: string): Promise<T> => {
    const response = await apiClient.delete(url);
    return response.data;
  },
  patch: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await apiClient.patch(url, data);
    return response.data;
  },
};