import type { Guid } from '../types';

/**
 * Response DTOs from backend API
 * These interfaces match the structure returned by the backend
 */

/**
 * TripType enum 
 */
export enum TripType {
  Unknown = 0,
  Departure = 1,
  Return = 2
}

/**
 * SimpleTripDto response from backend (used in /trip/by-date)
 */
export interface SimpleTripDto {
  id: Guid;
  name: string;
  plannedStartAt: string;
  plannedEndAt: string;
  plateVehicle: string;
  status: string;
  totalStops: number;
  completedStops: number;
}

export interface GetTripsByDateResponse {
  date: string;
  trips: SimpleTripDto[];
}

/**
 * TripLocationDto - Location information for a trip stop
 */
export interface TripLocationDto {
  latitude: number;
  longitude: number;
  address: string;
}

export interface TripCurrentLocationDto {
  latitude: number;
  longitude: number;
  recordedAt?: string;
  speed?: number;
  accuracy?: number;
  isMoving?: boolean;
}

/**
 * TripStopDto response from backend
 */
export interface TripStopDto {
  id: Guid;
  name: string;
  plannedArrival: string;
  actualArrival?: string;
  plannedDeparture: string;
  actualDeparture?: string;
  sequence: number;
  location: TripLocationDto;
  attendance: Array<{
    studentId: Guid;
    studentName: string;
    boardedAt?: string | null;
    state: string;
  }>;
}

/**
 * TripDto response from backend (from /trip/{tripId}/detail-for-driver)
 */
export interface TripDto {
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
  currentLocation?: TripCurrentLocationDto;
  scheduleSnapshot: {
    scheduleId: Guid;
    name: string;
    startTime: string;
    endTime: string;
    rRule: string;
    tripType: TripType;
  };
  stops: TripStopDto[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Parent Trip Response DTOs
 */
export interface ParentAttendanceDto {
  studentId: Guid;
  studentName: string;
  boardedAt?: string;
  state: string;
}

export interface ParentTripStopDto {
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

export interface ParentTripDtoResponse {
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
  currentLocation?: TripCurrentLocationDto;
  scheduleSnapshot: {
    scheduleId: Guid;
    name: string;
    startTime: string;
    endTime: string;
    rRule: string;
    tripType: TripType;
  };
  stops: ParentTripStopDto[];
  createdAt: string;
  updatedAt?: string;
}

