import { apiService } from '../api';
import { authApi } from '../auth/auth.api';
import { childrenApi } from '../parent/children.api';
import { Guid } from '../types';
import { DriverTripDto, DriverTripStatus } from './driverTrip.types';
import type { ParentTripChild, ParentTripDto } from './parentTrip.types';
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

    const trips: DriverTripDto[] = response.trips.map((trip, index) => ({
      id: trip.id || `temp-${index}`,
      routeId: '',
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
      isOverride: false,
      overrideReason: '',
      overrideCreatedBy: undefined,
      overrideCreatedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }));
    return trips;
  } catch (error: any) {
    console.error('Error fetching trips by date:', error);
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
        sequenceOrder: stop.sequence, // Convert from 0-based (backend) to 1-based (frontend)
        stopPointId: stop.id,
        stopPointName: stop.name,
        plannedAt: stop.plannedArrival,
        arrivedAt: stop.actualArrival,
        departedAt: stop.actualDeparture,
        address: stop.name,
        latitude: stop.location.latitude || 0,
        longitude: stop.location.longitude || 0,
        totalStudents: stop.attendance.length || 0,
        presentStudents: 0, // Not available - may need backend update
        absentStudents: 0, // Not available - may need backend update
        attendance: stop.attendance?.map(att => ({
          studentId: att.studentId,
          studentName: att.studentName,
          state: att.state,
          boardedAt: att.boardedAt ?? null,
          alightedAt: att.alightedAt ?? null,
          boardStatus: att.boardStatus ?? null,
          alightStatus: att.alightStatus ?? null,
        })) || [],
      })),
      isOverride: false, // Not in TripDto - may need backend update
      overrideReason: '',
      overrideCreatedBy: undefined,
      overrideCreatedAt: undefined,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      // Map trip type & school location for driver use
      tripType: response.scheduleSnapshot?.tripType,
      schoolLocation: response.schoolLocation
        ? {
          latitude: response.schoolLocation.latitude,
          longitude: response.schoolLocation.longitude,
          address: response.schoolLocation.address,
        }
        : undefined,
      // Map supervisor information
      supervisor: response.supervisor
        ? {
          id: response.supervisor.id,
          fullName: response.supervisor.fullName,
          phone: response.supervisor.phone,
        }
        : undefined,
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
 * End a trip
 * @param tripId - Trip ID to end
 * @returns Response with tripId, message, and endedAt
 */
export const endTrip = async (tripId: string): Promise<{ tripId: string; message: string; endedAt: string }> => {
  try {
    const response = await apiService.post<{ tripId: string; message: string; endedAt: string }>(
      `/trip/${tripId}/end`
    );
    return response;
  } catch (error: any) {
    console.error('Error ending trip:', error);

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    // Handle 400 - Bad Request (trip not found, wrong status, incomplete attendance, etc.)
    if (error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Cannot end trip');
    }

    // Handle other errors
    throw new Error(error.response?.data?.message || 'Failed to end trip. Please try again.');
  }
};

/**
 * Parent Trip API Functions
 */

const extractChildrenFromStops = (stops: ParentTripDtoResponse['stops']): ParentTripChild[] => {
  if (!Array.isArray(stops)) {
    return [];
  }

  const seen = new Set<string>();
  const children: ParentTripChild[] = [];

  for (const stop of stops) {
    if (!stop.attendance || stop.attendance.length === 0) {
      continue;
    }

    for (const student of stop.attendance) {
      if (seen.has(student.studentId)) {
        continue;
      }
      seen.add(student.studentId);
      children.push({
        id: student.studentId,
        name: student.studentName,
        studentImageId: student.studentImageId ?? null,
        state: student.state,
        boardedAt: student.boardedAt ?? null,
        boardStatus: student.boardStatus ?? null,
        alightStatus: student.alightStatus ?? null,
      });
    }
  }

  return children;
};

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

      const children = extractChildrenFromStops(trip.stops);

      let childId: Guid | undefined = children[0]?.id;
      let childName: string | undefined = children[0]?.name;

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
        tripType: trip.scheduleSnapshot?.tripType,
        childId: childId,
        childName: childName,
        childAvatar: undefined,
        childClassName: undefined,
        schoolLocation: trip.schoolLocation
          ? {
            latitude: trip.schoolLocation.latitude,
            longitude: trip.schoolLocation.longitude,
            address: trip.schoolLocation.address,
          }
          : undefined,
        children,
        stops: trip.stops.map(stop => ({
          id: stop.id,
          name: stop.name,
          sequence: stop.sequence,
          plannedArrival: stop.plannedArrival,
          actualArrival: stop.actualArrival,
          plannedDeparture: stop.plannedDeparture,
          actualDeparture: stop.actualDeparture,
          address: stop.location.address,
          latitude: stop.location.latitude,
          longitude: stop.location.longitude,
          attendance: stop.attendance?.map(att => ({
            id: att.studentId,
            name: att.studentName,
            studentImageId: att.studentImageId ?? null,
            state: att.state,
            boardedAt: att.boardedAt ?? null,
            boardStatus: att.boardStatus ?? null,
            alightStatus: att.alightStatus ?? null,
          })) || [],
        })),
        totalStops: trip.stops.length,
        completedStops: completedStops,
        driver: trip.driver
          ? {
            id: trip.driver.id,
            fullName: trip.driver.fullName,
            phone: trip.driver.phone,
            isPrimary: trip.driver.isPrimary,
          }
          : undefined,
        supervisor: (trip as any).supervisor
          ? {
            id: (trip as any).supervisor.id,
            fullName: (trip as any).supervisor.fullName,
            phone: (trip as any).supervisor.phone,
          }
          : undefined,
        vehicle: trip.vehicle ? {
          id: trip.vehicle.id,
          maskedPlate: trip.vehicle.maskedPlate,
          capacity: trip.vehicle.capacity,
          status: trip.vehicle.status,
        } : undefined,
        currentLocation: trip.currentLocation
          ? {
            latitude: trip.currentLocation.latitude,
            longitude: trip.currentLocation.longitude,
            recordedAt: trip.currentLocation.recordedAt,
            speed: trip.currentLocation.speed,
            accuracy: trip.currentLocation.accuracy,
            isMoving: trip.currentLocation.isMoving,
          }
          : undefined,
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
 * Get trips for current parent by date range (inclusive).
 * Note: This calls the existing single-day API per day; suitable for moderate ranges.
 * @param startDateISO - YYYY-MM-DD
 * @param endDateISO   - YYYY-MM-DD
 */
