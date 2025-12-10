import { apiService } from '../api';
import {
  CreateRelocationRequestDto,
  RefundCalculationResult,
  RelocationRequest,
  RelocationRequestListResponse,
} from './relocationRequest.type';

const BASE_PATH = '/RelocationRequest';

export const relocationRequestApi = {
  // Create a new relocation request
  createRequest: async (
    data: CreateRelocationRequestDto
  ): Promise<RelocationRequest> => {
    return apiService.post<RelocationRequest>(BASE_PATH, data);
  },

  // Get refund calculation preview
  calculateRefund: async (
    studentId: string,
    newDistanceKm: number
  ): Promise<RefundCalculationResult> => {
    return apiService.get<RefundCalculationResult>(
      `${BASE_PATH}/calculate-refund/${studentId}`,
      { newDistanceKm }
    );
  },

  // Get my relocation requests
  getMyRequests: async (
    status?: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<RelocationRequestListResponse> => {
    return apiService.get<RelocationRequestListResponse>(
      `${BASE_PATH}/my-requests`,
      { status, page, perPage }
    );
  },

  // Get request by ID
  getRequestById: async (requestId: string): Promise<RelocationRequest> => {
    return apiService.get<RelocationRequest>(`${BASE_PATH}/${requestId}`);
  },
};
