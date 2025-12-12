import { apiService } from '../api';
import type { EnrollChildFaceRequest, EnrollChildFaceResponse } from './faceEnrollment.type';

export const faceEnrollmentApi = {
  /**
   * Submit child's face photos for enrollment
   * Photos will be processed and stored on the server
   */
  enrollChildFace: async (
    studentId: string,
    base64Photos: string[]
  ): Promise<EnrollChildFaceResponse> => {
    // Validate photo count
    if (base64Photos.length < 3) {
      throw new Error('At least 3 photos are required');
    }
    if (base64Photos.length > 5) {
      throw new Error('Maximum 5 photos allowed');
    }

    const payload: EnrollChildFaceRequest = {
      studentId,
      facePhotos: base64Photos,
      notes: `Enrolled from mobile app at ${new Date().toISOString()}`
    };

    try {
      const response = await apiService.post<EnrollChildFaceResponse>(
        '/Parent/enroll-child',
        payload
      );
      return response;
    } catch (error: any) {
      // Handle API errors
      const errorMessage = error.response?.data?.message || 'Failed to enroll face';
      throw new Error(errorMessage);
    }
  },

  /**
   * Convert image URI to Base64
   * Handles both file:// URIs and data URIs
   */
  convertImageToBase64: async (imageUri: string): Promise<string> => {
    try {
      // If already base64, return as is
      if (imageUri.startsWith('data:image')) {
        return imageUri;
      }

      // For file:// URIs, read and convert
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw error;
    }
  }
};

