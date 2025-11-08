import type { Guid } from '../types';
import type { DriverTripStatus } from './driverTrip.types';

export interface ParentTripDto {
  id: Guid;
  routeId: Guid;
  serviceDate: string;
  plannedStartAt: string;
  plannedEndAt: string;
  startTime?: string;
  endTime?: string;
  status: DriverTripStatus;
  scheduleName: string;
  // Child information
  childId: Guid;
  childName: string;
  childAvatar?: string;
  childClassName?: string;
  // Child pickup/drop-off point information
  pickupStop?: {
    sequenceOrder: number;
    pickupPointName: string;
    address: string;
    plannedAt: string;
    arrivedAt?: string;
    departedAt?: string;
  };
  dropoffStop?: {
    sequenceOrder: number;
    pickupPointName: string;
    address: string;
    plannedAt: string;
    arrivedAt?: string;
    departedAt?: string;
  };
  // Total number of stops
  totalStops: number;
  completedStops: number;
  createdAt?: string;
  updatedAt?: string;
}

