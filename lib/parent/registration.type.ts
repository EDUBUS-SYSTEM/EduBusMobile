// Types cho registration và payment system

export interface RegistrationStatus {
  isRegistered: boolean;
  isPaid: boolean;
  registrationId?: string;
  status: "not_registered" | "registered" | "pending_payment" | "paid" | "expired";
  expiresAt?: string;
}

export interface PickupPoint {
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  description?: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  studentId: string;
  className: string;
  schoolName: string;
}

export interface PricingInfo {
  unitPricePerKm: number;
  distanceKm: number;
  estimatedPrice: number;
  currency: string;
}

export interface RegistrationInfo {
  id: string;
  parentEmail: string;
  parentName: string;
  phoneNumber: string;
  address: string;
  
  pickupPoint: PickupPoint;
  students: StudentInfo[];
  pricing: PricingInfo;
  
  status: "pending_payment" | "paid" | "expired";
  createdAt: string;
  expiresAt: string;
}

export interface PaymentRequest {
  paymentId: string;
  registrationId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  payosData: {
    orderCode: number;
    amount: number;
    description: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    returnUrl: string;
    cancelUrl: string;
  };
}

export interface PaymentResponse {
  paymentId: string;
  status: "pending" | "success" | "failed" | "cancelled";
  amount: number;
  currency: string;
  paidAt?: string;
  transactionId?: string;
}

export interface PaymentStatus {
  isLoading: boolean;
  error: string | null;
  paymentUrl?: string;
}
