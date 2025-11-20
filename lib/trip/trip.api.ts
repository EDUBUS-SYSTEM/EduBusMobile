import { apiService } from '../api';
import { authApi } from '../auth/auth.api';
import { childrenApi } from '../parent/children.api';
import { Guid } from '../types';
import { DriverTripDto, DriverTripStatus } from './driverTrip.types';
import type { ParentTripDto } from './parentTrip.types';
import type {
  GetTripsByDateResponse,
  ParentTripDtoResponse,
  TripDto
} from './trip.response.types';

/**
 * Trip API Service
 * Handles all trip-related API calls
 */

/**
 * Get trips by date for current driver
 * @param dateISO - ISO date string (YYYY-MM-DD) or null for today
 * @returns Array of DriverTripDto
 */
export const getTripsByDate = async (dateISO?: string | null): Promise<DriverTripDto[]> => {
  try {
    const params = dateISO ? { date: dateISO } : undefined;
    const response = await apiService.get<GetTripsByDateResponse>('/trip/by-date', params);
    
    // Map SimpleTripDto to DriverTripDto
    // Note: SimpleTripDto doesn't have all fields, so we use defaults for missing fields
    const trips: DriverTripDto[] = response.trips.map((trip, index) => ({
      id: trip.id || `temp-${index}`, // ID, will be replaced when fetching full details
      routeId: '', // Not available in SimpleTripDto
      serviceDate: response.date,
      plannedStartAt: trip.plannedStartAt,
      plannedEndAt: trip.plannedEndAt,
      startTime: undefined,
      endTime: undefined,
      status: trip.status as DriverTripDto['status'],
      scheduleName: trip.name,
      totalStops: trip.totalStops, 
      completedStops: trip.completedStops,
      stops: [], 
      isOverride: false, // Not available in SimpleTripDto
      overrideReason: '', // Not available in SimpleTripDto
      overrideCreatedBy: undefined,
      overrideCreatedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }));
    return trips;
  } catch (error: any) {
    console.error('Error fetching trips by date:', error);
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    // Handle 404 - No trips found
    if (error.response?.status === 404) {
      return [];
    }
    
    // Handle other errors
    throw new Error(error.response?.data?.message || 'Failed to load trips. Please try again.');
  }
};

/**
 * Get trip detail by ID for current driver
 * @param tripId - Trip ID
 * @returns DriverTripDto
 */
export const getTripDetail = async (tripId: string): Promise<DriverTripDto> => {
  try {
    const response = await apiService.get<TripDto>(`/trip/${tripId}/detail-for-driver`);
    
    // Calculate completed stops (stops with actualDeparture)
    const completedStops = response.stops.filter(s => s.actualDeparture).length;
    
    // Map TripDto to DriverTripDto
    const driverTrip: DriverTripDto = {
      id: response.id,
      routeId: response.routeId,
      serviceDate: response.serviceDate,
      plannedStartAt: response.plannedStartAt,
      plannedEndAt: response.plannedEndAt,
      startTime: response.startTime,
      endTime: response.endTime,
      status: response.status as DriverTripStatus,
      scheduleName: response.scheduleSnapshot.name,
      totalStops: response.stops.length,
      completedStops: completedStops,
      stops: response.stops.map(stop => ({
        sequenceOrder: stop.sequence,
        pickupPointId: stop.id,
        pickupPointName: stop.name,
        plannedAt: stop.plannedArrival,
        arrivedAt: stop.actualArrival,
        departedAt: stop.actualDeparture,
        address: stop.name, 
        latitude: stop.location.latitude || 0, 
        longitude: stop.location.longitude || 0, 
        totalStudents: stop.attendance.length || 0, 
        presentStudents: 0, // Not available - may need backend update
        absentStudents: 0, // Not available - may need backend update
      })),
      isOverride: false, // Not in TripDto - may need backend update
      overrideReason: '',
      overrideCreatedBy: undefined,
      overrideCreatedAt: undefined,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };

    return driverTrip;
  } catch (error: any) {
    console.error('Error fetching trip detail:', error);
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    // Handle 404 - Trip not found
    if (error.response?.status === 404) {
      throw new Error('Trip not found or you don\'t have access to this trip');
    }
    
    // Handle other errors
    throw new Error(error.response?.data?.message || 'Failed to load trip detail');
  }
};

/**
 * Start a trip
 * @param tripId - Trip ID to start
 * @returns Response with tripId, message, and startedAt
 */
