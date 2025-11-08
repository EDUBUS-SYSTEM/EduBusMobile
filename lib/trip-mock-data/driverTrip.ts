import { apiService } from '../api';
import type { DriverTripDto } from './driverTrip.types';

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