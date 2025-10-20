import { apiService } from '../api';

export interface DriverTripDto {
  id: string;
  routeId: string;
  routeName: string;
  serviceDate: string;
  plannedStartAt: string;
  plannedEndAt: string;
  startTime?: string;
  endTime?: string;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Delayed';
  scheduleName: string;
  totalStops: number;
  completedStops: number;
  stops: DriverTripStopDto[];
  isOverride: boolean;
  overrideReason: string;
  overrideCreatedBy?: string;
  overrideCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DriverTripStopDto {
  sequenceOrder: number;
  pickupPointId: string;
  pickupPointName: string;
  plannedAt: string;
  arrivedAt?: string;
  departedAt?: string;
  address: string;
  latitude: number;
  longitude: number;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
}

export const driverTripApi = {
  async getDriverScheduleByRange(
    driverId: string,
    startDate: string,
    endDate: string
  ): Promise<DriverTripDto[]> {
    try {
      const startDateTime = `${startDate}T17:00:00.000Z`;
      const endDateTime = `${endDate}T17:00:00.000Z`;
      
      const upperCaseDriverId = driverId.toUpperCase();
      
      const response = await apiService.get(`/Trip/driver/${upperCaseDriverId}/schedule/range?startDate=${encodeURIComponent(startDateTime)}&endDate=${encodeURIComponent(endDateTime)}`);
      
      let trips: DriverTripDto[] = [];
      if (Array.isArray(response)) {
        trips = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        trips = (response as any).data || [];
      } else if (response && typeof response === 'object' && Array.isArray(response)) {
        trips = response as DriverTripDto[];
      }

      return trips;
    } catch {
      return [];
    }
  }
};