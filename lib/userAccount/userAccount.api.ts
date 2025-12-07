import { apiService, apiClient } from '@/lib/api';
import { API_CONFIG } from '@/constants/ApiConfig';

export interface UserResponse {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  userPhotoFileId?: string;
}

export interface UploadAvatarResponse {
  fileId: string;
  message: string;
}

export const userAccountApi = {
  /**
   * Get user profile by ID
   */
  getUserById: async (userId: string): Promise<UserResponse> => {
    return await apiService.get<UserResponse>(`${API_CONFIG.ENDPOINTS.USER.PROFILE}/${userId}`);
  },

  /**
   * Upload user avatar photo
   */
  uploadAvatar: async (userId: string, file: { uri: string; type: string; name: string }): Promise<UploadAvatarResponse> => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'avatar.jpg',
    } as any);

    const response = await apiClient.post<UploadAvatarResponse>(
      `${API_CONFIG.ENDPOINTS.USER.PROFILE}/${userId}/upload-user-photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Get user avatar photo URL
   * Returns a URL that can be used with Image component
   */
  getAvatarUrl: (userId: string): string => {
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}${API_CONFIG.ENDPOINTS.USER.PROFILE}/${userId}/user-photo`;
  },
};