export const startTrip = async (tripId: string): Promise<{ tripId: string; message: string; startedAt: string }> => {
  try {
    
    const response = await apiService.post<{ tripId: string; message: string; startedAt: string }>(
      `/trip/${tripId}/start`
    );
    return response;
  } catch (error: any) {
    console.error('Error starting trip:', error);
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    // Handle 400 - Bad Request (trip not found, wrong status, etc.)
    if (error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Cannot start trip');
    }
    
    // Handle other errors
    throw new Error(error.response?.data?.message || 'Failed to start trip. Please try again.');
  }
};

/**
 * Parent Trip API Functions
 */

/**
 * Get trips by date for current parent
 * @param dateISO - ISO date string (YYYY-MM-DD) or null for today
 * @returns Array of ParentTripDto (one per child per trip)
 */
export const getParentTripsByDate = async (dateISO?: string | null): Promise<ParentTripDto[]> => {
  try {
    const params = dateISO ? { date: dateISO } : undefined;
    const response = await apiService.get<ParentTripDtoResponse[]>('/trip/parent/date', params);
    
    if (!Array.isArray(response) || response.length === 0) {
      return [];
    }
    
    const parentTrips: ParentTripDto[] = [];
    
    for (const trip of response) {
      if (!trip.stops || trip.stops.length === 0) {
        continue;
      }
      
      // API đã filter sẵn chỉ trả về stops của parent
      // Pickup = stop đầu tiên, Dropoff = stop cuối cùng
      const firstStop = trip.stops[0];
      const lastStop = trip.stops[trip.stops.length - 1];
      
      // Lấy child info từ attendance (nếu có)
      let childId: Guid | undefined;
      let childName: string | undefined;
      
      // Tìm child đầu tiên từ attendance
      for (const stop of trip.stops) {
        if (stop.attendance && stop.attendance.length > 0) {
          const firstAttendance = stop.attendance[0];
          childId = firstAttendance.studentId;
          childName = firstAttendance.studentName;
          break;
        }
      }
      
      // Fallback: nếu không có attendance, lấy từ children API
      if (!childId || !childName) {
        try {
          const userInfo = await authApi.getUserInfo();
          if (userInfo.userId) {
            const children = await childrenApi.getChildrenByParent(userInfo.userId);
            if (children.length > 0) {
              childId = children[0].id;
              childName = `${children[0].firstName} ${children[0].lastName}`;
            }
          }
        } catch (error) {
          console.warn('Could not fetch parent children:', error);
        }
      }
      
      // Nếu vẫn không có child info, skip trip này
      if (!childId || !childName) {
        continue;
      }
      
      const completedStops = trip.stops.filter(s => s.actualDeparture).length;
      
      const parentTrip: ParentTripDto = {
        id: trip.id,
        routeId: trip.routeId,
        serviceDate: trip.serviceDate,
        plannedStartAt: trip.plannedStartAt,
        plannedEndAt: trip.plannedEndAt,
        startTime: trip.startTime,
        endTime: trip.endTime,
        status: trip.status as DriverTripStatus,
        scheduleName: trip.scheduleSnapshot?.name || 'Unknown Schedule',
        childId: childId,
        childName: childName,
        childAvatar: undefined,
        childClassName: undefined,
        pickupStop: {
          sequenceOrder: firstStop.sequence,
          pickupPointName: firstStop.name,
          address: firstStop.location.address,
          latitude: firstStop.location.latitude,
          longitude: firstStop.location.longitude,
          plannedAt: firstStop.plannedArrival,
          arrivedAt: firstStop.actualArrival,
          departedAt: firstStop.actualDeparture,
        },
        dropoffStop: {
          sequenceOrder: lastStop.sequence,
          pickupPointName: lastStop.name,
          address: lastStop.location.address,
          latitude: lastStop.location.latitude,
          longitude: lastStop.location.longitude,
          plannedAt: lastStop.plannedDeparture,
          arrivedAt: lastStop.actualArrival,
          departedAt: lastStop.actualDeparture,
        },
        totalStops: trip.stops.length,
        completedStops: completedStops,
        driver: trip.driver ? {
          id: trip.driver.id,
          fullName: trip.driver.fullName,
          phone: trip.driver.phone,
          isPrimary: trip.driver.isPrimary,
        } : undefined,
        vehicle: trip.vehicle ? {
          id: trip.vehicle.id,
          maskedPlate: trip.vehicle.maskedPlate,
          capacity: trip.vehicle.capacity,
          status: trip.vehicle.status,
        } : undefined,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      };
      
      parentTrips.push(parentTrip);
    }
    
    return parentTrips;
  } catch (error: any) {
    console.error('Error fetching parent trips by date:', error);
    
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    if (error.response?.status === 404) {
      return [];
    }
    
    throw new Error(error.response?.data?.message || 'Failed to load trips. Please try again.');
  }
};

