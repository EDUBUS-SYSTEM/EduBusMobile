import { apiService } from '../api';
import { authApi } from '../auth/auth.api';
import { childrenApi } from '../parent/children.api';
import { DriverTripDto, DriverTripStatus } from '../trip-mock-data/driverTrip.types';
import { Guid } from '../types';
import type { ParentTripDto } from './parentTrip.types';

/**
 * SimpleTripDto response from backend
 */
interface SimpleTripDto {
  id: Guid;
  name: string;
  plannedStartAt: string;
  plannedEndAt: string;
  plateVehicle: string;
  status: string;
  totalStops: number;
  completedStops: number;
}

interface GetTripsByDateResponse {
  date: string;
  trips: SimpleTripDto[];
}

/**
 * TripDto response from backend (from /trip/{tripId}/detail-for-driver)
 */
interface TripDto {
  id: Guid;
  routeId: Guid;
  serviceDate: string;
  plannedStartAt: string;
  plannedEndAt: string;
  startTime?: string;
  endTime?: string;
  status: string;
  vehicleId: Guid;
  driverVehicleId?: Guid;
  vehicle?: {
    id: Guid;
    maskedPlate: string;
    capacity: number;
    status: string;
  };
  driver?: {
    id: Guid;
    fullName: string;
    phone: string;
    isPrimary: boolean;
    snapshottedAtUtc: string;
  };
  scheduleSnapshot: {
    scheduleId: Guid;
    name: string;
    startTime: string;
    endTime: string;
    rRule: string;
  };
  stops: TripStopDto[];
  createdAt: string;
  updatedAt?: string;
}

interface TripStopDto {
  id: Guid;
  name: string;
  plannedArrival: string;
  actualArrival?: string;
  plannedDeparture: string;
  actualDeparture?: string;
  sequence: number;
}

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
      stops: [], // Not available in SimpleTripDto
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
        address: stop.name, // Use name as address since backend uses Address as Name
        latitude: 0, // Not available in TripStopDto - may need backend update
        longitude: 0, // Not available in TripStopDto - may need backend update
        totalStudents: 0, // Not available - may need backend update
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
 * ParentTripStopDto from backend (with attendance info)
 */
interface ParentTripStopDto {
  id: Guid;
  name: string;
  plannedArrival: string;
  actualArrival?: string;
  plannedDeparture: string;
  actualDeparture?: string;
  sequence: number;
  location: TripLocationDto;
  attendance?: ParentAttendanceDto[];
}
interface TripLocationDto {
  latitude: number;
  longitude: number;
  address: string;
}
interface ParentAttendanceDto {
  studentId: Guid;
  studentName: string;
  boardedAt?: string;
  state: string;
}

/**
 * TripDto response from backend for parent endpoints
 */
