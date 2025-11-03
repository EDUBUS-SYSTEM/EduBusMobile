import { API_CONFIG } from '@/constants/ApiConfig';
import { apiService } from '../api';
import {
  QrResponse,
  TransactionDetail,
  TransactionListResponse,
  UnpaidFeesResponse
} from './payment.type';

/**
 * Payment API Service
 * Handles all payment-related API calls
 */
export const paymentApi = {
  /**
   * Get all transactions for current parent
   * Uses /Transaction/my-transactions endpoint
   * Filtering is done on client-side
   */
  getMyTransactions: async (
    page: number = 1,
    pageSize: number = 20
  ): Promise<TransactionListResponse> => {
    return apiService.get<TransactionListResponse>(
      API_CONFIG.ENDPOINTS.TRANSACTION.MY_TRANSACTIONS,
      { 
        page, 
        pageSize
      }
    );
  },

  /**
   * Get transaction detail by ID
   * Uses /Transaction/{id} endpoint
   */
  getTransactionDetail: async (transactionId: string): Promise<TransactionDetail> => {
    return apiService.get<TransactionDetail>(
      `${API_CONFIG.ENDPOINTS.TRANSACTION.DETAIL}/${transactionId}`
    );
  },

  /**
   * Generate QR code for payment
   * Uses /Payment/{transactionId}/qrcode endpoint
   */
  generateQrCode: async (transactionId: string): Promise<QrResponse> => {
    return apiService.post<QrResponse>(
      `${API_CONFIG.ENDPOINTS.PAYMENT.GENERATE_QR}/${transactionId}/qrcode`
    );
  },

  /**
   * Get transactions by student ID
   * Uses /Transaction/student/{studentId} endpoint
   */
  getTransactionsByStudent: async (
    studentId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<any> => {
    return apiService.get(
      `${API_CONFIG.ENDPOINTS.TRANSACTION.BY_STUDENT}/${studentId}`,
      { page, pageSize }
    );
  },

  checkUnpaidFees: async (): Promise<UnpaidFeesResponse> => {
    return apiService.get<UnpaidFeesResponse>(
      API_CONFIG.ENDPOINTS.PAYMENT.UNPAID_FEES
    );
  },
};

