// Leave Request Types for Driver

export enum LeaveType {
  Annual = 1,
  Sick = 2,
  Personal = 3,
  Emergency = 4,
  Training = 5,
  Other = 6
}

export enum LeaveStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Cancelled = 4,
  Completed = 5
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string; // ISO format
  endDate: string; // ISO format
  reason: string;
  autoReplacementEnabled: boolean;
  additionalInformation?: string;
}

export interface LeaveRequestResponse {
  id: string;
  driverId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
  approvedByAdminId?: string;
  approvedAt?: string;
  approvalNote?: string;
  autoReplacementEnabled: boolean;
  suggestedReplacementDriverId?: string;
  suggestedReplacementDriverName?: string;
  suggestedReplacementVehicleId?: string;
  conflicts?: any[];
}

export interface PaginationInfo {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LeaveRequestListResponse {
  success: boolean;
  data: LeaveRequestResponse[];
  pagination: PaginationInfo;
  pendingLeavesCount: number;
  error?: any;
}

// Helper functions
export const getLeaveTypeName = (type: LeaveType): string => {
  switch (type) {
    case LeaveType.Annual:
      return 'Annual Leave';
    case LeaveType.Sick:
      return 'Sick Leave';
    case LeaveType.Personal:
      return 'Personal Leave';
    case LeaveType.Emergency:
      return 'Emergency Leave';
    case LeaveType.Training:
      return 'Training Leave';
    case LeaveType.Other:
      return 'Other';
    default:
      return 'Unknown';
  }
};

export const getLeaveTypeIcon = (type: LeaveType): string => {
  switch (type) {
    case LeaveType.Annual:
      return 'calendar';
    case LeaveType.Sick:
      return 'medical';
    case LeaveType.Personal:
      return 'person';
    case LeaveType.Emergency:
      return 'warning';
    case LeaveType.Training:
      return 'school';
    case LeaveType.Other:
      return 'document-text';
    default:
      return 'help';
  }
};

export const getLeaveStatusName = (status: LeaveStatus): string => {
  switch (status) {
    case LeaveStatus.Pending:
      return 'Pending';
    case LeaveStatus.Approved:
      return 'Approved';
    case LeaveStatus.Rejected:
      return 'Rejected';
    case LeaveStatus.Cancelled:
      return 'Cancelled';
    case LeaveStatus.Completed:
      return 'Completed';
    default:
      return 'Unknown';
  }
};

export const getLeaveStatusColor = (status: LeaveStatus): string => {
  switch (status) {
    case LeaveStatus.Pending:
      return '#FF9800'; // Orange
    case LeaveStatus.Approved:
      return '#4CAF50'; // Green
    case LeaveStatus.Rejected:
      return '#F44336'; // Red
    case LeaveStatus.Cancelled:
      return '#9E9E9E'; // Grey
    case LeaveStatus.Completed:
      return '#2196F3'; // Blue
    default:
      return '#666666';
  }
};

export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

