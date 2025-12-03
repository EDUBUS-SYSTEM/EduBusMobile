import type { Guid } from '../types';

export type DriverTripStatus =
  | 'Scheduled'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Delayed';

export interface DriverTripStopAttendanceDto {
  studentId: Guid;
  studentName: string;
  state: string;
  boardedAt: string | null;
  alightedAt: string | null;
  boardStatus: string | null;
  alightStatus: string | null;
}

export interface DriverTripStopDto {
  sequenceOrder: number;
  stopPointId: Guid;
  stopPointName: string;
  plannedAt: string;
  arrivedAt?: string;
  departedAt?: string;
  address: string;
  latitude: number;
  longitude: number;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  attendance?: DriverTripStopAttendanceDto[];
}

export interface DriverTripDto {
  id: Guid;
  routeId: Guid;
  serviceDate: string;
  plannedStartAt: string;
  plannedEndAt: string;
  startTime?: string;
  endTime?: string;
  status: DriverTripStatus;
  scheduleName: string;
  totalStops: number;
  completedStops: number;
  stops: DriverTripStopDto[];
  isOverride: boolean;
  overrideReason: string;
  overrideCreatedBy?: Guid;
  overrideCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Optional trip type: 1 = Departure, 2 = Return
  tripType?: number;
  // Optional school location (for displaying final destination on map)
  schoolLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  // Supervisor information
  supervisor?: {
    id: Guid;
    fullName: string;
    phone: string;
  };
}

