import type { Guid } from '../types';

/**
 * Supervisor API Response Types
 * These match the backend DTOs from SupervisorTripDto.cs
 */

export interface SupervisorAttendanceDto {
  studentId: Guid;
  studentName: string;
  className: string;
  studentImageId?: Guid | null;
  boardedAt?: string | null;
  alightedAt?: string | null;
  state: string;
  boardStatus?: string | null;
  alightStatus?: string | null;
}

export interface SupervisorTripStopDto {
  id: Guid;
  pickupPointId: Guid;
  name: string;
  plannedArrival: string;
  actualArrival?: string | null;
  plannedDeparture: string;
  actualDeparture?: string | null;
  sequence: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  attendance: SupervisorAttendanceDto[];
}

export interface SupervisorTripListItemDto {
  id: Guid;
  serviceDate: string;
  plannedStartAt: string;
  plannedEndAt: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string; // 'Scheduled', 'InProgress', 'Completed', 'Cancelled'
  routeName: string;
  vehicle?: {
    id: Guid;
    maskedPlate: string;
    capacity: number;
    status: string;
  } | null;
  driver?: {
    id: Guid;
    fullName: string;
    phone: string;
    isPrimary: boolean;
    snapshottedAtUtc: string;
  } | null;
  totalStops: number;
  completedStops: number;
}

export interface SupervisorTripDetailDto {
  id: Guid;
  serviceDate: string;
  plannedStartAt: string;
  plannedEndAt: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  routeName: string;
  vehicle?: {
    id: Guid;
    maskedPlate: string;
    capacity: number;
    status: string;
  } | null;
  driver?: {
    id: Guid;
    fullName: string;
    phone: string;
    isPrimary: boolean;
    snapshottedAtUtc: string;
  } | null;
  stops: SupervisorTripStopDto[];
}

/**
 * API Response wrapper from backend
 */
export interface SupervisorTripsResponse {
  success: boolean;
  data: SupervisorTripListItemDto[];
  count: number;
}

export interface SupervisorTripDetailResponse {
  success: boolean;
  data: SupervisorTripDetailDto;
}

