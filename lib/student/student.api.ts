import { apiClient } from '../api';

export const studentApi = {
  getPhotoUrl: (fileId: string): string => {
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/File/${fileId}`;
  },
};

