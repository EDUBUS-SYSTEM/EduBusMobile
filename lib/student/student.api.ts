import { apiClient } from '../api';

export const studentApi = {
  getPhotoUrl: (fileId: string): string => {
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/File/${fileId}`;
  },
  getStudentPhotoUrl: (studentId: string): string => {
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/Student/${studentId}/photo`;
  },
};

