import { apiService } from '../api';
import type { RegistrationStatus, RegistrationInfo, PaymentRequest, PaymentResponse } from './registration.type';

// Mock data storage - can be changed for testing
let mockRegistrationStatus: RegistrationStatus = {
  isRegistered: false, // Change to test different statuses
  isPaid: false,
  registrationId: "reg-123-456",
  status: "not_registered",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

export const registrationApi = {
  // Check parent registration status
  getRegistrationStatus: async (parentId: string): Promise<RegistrationStatus> => {
    // Mock API - replace with real API later
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...mockRegistrationStatus });
      }, 1000);
    });
  },

  // Function to change mock status (for testing only)
  setMockStatus: (status: Partial<RegistrationStatus>) => {
    mockRegistrationStatus = { ...mockRegistrationStatus, ...status };
    console.log("Mock status updated:", mockRegistrationStatus);
  },

  // Get detailed registration information
  getRegistrationInfo: async (registrationId: string): Promise<RegistrationInfo> => {
    // Mock API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: registrationId,
          parentEmail: "parent@example.com",
          parentName: "John Smith",
          phoneNumber: "0123456789",
          address: "123 ABC Street, District 1, HCMC",
          
          // Pickup point information
          pickupPoint: {
            address: "456 XYZ Street, District 2, HCMC",
            latitude: 10.762622,
            longitude: 106.660172,
            distanceKm: 5.2,
            description: "In front of the main building entrance",
          },
          
          // Student information
          students: [
            {
              id: "student-1",
              name: "Jane Smith",
              studentId: "HS001",
              className: "1A",
              schoolName: "FPT School",
            }
          ],
          
          // Pricing information
          pricing: {
            unitPricePerKm: 50000,
            distanceKm: 5.2,
            estimatedPrice: 260000,
            currency: "VND",
          },
          
          // Status
          status: "pending_payment",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }, 800);
    });
  },

  // Create payment request
  createPaymentRequest: async (registrationId: string): Promise<PaymentRequest> => {
    // Mock API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          paymentId: "pay-" + Date.now(),
          registrationId: registrationId,
          amount: 260000,
          currency: "VND",
          description: "Student Transportation Service Payment",
          returnUrl: "edubus://payment/success",
          cancelUrl: "edubus://payment/cancel",
          // PayOS specific fields
          payosData: {
            orderCode: Math.floor(Math.random() * 1000000),
            amount: 260000,
            description: "Student Transportation Service Payment",
            items: [
              {
                name: "Student Transportation Service",
                quantity: 1,
                price: 260000,
              }
            ],
            returnUrl: "edubus://payment/success",
            cancelUrl: "edubus://payment/cancel",
          }
        });
      }, 500);
    });
  },

  // Check payment status
  checkPaymentStatus: async (paymentId: string): Promise<PaymentResponse> => {
    // Mock API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          paymentId: paymentId,
          status: "success", // "pending", "success", "failed", "cancelled"
          amount: 260000,
          currency: "VND",
          paidAt: new Date().toISOString(),
          transactionId: "txn-" + Date.now(),
        });
      }, 300);
    });
  },

  // Confirm payment (after PayOS redirect)
  confirmPayment: async (paymentId: string, transactionId: string): Promise<{ success: boolean; message: string }> => {
    // Mock API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Payment successful! Service has been activated."
        });
      }, 500);
    });
  }
};