export const getParentTripsByDateRange = async (
  startDateISO: string,
  endDateISO: string
): Promise<ParentTripDto[]> => {
  const start = new Date(startDateISO);
  const end = new Date(endDateISO);
  const all: ParentTripDto[] = [];

  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toDateStr(d);
    const trips = await getParentTripsByDate(dateStr);
    all.push(...trips);
  }

  return all;
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
    const children = extractChildrenFromStops(response.stops);

    // Lấy child info từ attendance (nếu có)
    let childId: Guid | undefined = children[0]?.id;
    let childName: string | undefined = children[0]?.name;

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
      tripType: response.scheduleSnapshot.tripType,
      childId: childId,
      childName: childName,
      childAvatar: undefined,
      childClassName: undefined,
      schoolLocation: response.schoolLocation
        ? {
          latitude: response.schoolLocation.latitude,
          longitude: response.schoolLocation.longitude,
          address: response.schoolLocation.address,
        }
        : undefined,
      children,
      stops: response.stops.map(stop => ({
        id: stop.id,
        name: stop.name,
        sequence: stop.sequence,
        plannedArrival: stop.plannedArrival,
        actualArrival: stop.actualArrival,
        plannedDeparture: stop.plannedDeparture,
        actualDeparture: stop.actualDeparture,
        address: stop.location.address,
        latitude: stop.location.latitude,
        longitude: stop.location.longitude,
        attendance: stop.attendance?.map(att => ({
          id: att.studentId,
          name: att.studentName,
          studentImageId: att.studentImageId ?? null,
          state: att.state,
          boardedAt: att.boardedAt ?? null,
          boardStatus: att.boardStatus ?? null,
          alightStatus: att.alightStatus ?? null,
        })) || [],
      })),
      totalStops: response.stops.length,
      completedStops: completedStops,
      driver: response.driver
        ? {
          id: response.driver.id,
          fullName: response.driver.fullName,
          phone: response.driver.phone,
          isPrimary: response.driver.isPrimary,
        }
        : undefined,
      supervisor: response.supervisor
        ? {
          id: response.supervisor.id,
          fullName: response.supervisor.fullName,
          phone: response.supervisor.phone,
        }
        : undefined,
      vehicle: response.vehicle ? {
        id: response.vehicle.id,
        maskedPlate: response.vehicle.maskedPlate,
        capacity: response.vehicle.capacity,
        status: response.vehicle.status,
      } : undefined,
      currentLocation: response.currentLocation
        ? {
          latitude: response.currentLocation.latitude,
          longitude: response.currentLocation.longitude,
          recordedAt: response.currentLocation.recordedAt,
          speed: response.currentLocation.speed,
          accuracy: response.currentLocation.accuracy,
          isMoving: response.currentLocation.isMoving,
        }
        : undefined,
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

/**
 * Update multiple stops sequence order in a trip
 * @param tripId - Trip ID
 * @param stops - Array of stops with their new sequence orders
 * @returns Response with updated stops
 */
export const updateMultipleStopsSequence = async (
  tripId: string,
  stops: Array<{ pickupPointId: string; sequenceOrder: number }>
): Promise<{
  tripId: string;
  stops: Array<{
    pickupPointId: string;
    sequenceOrder: number;
    address?: string;
    arrivedAt?: string;
    departedAt?: string;
  }>;
  message: string;
  updatedAt: string;
}> => {
  try {
    const response = await apiService.put<{
      tripId: string;
      stops: Array<{
        pickupPointId: string;
        sequenceOrder: number;
        address?: string;
        arrivedAt?: string;
        departedAt?: string;
      }>;
      message: string;
      updatedAt: string;
    }>(`/trip/${tripId}/stops/arrange-multiple`, {
      stops: stops.map(s => ({
        pickupPointId: s.pickupPointId,
        sequenceOrder: s.sequenceOrder,
      })),
    });
    return response;
  } catch (error: any) {
    console.error('Error updating stops sequence:', error);

    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Cannot update stops sequence');
    }

    throw new Error(error.response?.data?.message || 'Failed to update stops sequence. Please try again.');
  }

};