/**
 * Get trip detail by ID for current parent
 * @param tripId - Trip ID
 * @returns ParentTripDto (first child if multiple)
 */
export const getParentTripDetail = async (tripId: string): Promise<ParentTripDto | null> => {
  try {
    const response = await apiService.get<ParentTripDtoResponse>(`/trip/parent/${tripId}`);
    
    if (!response.stops || response.stops.length === 0) {
      return null;
    }
    
    // API đã filter sẵn chỉ trả về stops của parent
    // Pickup = stop đầu tiên, Dropoff = stop cuối cùng
    const firstStop = response.stops[0];
    const lastStop = response.stops[response.stops.length - 1];
    
    // Lấy child info từ attendance (nếu có)
    let childId: Guid | undefined;
    let childName: string | undefined;
    
    for (const stop of response.stops) {
      if (stop.attendance && stop.attendance.length > 0) {
        const firstAttendance = stop.attendance[0];
        childId = firstAttendance.studentId;
        childName = firstAttendance.studentName;
        break;
      }
    }
    
    if (!childId || !childName) {
      return null;
    }
    
    const completedStops = response.stops.filter(s => s.actualDeparture).length;
    
    const parentTrip: ParentTripDto = {
      id: response.id,
      routeId: response.routeId,
      serviceDate: response.serviceDate,
      plannedStartAt: response.plannedStartAt,
      plannedEndAt: response.plannedEndAt,
      startTime: response.startTime,
      endTime: response.endTime,
      status: response.status as DriverTripStatus,
      scheduleName: response.scheduleSnapshot.name,
      childId: childId,
      childName: childName,
      childAvatar: undefined,
      childClassName: undefined,
      pickupStop: {
        sequenceOrder: firstStop.sequence,
        pickupPointName: firstStop.name,
        address: firstStop.location.address,
        latitude: firstStop.location.latitude,
        longitude: firstStop.location.longitude,
        plannedAt: firstStop.plannedArrival,
        arrivedAt: firstStop.actualArrival,
        departedAt: firstStop.actualDeparture,
      },
      dropoffStop: {
        sequenceOrder: lastStop.sequence,
        pickupPointName: lastStop.name,
        address: lastStop.location.address,
        latitude: lastStop.location.latitude,
        longitude: lastStop.location.longitude,
        plannedAt: lastStop.plannedDeparture,
        arrivedAt: lastStop.actualArrival,
        departedAt: lastStop.actualDeparture,
      },
      totalStops: response.stops.length,
      completedStops: completedStops,
      driver: response.driver ? {
        id: response.driver.id,
        fullName: response.driver.fullName,
        phone: response.driver.phone,
        isPrimary: response.driver.isPrimary,
      } : undefined,
      vehicle: response.vehicle ? {
        id: response.vehicle.id,
        maskedPlate: response.vehicle.maskedPlate,
        capacity: response.vehicle.capacity,
        status: response.vehicle.status,
      } : undefined,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
    
    return parentTrip;
  } catch (error: any) {
    console.error('Error fetching parent trip detail:', error);
    
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    if (error.response?.status === 404) {
      return null;
    }
    
    throw new Error(error.response?.data?.message || 'Failed to load trip detail');
  }
};

/**
 * Notify parents that driver has arrived at a stop
 * @param tripId - Trip ID
 * @param stopId - Stop/Pickup Point ID
 * @returns Response with notification details
 */
export const confirmArrival = async (
  tripId: string,
  stopId: string
): Promise<{ tripId: string; stopId: string; message: string; notifiedAt: string }> => {
  try {
    const response = await apiService.post<{
      tripId: string;
      stopId: string;
      message: string;
      notifiedAt: string;
    }>(`/trip/${tripId}/stops/${stopId}/confirm-arrival`);
    return response;
  } catch (error: any) {
    console.error('Error notifying arrival at stop:', error);

    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Cannot notify arrival');
    }

    throw new Error(error.response?.data?.message || 'Failed to notify arrival. Please try again.');
  }
};