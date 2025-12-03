import { apiService } from '../api';

export type Gender = 1 | 2 | 3;

export interface ParentRegistrationRequestDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string; // ISO date (yyyy-MM-dd)
  gender: Gender;
}

export interface ParentRegistrationResponseDto {
  registrationId: string;
  email: string;
  emailExists: boolean;
  otpSent: boolean;
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface StudentCurrentPickupPointDto {
  pickupPointId: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  assignedAt?: string | null;
}

export interface StudentBriefDto {
  id: string;
  firstName: string;
  lastName: string;
  hasCurrentPickupPoint: boolean;
  currentPickupPoint?: StudentCurrentPickupPointDto | null;
}

export interface StudentRegistrationBlockDto extends StudentBriefDto {
  status: string;
  reason: string;
}

export interface ParentRegistrationSemesterDto {
  code: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
}

export interface ParentRegistrationEligibilityDto {
  isRegistrationWindowOpen: boolean;
  hasEligibleStudents: boolean;
  semester?: ParentRegistrationSemesterDto;
  eligibleStudents: StudentBriefDto[];
  blockedStudents: StudentRegistrationBlockDto[];
  message?: string;
}

export interface VerifyOtpWithStudentsResponseDto {
  verified: boolean;
  message: string;
  students: StudentBriefDto[];
  emailExists: boolean;
}

export interface SubmitPickupPointRequestDto {
  email: string;
  studentIds: string[];
  addressText: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  description?: string;
  reason?: string;
}

export interface SubmitPickupPointRequestResponseDto {
  requestId: string;
  status: string;
  message: string;
  estimatedPriceVnd: number;
  createdAt: string;
}

export interface ReusePickupPointPayload {
  latitude: number;
  longitude: number;
  addressText: string;
  pickupPointId?: string;
  studentIds: string[];
}

export const REUSE_PICKUP_POINT_STORAGE_KEY = 'reusePickupPoint';

export interface UnitPriceResponseDto {
  id: string;
  name: string;
  description: string;
  pricePerKm: number;
  effectiveFrom: string;
  isActive: boolean;
  isDeleted: boolean;
  byAdminId: string;
  byAdminName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SemesterFeeInfo {
  totalFee: number;
  semesterInfo: {
    name: string;
    academicYear: string;
    totalSchoolDays: number;
    totalTrips: number;
  };
}

export interface ParentRegistrationInfoDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  gender: number;
  createdAt: string;
}

export interface PickupPointRequestDetailDto {
  id: string;
  parentEmail: string;
  parentInfo?: ParentRegistrationInfoDto;
  students: StudentBriefDto[];
  addressText: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  description: string;
  reason: string;
  unitPricePerKm: number;
  totalFee: number;
  semesterName: string;
  semesterCode: string;
  academicYear: string;
  semesterStartDate: string;
  semesterEndDate: string;
  totalSchoolDays: number;
  status: string;
  adminNotes: string;
  reviewedAt?: string | null;
  reviewedByAdminId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export const pickupPointApi = {
  // Register parent (public endpoint)
  registerParent: async (data: ParentRegistrationRequestDto): Promise<ParentRegistrationResponseDto> => {
    const response = await apiService.post<ParentRegistrationResponseDto>('/PickupPoint/register', data);
    return response;
  },

  // Verify OTP (public endpoint)
  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpWithStudentsResponseDto> => {
    const response = await apiService.post<VerifyOtpWithStudentsResponseDto>('/PickupPoint/verify-otp', data);
    return response;
  },

  // Submit pickup point request
  submitRequest: async (data: SubmitPickupPointRequestDto): Promise<SubmitPickupPointRequestResponseDto> => {
    const response = await apiService.post<SubmitPickupPointRequestResponseDto>('/PickupPoint/submit-request', data);
    return response;
  },

  // Get current unit price
  getCurrentUnitPrice: async (): Promise<UnitPriceResponseDto> => {
    const response = await apiService.get<UnitPriceResponseDto>('/UnitPrice/current-effective');
    return response;
  },

  // Calculate semester fee
  calculateSemesterFee: async (distanceKm: number): Promise<SemesterFeeInfo> => {
    const response = await apiService.post<SemesterFeeInfo>('/Transaction/calculate-fee', { distanceKm });
    return response;
  },

  // Check eligibility for parent registration flow
  getRegistrationEligibility: async (): Promise<ParentRegistrationEligibilityDto> => {
    const response = await apiService.get<ParentRegistrationEligibilityDto>('/PickupPoint/registration/eligibility');
    return response;
  },

  // Get pickup point registration history for current parent
  getParentRequests: async (status?: string): Promise<PickupPointRequestDetailDto[]> => {
    const params = status ? { status } : undefined;
    const response = await apiService.get<PickupPointRequestDetailDto[]>('/PickupPoint/parent/requests', params);
    return response;
  },
};

