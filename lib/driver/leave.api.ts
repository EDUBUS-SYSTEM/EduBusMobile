import { API_CONFIG } from '@/constants/ApiConfig';
import { apiService } from '../api';
import { CreateLeaveRequest, LeaveRequestResponse, LeaveRequestListResponse } from './leave.type';

/**
 * Driver Leave API Service
 * Handles all driver leave request-related API calls
 */
export const leaveApi = {
  /**
   * Get all leave requests for the current driver with pagination
   */
  getMyLeaveRequests: async (
    fromDate?: string, 
    toDate?: string, 
    status?: number,
    page: number = 1,
    perPage: number = 20
  ): Promise<LeaveRequestListResponse> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (status !== undefined) params.append('status', status.toString());
    params.append('page', page.toString());
    params.append('perPage', perPage.toString());
    
    return apiService.get<LeaveRequestListResponse>(
      `${API_CONFIG.ENDPOINTS.DRIVER.MY_LEAVES}?${params.toString()}`
    );
  },

  /**
   * Get a specific leave request by ID
   */
  getLeaveRequestById: async (leaveId: string): Promise<LeaveRequestResponse> => {
    return apiService.get<LeaveRequestResponse>(
      `${API_CONFIG.ENDPOINTS.DRIVER.LEAVES}/${leaveId}`
    );
  },

  /**
   * Create a new leave request
   */
  createLeaveRequest: async (request: CreateLeaveRequest): Promise<LeaveRequestResponse> => {
    return apiService.post<LeaveRequestResponse>(
      API_CONFIG.ENDPOINTS.DRIVER.SEND_LEAVE_REQUEST,
      request
    );
  },

  /**
   * Cancel a pending leave request
   */
  cancelLeaveRequest: async (leaveId: string): Promise<LeaveRequestResponse> => {
    return apiService.put<LeaveRequestResponse>(
      `${API_CONFIG.ENDPOINTS.DRIVER.LEAVES}/${leaveId}/cancel`
    );
  },

  /**
   * Update a pending leave request
   */
  updateLeaveRequest: async (
    leaveId: string, 
    request: Partial<CreateLeaveRequest>
  ): Promise<LeaveRequestResponse> => {
    return apiService.put<LeaveRequestResponse>(
      `${API_CONFIG.ENDPOINTS.DRIVER.LEAVES}/${leaveId}`,
      request
    );
  }
};
