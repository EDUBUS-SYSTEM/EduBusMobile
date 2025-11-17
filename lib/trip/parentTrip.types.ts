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
    latitude?: number;  
    longitude?: number;
    plannedAt: string;
    arrivedAt?: string;
    departedAt?: string;
  };
  dropoffStop?: {
    sequenceOrder: number;
    pickupPointName: string;
    address: string;
    latitude?: number;  
    longitude?: number;
    plannedAt: string;
    arrivedAt?: string;
    departedAt?: string;
  };
  // Total number of stops
  totalStops: number;
  completedStops: number;
  // Driver information
  driver?: {
    id: Guid;
    fullName: string;
    phone: string;
    isPrimary: boolean;
  };
  // Vehicle information
  vehicle?: {
    id: Guid;
    maskedPlate: string;
    capacity: number;
    status: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

