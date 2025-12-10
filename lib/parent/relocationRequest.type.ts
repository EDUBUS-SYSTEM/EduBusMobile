export interface CreateRelocationRequestDto {
  studentId: string;
  newPickupPointAddress: string;
  newLatitude: number;
  newLongitude: number;
  newDistanceKm: number;
  reason: string;
  description: string;
  evidenceUrls: string[];
  urgentRequest: boolean;
  requestedEffectiveDate: string; // ISO date string
}

export interface RelocationRequest {
  id: string;
  requestType: string;
  requestStatus: string;
  priority: string;
  
  parentId: string;
  parentEmail: string;
  studentId: string;
  studentName: string;
  
  semesterCode: string;
  semesterName: string;
  academicYear: string;
  totalSchoolDays: number;
  daysServiced: number;
  daysRemaining: number;
  
  oldPickupPointId: string;
  oldPickupPointAddress: string;
  oldDistanceKm: number;
  
  newPickupPointAddress: string;
  newLatitude: number;
  newLongitude: number;
  newDistanceKm: number;
  newPickupPointId?: string;
  isOnExistingRoute: boolean;
  
  originalPaymentAmount: number;
  valueServiced: number;
  valueRemaining: number;
  newLocationCost: number;
  refundAmount: number;
  additionalPaymentRequired: number;
  processingFee: number;
  unitPricePerKm: number;
  
  reason: string;
  description: string;
  evidenceUrls: string[];
  urgentRequest: boolean;
  requestedEffectiveDate: string;
  
  aiRecommendation?: AIRecommendation;
  
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  adminNotes?: string;
  adminDecision?: string;
  rejectionReason?: string;
  
  implementedAt?: string;
  effectiveDate?: string;
  
  submittedAt: string;
  lastStatusUpdate: string;
  createdAt: string;
}

export interface AIRecommendation {
  recommendation: string;
  confidence: string;
  score: number;
  summary: string;
  reasons: string[];
  suggestedActions: string[];
  riskFactors: string[];
  calculatedAt: string;
}

export interface RefundCalculationResult {
  originalPayment: number;
  totalSchoolDays: number;
  daysServiced: number;
  daysRemaining: number;
  valueServiced: number;
  valueRemaining: number;
  refundPercentage: number;
  grossRefund: number;
  processingFee: number;
  netRefund: number;
  reason: string;
  newLocationCost: number;
  additionalPaymentRequired: number;
}

export interface RelocationRequestListResponse {
  data: RelocationRequest[];
  totalCount: number;
  page: number;
  perPage: number;
}

export const RelocationReasons = {
  FamilyRelocation: 'FamilyRelocation',
  Medical: 'Medical',
  Safety: 'Safety',
  FamilyEmergency: 'FamilyEmergency',
  ServiceQuality: 'ServiceQuality',
  Financial: 'Financial',
  Convenience: 'Convenience',
  Other: 'Other',
} as const;

export const RequestStatuses = {
  Draft: 'Draft',
  Pending: 'Pending',
  UnderReview: 'UnderReview',
  AwaitingPayment: 'AwaitingPayment',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Implemented: 'Implemented',
  Cancelled: 'Cancelled',
} as const;

export type RelocationReason = typeof RelocationReasons[keyof typeof RelocationReasons];
export type RequestStatus = typeof RequestStatuses[keyof typeof RequestStatuses];
