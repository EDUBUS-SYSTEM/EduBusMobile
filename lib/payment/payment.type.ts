// Transaction Status Enum - matches backend exactly
export enum TransactionStatus {
  Notyet = 0,
  Paid = 1,
  Failed = 2,
  Cancelled = 3,
  Expired = 4,
}

// Payment Provider Enum
export enum PaymentProvider {
  PayOS = 0,
  Cash = 1,
}

// Transport Fee Item Status Enum
export enum TransportFeeItemStatus {
  Unbilled = 0,
  Billed = 1,
  Paid = 2,
  Overdue = 3,
  Cancelled = 4,
}

// Transport Fee Item Type Enum
export enum TransportFeeItemType {
  Register = 0,
  Renew = 1,
  Additional = 2,
}

// Transaction Summary (for list view)
export interface TransactionSummary {
  id: string;
  transactionCode: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  paidAtUtc?: string;
  parentId: string;
  studentCount: number;
}

// Transaction List Response (for GET /api/Transaction/my-transactions)
export interface TransactionListResponse {
  transactions: TransactionSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Transaction Detail (for detail view) - matches /api/Transaction/{id}
export interface TransactionDetail {
  id: string;
  parentId: string;
  parentEmail: string;
  transactionCode: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  provider: PaymentProvider;
  createdAt: string;
  paidAt?: string;
  transportFeeItems: TransportFeeItemDetail[];
}

// Transport Fee Item Detail - matches backend TransportFeeItemDetail
export interface TransportFeeItemDetail {
  id: string;
  studentId: string;
  studentName: string;
  status: TransportFeeItemStatus;
  type: TransportFeeItemType;
  description: string;
  distanceKm: number;
  unitPricePerKm: number;
  amount: number;
  semesterName: string;
  academicYear: string;
}

// Keep old interface for backward compatibility (if needed elsewhere)
export interface TransportFeeItemResponse {
  id: string;
  studentId: string;
  studentName: string;
  status: TransportFeeItemStatus;
  description: string;
  distanceKm: number;
  unitPriceVndPerKm: number;
  quantityKm: number;
  subtotal: number;
  periodMonth: number;
  periodYear: number;
}

// QR Code Response
export interface QrResponse {
  qrCode: string;
  checkoutUrl: string;
  expiresAt: string;
}

// Helper functions
export const getStatusText = (status: TransactionStatus): string => {
  switch (status) {
    case TransactionStatus.Paid:
      return 'Paid';
    case TransactionStatus.Notyet:
      return 'Pending';
    case TransactionStatus.Failed:
      return 'Failed';
    case TransactionStatus.Cancelled:
      return 'Cancelled';
    case TransactionStatus.Expired:
      return 'Expired';
    default:
      return 'Unknown';
  }
};

export const getStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case TransactionStatus.Paid:
      return '#4CAF50';
    case TransactionStatus.Notyet:
      return '#FF9800';
    case TransactionStatus.Failed:
      return '#F44336';
    case TransactionStatus.Cancelled:
      return '#9E9E9E';
    case TransactionStatus.Expired:
      return '#9E9E9E';
    default:
      return '#757575';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

