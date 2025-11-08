import { apiService } from '../api';
import { driverTripApi } from './driverTrip';

export interface DriverTrip {
  id: string;
  routeId: string;
  serviceDate: string;
  plannedStartAt: string;
  plannedEndAt: string;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Delayed';
  scheduleSnapshot: {
    scheduleId: string;
    name: string;
    startTime: string;
    endTime: string;
    rrule: string;
  };
  stops: {
    stopId: string;
    name: string;
    plannedArrival: string;
    status: 'pending' | 'completed' | 'missed';
  }[];
  isOverride: boolean;
  overrideReason: string;
  overrideCreatedBy: string;
  overrideCreatedAt: string;
}

export interface DriverSchedule {
  dots: {
    date: string;
    dots: {
      color: string;
      selectedDotColor?: string;
    }[];
  }[];
  byDate: Record<string, DriverTrip[]>;
}

export interface ScheduleDto {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  rrule: string;
  timezone: string;
  academicYear: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const processTripsToSchedule = (trips: DriverTrip[]): DriverSchedule => {
  const byDate: Record<string, DriverTrip[]> = {};
  const dots: { date: string; dots: { color: string; selectedDotColor?: string }[] }[] = [];

  trips.forEach(trip => {
    const date = trip.serviceDate.split('T')[0];
    if (!byDate[date]) {
      byDate[date] = [];
    }
    byDate[date].push(trip);
  });

  Object.keys(byDate).forEach(date => {
    const dateTrips = byDate[date];
    const tripCount = dateTrips.length;
    
    const dotColors = [
      '#4ECDC4',
      '#FF6B6B',
      '#45B7D1',
      '#FFEAA7',
      '#DDA0DD',
    ];

    const dateDots = [];
    
    for (let i = 0; i < Math.min(tripCount, 5); i++) {
      dateDots.push({
        color: dotColors[i] || dotColors[4],
        selectedDotColor: '#F9A826'
      });
    }

    dots.push({ date, dots: dateDots });
  });

  return { dots, byDate };
};

export const driverScheduleApi = {
  async getActiveSchedules(): Promise<ScheduleDto[]> {
    try {
      const schedules = await apiService.get<ScheduleDto[]>('/Schedule/active');
      return schedules || [];
    } catch {
      return [];
    }
  },

  async getDriverSchedule(
    driverId: string,
    startDate: string,
    endDate: string,
    schedules: ScheduleDto[]
  ): Promise<DriverSchedule> {
    try {
      const trips = await driverTripApi.getDriverScheduleByRange(driverId, startDate, endDate);
      
      if (trips && trips.length > 0) {
        const convertedTrips: DriverTrip[] = trips.map(trip => ({
          id: trip.id,
          routeId: trip.routeId,
          serviceDate: trip.serviceDate,
          plannedStartAt: trip.plannedStartAt,
          plannedEndAt: trip.plannedEndAt,
          status: trip.status,
          scheduleSnapshot: {
            scheduleId: trip.id,
            name: trip.scheduleName || 'Unknown Schedule',
            startTime: trip.plannedStartAt.split('T')[1]?.split('.')[0] || '07:30',
            endTime: trip.plannedEndAt.split('T')[1]?.split('.')[0] || '08:30',
            rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
          },
          stops: trip.stops.map(stop => ({
            stopId: stop.pickupPointId,
            name: stop.pickupPointName || stop.address,
            plannedArrival: stop.plannedAt,
            status: stop.arrivedAt ? 'completed' : 'pending'
          })),
          isOverride: trip.isOverride,
          overrideReason: trip.overrideReason,
          overrideCreatedBy: trip.overrideCreatedBy || '',
          overrideCreatedAt: trip.overrideCreatedAt || ''
        }));
        
        return processTripsToSchedule(convertedTrips);
      }
    } catch {
      // Handle error silently
    }

    return { dots: [], byDate: {} };
  }
};