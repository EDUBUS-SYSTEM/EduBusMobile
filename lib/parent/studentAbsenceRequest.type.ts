export type AbsenceRequestStatus = "Pending" | "Approved" | "Rejected";
export type RawAbsenceRequestStatus = AbsenceRequestStatus | 0 | 1 | 2;

export interface StudentAbsenceRequestResponse {
  id: string;
  studentId: string;
  parentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string | null;
  status: RawAbsenceRequestStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateStudentAbsenceRequestPayload {
  studentId: string;
  parentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
}


