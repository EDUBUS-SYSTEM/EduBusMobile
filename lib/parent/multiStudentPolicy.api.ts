import { apiService } from '../api';

export interface CalculatePerStudentRequest {
  studentCount: number;
  existingCount?: number;
  originalFeePerStudent?: number;
}

export interface PerStudentDiscountResult {
  position: number;
  discountPercentage: number;
  discountAmount: number;
  originalFee: number;
  finalFee: number;
  appliedTierId?: string | null;
  description?: string;
}

export interface CalculatePerStudentResponse {
  policyId?: string | null;
  policyName?: string;
  basePercentage?: number;
  maxDiscountCap: number;
  students: PerStudentDiscountResult[];
}

export const multiStudentPolicyApi = {
  calculatePerStudent: async (payload: CalculatePerStudentRequest): Promise<CalculatePerStudentResponse> => {
    const body = {
      studentCount: payload.studentCount,
      existingCount: payload.existingCount ?? 0,
      originalFeePerStudent: payload.originalFeePerStudent,
    };
    const resp = await apiService.post<any>('/MultiStudentPolicy/calculate-per-student', body);
    // Backend wraps { success, data, error }
    if (resp && typeof resp === 'object' && 'data' in resp) {
      return (resp as { data: CalculatePerStudentResponse }).data;
    }
    return resp as CalculatePerStudentResponse;
  },
};

