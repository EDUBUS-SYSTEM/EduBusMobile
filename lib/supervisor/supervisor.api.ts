import { apiService } from '../api';
import { DriverTripDto, DriverTripStopAttendanceDto } from '../trip/driverTrip.types';
import type {
  SupervisorTripDetailDto,
  SupervisorTripDetailResponse,
  SupervisorTripListItemDto,
  SupervisorTripsResponse,
} from './supervisor.types';

/**
 * Get trips for current supervisor with optional filters
 * @param dateFrom - Start date (ISO string YYYY-MM-DD) or null
 * @param dateTo - End date (ISO string YYYY-MM-DD) or null
 * @param status - Trip status filter (optional)
 * @returns Array of SupervisorTripListItemDto
 */
export const getSupervisorTrips = async (
  dateFrom?: string | null,
  dateTo?: string | null,
  status?: string | null
): Promise<SupervisorTripListItemDto[]> => {
  try {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (status) params.status = status;

    const response = await apiService.get<SupervisorTripsResponse>('/supervisor/trips', params);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching supervisor trips:', error);
    
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    if (error.response?.status === 404) {
      return [];
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to load trips. Please try again.');
  }
};

/**
 * Get trips scheduled for today for current supervisor
 * @returns Array of SupervisorTripListItemDto
 */
export const getSupervisorTripsToday = async (): Promise<SupervisorTripListItemDto[]> => {
  try {
    const response = await apiService.get<SupervisorTripsResponse>('/supervisor/trips/today');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching today\'s supervisor trips:', error);
    
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    if (error.response?.status === 404) {
      return [];
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to load today\'s trips. Please try again.');
  }
};

/**
 * Get trips by date for current supervisor (for backward compatibility)
 * @param dateISO - ISO date string (YYYY-MM-DD) or null for today
 * @returns Array of DriverTripDto (mapped from SupervisorTripListItemDto)
 */