interface ParentTripDtoResponse {
  id: Guid;
  routeId: Guid;
  serviceDate: string;
  plannedStartAt: string;
  plannedEndAt: string;
  startTime?: string;
  endTime?: string;
  status: string;
  vehicleId: Guid;
  driverVehicleId?: Guid;
  vehicle?: {
    id: Guid;
    maskedPlate: string;
    capacity: number;
    status: string;
  };
  driver?: {
    id: Guid;
    fullName: string;
    phone: string;
    isPrimary: boolean;
    snapshottedAtUtc: string;
  };
  scheduleSnapshot: {
    scheduleId: Guid;
    name: string;
    startTime: string;
    endTime: string;
    rRule: string;
  };
  stops: ParentTripStopDto[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Get trips by date for current parent
 * @param dateISO - ISO date string (YYYY-MM-DD) or null for today
 * @returns Array of ParentTripDto (one per child per trip)
 */
export const getParentTripsByDate = async (dateISO?: string | null): Promise<ParentTripDto[]> => {
  try {
    const params = dateISO ? { date: dateISO } : undefined;
    
    const response = await apiService.get<ParentTripDtoResponse[]>('/trip/parent/date', params);
    
    // Ensure response is an array
    if (!Array.isArray(response)) {
      console.error('API response is not an array:', response);
      return [];
    }
    
    if (response.length === 0) {
      return [];
    }
    
    // Get parent's children to use as fallback when attendance is empty
    // Backend already filtered trips by parent, so if a trip is returned, it belongs to this parent
    let parentChildren: Array<{ id: string; firstName: string; lastName: string }> = [];
    try {
      const userInfo = await authApi.getUserInfo();
      if (userInfo.userId) {
        const children = await childrenApi.getChildrenByParent(userInfo.userId);
        parentChildren = children.map(c => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
        }));
      }
    } catch (error) {
      console.warn('Could not fetch parent children:', error);
    }
    
    // Map TripDto to ParentTripDto[]
    // Each trip may have multiple children, so we create one ParentTripDto per child
    const parentTrips: ParentTripDto[] = [];
    
    for (const trip of response) {
      // Get all unique children from attendance across all stops
      const childrenMap = new Map<Guid, { name: string; state: string }>();
      
      // Check if trip has stops
      if (trip.stops && trip.stops.length > 0) {
        for (const stop of trip.stops) {
          if (stop.attendance && stop.attendance.length > 0) {
            for (const attendance of stop.attendance) {
              if (!childrenMap.has(attendance.studentId)) {
                childrenMap.set(attendance.studentId, {
                  name: attendance.studentName,
                  state: attendance.state,
                });
              }
            }
          }
        }
      }
      
      // If no children found in attendance, use parent's children as fallback
      // Backend already filtered trips by parent, so these trips belong to this parent
      if (childrenMap.size === 0) {
        if (parentChildren.length > 0) {
          for (const child of parentChildren) {
            childrenMap.set(child.id, {
              name: `${child.firstName} ${child.lastName}`,
              state: 'Unknown', // No attendance data available
            });
          }
        } else {
          // If no parent children available, create a generic entry for the trip
          // Backend already filtered this trip for this parent, so we should show it
          // Use trip ID as a temporary child ID
          childrenMap.set(trip.id as Guid, {
            name: 'Student', // Generic name
            state: 'Unknown',
          });
        }
      }
      
      // At this point, childrenMap should have at least one entry
      if (childrenMap.size === 0) {
        console.error(`Still no children for trip ${trip.id} after all fallbacks - this should not happen`);
        continue;
      }
      
      // Calculate completed stops (stops with actualDeparture)
      const completedStops = trip.stops?.filter(s => s.actualDeparture).length || 0;
      
      // Create one ParentTripDto for each child
      for (const [childId, childInfo] of childrenMap.entries()) {
        // Find pickup and dropoff stops for this child
        // Pickup: first stop where child has attendance (or first stop if no attendance)
        // Dropoff: last stop where child has attendance (or last stop if no attendance)
        let pickupStop: ParentTripDto['pickupStop'] | undefined;
        let dropoffStop: ParentTripDto['dropoffStop'] | undefined;
        
        // Check if we have attendance data for this child
        const hasAttendanceData = trip.stops.some(s => 
          s.attendance?.some(a => a.studentId === childId)
        );
        
        if (hasAttendanceData) {
          // Use attendance-based logic
          for (const stop of trip.stops) {
            const hasChildAttendance = stop.attendance?.some(a => a.studentId === childId);
            if (hasChildAttendance) {
              if (!pickupStop) {
                pickupStop = {
                  sequenceOrder: stop.sequence,
                  pickupPointName: stop.name,
                    address: stop.location.address,
                  plannedAt: stop.plannedArrival,
                  arrivedAt: stop.actualArrival,
                  departedAt: stop.actualDeparture,
                    latitude: stop.location?.latitude,
                    longitude: stop.location?.longitude,
                };
              }
              // Update dropoff to the last stop with child attendance
              dropoffStop = {
                sequenceOrder: stop.sequence,
                pickupPointName: stop.name,
                  address: stop.location.address,
                  plannedAt: stop.plannedDeparture,
                  arrivedAt: stop.actualArrival,
                  departedAt: stop.actualDeparture,
                  latitude: stop.location?.latitude,
                  longitude: stop.location?.longitude,
              };
            }
          }
        } else {
          // No attendance data - use first and last stops
          // Backend already filtered stops by parent's pickup points
          if (trip.stops && trip.stops.length > 0) {
            const firstStop = trip.stops[0];
            const lastStop = trip.stops[trip.stops.length - 1];
            
            pickupStop = {
              sequenceOrder: firstStop.sequence,
              pickupPointName: firstStop.name,
              address: firstStop.location?.address || firstStop.name,
              plannedAt: firstStop.plannedArrival,
              arrivedAt: firstStop.actualArrival,
              departedAt: firstStop.actualDeparture,
              latitude: firstStop.location?.latitude,
              longitude: firstStop.location?.longitude,
            };
            
            dropoffStop = {
              sequenceOrder: lastStop.sequence,
              pickupPointName: lastStop.name,
              address: lastStop.location?.address || lastStop.name,
              plannedAt: lastStop.plannedDeparture,
              arrivedAt: lastStop.actualArrival,
              departedAt: lastStop.actualDeparture,
              latitude: lastStop.location?.latitude,
              longitude: lastStop.location?.longitude,
            };
          }
        }
        
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
          childName: childInfo.name,
          childAvatar: undefined, // Not available from backend
          childClassName: undefined, // Not available from backend
          pickupStop: pickupStop,
          dropoffStop: dropoffStop,
          totalStops: trip.stops?.length || 0,
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
    }
    
    return parentTrips;
  } catch (error: any) {
    console.error('Error fetching parent trips by date:', error);
    
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
 * Get trip detail by ID for current parent
 * @param tripId - Trip ID
 * @returns ParentTripDto (first child if multiple)
 */
export const getParentTripDetail = async (tripId: string): Promise<ParentTripDto | null> => {
  try {
    const response = await apiService.get<ParentTripDtoResponse>(`/trip/parent/${tripId}`);
    
    // Get first child from attendance (or all children if needed)
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
    
    // Find pickup and dropoff stops
    let pickupStop: ParentTripDto['pickupStop'] | undefined;
    let dropoffStop: ParentTripDto['dropoffStop'] | undefined;
    
    for (const stop of response.stops) {
      const hasChildAttendance = stop.attendance?.some(a => a.studentId === childId);
      if (hasChildAttendance) {
        if (!pickupStop) {
          pickupStop = {
            sequenceOrder: stop.sequence,
            pickupPointName: stop.name,
              address: stop.location?.address || stop.name,
              plannedAt: stop.plannedArrival,
              arrivedAt: stop.actualArrival,
              departedAt: stop.actualDeparture,
              latitude: stop.location?.latitude,
              longitude: stop.location?.longitude,
          };
        }
        dropoffStop = {
          sequenceOrder: stop.sequence,
          pickupPointName: stop.name,
            address: stop.location?.address || stop.name,
            plannedAt: stop.plannedDeparture,
            arrivedAt: stop.actualArrival,
            departedAt: stop.actualDeparture,
            latitude: stop.location?.latitude,
            longitude: stop.location?.longitude,
        };
      }
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
      pickupStop: pickupStop,
      dropoffStop: dropoffStop,
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
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    // Handle 404 - Trip not found
    if (error.response?.status === 404) {
      return null;
    }
    
    // Handle other errors
    throw new Error(error.response?.data?.message || 'Failed to load trip detail');
  }
};

