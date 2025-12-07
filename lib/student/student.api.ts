import { apiClient } from '../api';

export const studentApi = {
  getPhotoUrl: (studentId: string): string => {
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/Student/${studentId}/photo`;
  },
};