export const getSupervisorTripsByDate = async (dateISO?: string | null): Promise<DriverTripDto[]> => {
  try {
    let trips: SupervisorTripListItemDto[];
    
    if (dateISO) {
      // Get trips for specific date
      trips = await getSupervisorTrips(dateISO, dateISO);
    } else {
      // Get today's trips
      trips = await getSupervisorTripsToday();
    }
    
    // Map SupervisorTripListItemDto to DriverTripDto for backward compatibility
    return trips.map(trip => ({
      id: trip.id,
      routeId: '', // Not available in list item
      serviceDate: trip.serviceDate,
      plannedStartAt: trip.plannedStartAt,
      plannedEndAt: trip.plannedEndAt,
      startTime: trip.startTime || undefined,
      endTime: trip.endTime || undefined,
      status: trip.status as DriverTripDto['status'],
      scheduleName: trip.routeName, // Using routeName as scheduleName
      totalStops: trip.totalStops,
      completedStops: trip.completedStops,
      stops: [], // Not available in list item
      isOverride: false,
      overrideReason: '',
      overrideCreatedBy: undefined,
      overrideCreatedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching supervisor trips by date:', error);
    throw error;
  }
};

/**
 * Get trip detail by ID for current supervisor
 * @param tripId - Trip ID
 * @returns SupervisorTripDetailDto
 */
export const getSupervisorTripDetail = async (tripId: string): Promise<SupervisorTripDetailDto> => {
  try {
    const response = await apiService.get<SupervisorTripDetailResponse>(`/supervisor/trips/${tripId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Trip not found or you don\'t have access to this trip');
  } catch (error: any) {
    console.error('Error fetching supervisor trip detail:', error);
    
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    if (error.response?.status === 403) {
      throw new Error('You don\'t have access to this trip');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Trip not found');
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to load trip detail');
  }
};

/**
 * Get trip detail and convert to DriverTripDto (for backward compatibility)
 * @param tripId - Trip ID
 * @returns DriverTripDto
 */
export const getSupervisorTripDetailAsDriverTrip = async (tripId: string): Promise<DriverTripDto> => {
  try {
    const detail = await getSupervisorTripDetail(tripId);
    
    // Calculate completed stops (stops with actualDeparture)
    const completedStops = detail.stops.filter(s => s.actualDeparture).length;
    
    // Map SupervisorTripDetailDto to DriverTripDto
    const driverTrip: DriverTripDto = {
      id: detail.id,
      routeId: '', // Not available in supervisor detail
      serviceDate: detail.serviceDate,
      plannedStartAt: detail.plannedStartAt,
      plannedEndAt: detail.plannedEndAt,
      startTime: detail.startTime || undefined,
      endTime: detail.endTime || undefined,
      status: detail.status as DriverTripDto['status'],
      scheduleName: detail.routeName, // Using routeName as scheduleName
      totalStops: detail.stops.length,
      completedStops: completedStops,
      stops: detail.stops.map(stop => {
        const attendance: DriverTripStopAttendanceDto[] = (stop.attendance || []).map(a => ({
          studentId: a.studentId,
          studentName: a.studentName,
          state: a.state,
          boardedAt: a.boardedAt ?? null,
        }));

        return {
          sequenceOrder: stop.sequence,
          pickupPointId: stop.id,
          pickupPointName: stop.name,
          plannedAt: stop.plannedArrival,
          arrivedAt: stop.actualArrival || undefined,
          departedAt: stop.actualDeparture || undefined,
          address: stop.location.address || stop.name,
          latitude: stop.location.latitude || 0,
          longitude: stop.location.longitude || 0,
          totalStudents: attendance.length || 0,
          presentStudents: attendance.filter(a => a.state === 'Present' || a.state === 'Boarded').length || 0,
          absentStudents: attendance.filter(a => a.state === 'Absent').length || 0,
          attendance,
        };
      }),
      isOverride: false,
      overrideReason: '',
      overrideCreatedBy: undefined,
      overrideCreatedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };

    return driverTrip;
  } catch (error: any) {
    console.error('Error fetching supervisor trip detail:', error);
    throw error;
  }
};

/**
 * Update student attendance for a trip
 * NOTE: Currently uses /Trip/{id}/attendance endpoint which requires Admin role.
 * Backend needs to add Supervisor role to authorization: [Authorize(Roles = Roles.Admin + "," + Roles.Supervisor)]
 * @param tripId - Trip ID
 * @param stopId - Stop/Pickup Point ID
 * @param studentId - Student ID
 * @param state - Attendance state: 'Present', 'Absent', 'Boarded', etc.
 * @returns Response with success message
 */
export const updateAttendance = async (
  tripId: string,
  stopId: string,
  studentId: string,
  state: string
): Promise<{ tripId: string; stopId: string; studentId: string; state: string; message: string }> => {
  try {
    // Using /Trip/{id}/attendance endpoint
    // TODO: Backend needs to add Supervisor role to authorization
    const response = await apiService.put<{
      tripId: string;
      stopId: string;
      studentId: string;
      state: string;
      message: string;
    }>(`/Trip/${tripId}/attendance`, {
      stopId,
      studentId,
      state,
    });
    return response;
  } catch (error: any) {
    console.error('Error updating attendance:', error);

    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (error.response?.status === 403) {
      throw new Error('You don\'t have permission to update attendance. Please contact administrator.');
    }

    if (error.response?.status === 400 || error.response?.status === 404) {
      throw new Error(error.response?.data?.message || 'Cannot update attendance');
    }

    throw new Error(error.response?.data?.message || 'Failed to update attendance. Please try again.');
  }
};

/**
 * Get trips by date range for supervisor schedule
 * Uses supervisor API endpoint
 * @param startDate - Start date (ISO string YYYY-MM-DD)
 * @param endDate - End date (ISO string YYYY-MM-DD)
 * @returns Array of SupervisorTripListItemDto
 */
export const getSupervisorScheduleByRange = async (
  startDate: string,
  endDate: string
): Promise<SupervisorTripListItemDto[]> => {
  try {
    return await getSupervisorTrips(startDate, endDate);
  } catch (error: any) {
    console.error('Error fetching supervisor schedule by range:', error);
    
    if (error.response?.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    
    // Return empty array on error
    return [];
  }
};

/**
 * Get trips by date range and convert to DriverTripDto (for backward compatibility)
 * @param supervisorId - Supervisor ID (not used, kept for compatibility)
 * @param startDate - Start date (ISO string YYYY-MM-DD)
 * @param endDate - End date (ISO string YYYY-MM-DD)
 * @returns Array of DriverTripDto
 */
export const getSupervisorScheduleByRangeAsDriverTrip = async (
  supervisorId: string,
  startDate: string,
  endDate: string
): Promise<DriverTripDto[]> => {
  try {
    const trips = await getSupervisorScheduleByRange(startDate, endDate);
    
    // Map SupervisorTripListItemDto to DriverTripDto
    return trips.map(trip => ({
      id: trip.id,
      routeId: '', // Not available in list item
      serviceDate: trip.serviceDate,
      plannedStartAt: trip.plannedStartAt,
      plannedEndAt: trip.plannedEndAt,
      startTime: trip.startTime || undefined,
      endTime: trip.endTime || undefined,
      status: trip.status as DriverTripDto['status'],
      scheduleName: trip.routeName, // Using routeName as scheduleName
      totalStops: trip.totalStops,
      completedStops: trip.completedStops,
      stops: [], // Not available in list item
      isOverride: false,
      overrideReason: '',
      overrideCreatedBy: undefined,
      overrideCreatedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching supervisor schedule by range:', error);
    return [];
  }
};

