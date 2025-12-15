export interface EnrollChildFaceRequest {
  studentId: string;
  facePhotos: string[];  // Base64 encoded images
  notes?: string;
}

export interface EnrollChildFaceResponse {
  success: boolean;
  message: string;
  embeddingId: string;
  photosProcessed: number;
  averageQuality: number;
  studentImageId?: string;
}
