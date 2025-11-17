/**
 * Common types used across the application
 */

/**
 * GUID type - represents a UUID/GUID string
 * In TypeScript, GUIDs are represented as strings in UUID format
 * Example: "550e8400-e29b-41d4-a716-446655440000"
 */
export type Guid = string;

export type SchoolImageContent = {
  fileId: Guid;
  fileType: string;
  contentType: string;
  base64Data?: string;
  uploadedAt: string;
};

export type SchoolInfoResponse = {
  id?: Guid;
  schoolName?: string;
  slogan?: string;
  shortDescription?: string;
  fullDescription?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  fullAddress?: string;
  displayAddress?: string;
  footerText?: string;
  latitude?: number;
  longitude?: number;
  logoFileId?: Guid;
  logoImageBase64?: string;
  logoImageContentType?: string;
  bannerImage?: SchoolImageContent | null;
  stayConnectedImage?: SchoolImageContent | null;
  featureImage?: SchoolImageContent | null;
  galleryImages?: SchoolImageContent[];
  isPublished?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

