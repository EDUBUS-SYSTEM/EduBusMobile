import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { config } from './config';

// Get baseURL from config.ts
const RAW_API_BASE_URL = config.API_URL;

// Normalize URL by platform: Android emulator cannot access host's localhost
function normalizeBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (Platform.OS === 'web' && !isLocalhost) {
      parsed.hostname = 'localhost';
    }
    if (Platform.OS === 'android' && isLocalhost) {
      parsed.hostname = '10.0.2.2';
    }
    if (parsed.port === '7061' && parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }
    if (parsed.port === '5223' && parsed.protocol === 'https:') {
      parsed.protocol = 'http:';
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

const API_BASE_URL = normalizeBaseUrl(RAW_API_BASE_URL);

// Tạo axios instance với cấu hình mặc định
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (process.env.NODE_ENV !== 'production') {
  console.log('API_BASE_URL =>', API_BASE_URL);
}

// Request interceptor để thêm token vào header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
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
      try {
        await AsyncStorage.removeItem('accessToken');
      } catch {}
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