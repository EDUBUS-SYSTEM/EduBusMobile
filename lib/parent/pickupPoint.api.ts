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

export interface StudentBriefDto {
  id: string;
  firstName: string;
  lastName: string;
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
    const serializedData = JSON.stringify(data, (key, value) => {
      if (key === 'studentIds' && Array.isArray(value)) {
        return value.map((id: string) => {
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            return id;
          }
          return id;
        });
      }
      return value;
    });
    
    const response = await apiService.post<SubmitPickupPointRequestResponseDto>('/PickupPoint/submit-request', JSON.parse(serializedData));
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
};

