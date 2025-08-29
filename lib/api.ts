import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// Cấu hình base URL cho API (Expo uses EXPO_PUBLIC_* cho client-side env)
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://localhost:7061/api';

// Chuẩn hóa URL theo nền tảng: Android emulator không truy cập được localhost của host
function normalizeBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (Platform.OS === 'web' && !isLocalhost) {
      // Với web dev, luôn dùng localhost như yêu cầu
      parsed.hostname = 'localhost';
    }

    if (Platform.OS === 'android' && isLocalhost) {
      // Android emulator dùng gateway 10.0.2.2 để trỏ về host machine
      parsed.hostname = '10.0.2.2';
    }

    // Chuẩn hóa cặp port/protocol mặc định của ASP.NET dev:
    // - HTTPS: 7061, HTTP: 5223
    if (parsed.port === '7061' && parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }
    if (parsed.port === '5223' && parsed.protocol === 'https:') {
      parsed.protocol = 'http:';
    }

    // Loại bỏ dấu gạch chéo cuối nếu có để tránh double slash
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
  // Log base URL để dễ debug trên web/devtools
  // eslint-disable-next-line no-console
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
      // Xử lý khi token hết hạn
      try {
        await AsyncStorage.removeItem('accessToken');
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