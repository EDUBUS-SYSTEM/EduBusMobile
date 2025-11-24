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
}

export interface DriverTripStopDto {
  sequenceOrder: number;
  pickupPointId: Guid;
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
}

