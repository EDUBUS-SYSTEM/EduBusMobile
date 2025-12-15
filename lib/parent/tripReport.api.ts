import { apiService } from '../api';

export interface StudentTripStatistics {
  studentId: string;
  studentName: string;
  grade: string;
  amountPaid: number;
  amountPending: number;
  totalAttendanceRecords: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  totalTripsForStudent: number;
  completedTripsForStudent: number;
  upcomingTripsForStudent: number;
}

export interface ParentTripReportResponse {
  semesterId: string;
  semesterName: string;
  semesterCode: string;
  academicYear: string;
  semesterStartDate: string;
  semesterEndDate: string;
  totalStudentsRegistered: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  totalTrips: number;
  completedTrips: number;
  scheduledTrips: number;
  cancelledTrips: number;
  studentStatistics: StudentTripStatistics[];
}

export const tripReportApi = {
  async getTripReport(semesterId: string): Promise<ParentTripReportResponse> {
    const response = await apiService.get<ParentTripReportResponse>(`/parent/trip-report/${semesterId}`);
    return response;
  },
};

