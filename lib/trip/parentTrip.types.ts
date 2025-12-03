import type { Guid } from '../types';
import type { DriverTripStatus } from './driverTrip.types';
import type { TripCurrentLocationDto } from './trip.response.types';

export interface ParentTripChild {
  id: Guid;
  name: string;
  state?: string;
  boardStatus?: string | null;
  alightStatus?: string | null;
  boardedAt?: string | null;
  alightedAt?: string | null;
}

export interface ParentTripStop {
  id: Guid;
  name: string;
  sequence: number;
  plannedArrival: string;
  actualArrival?: string;
  plannedDeparture: string;
  actualDeparture?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  attendance?: ParentTripChild[];
}

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
  tripType?: number; // 0=Unknown, 1=Departure, 2=Return
  // Child information
  childId: Guid;
  childName: string;
  childAvatar?: string;
  childClassName?: string;
  children?: ParentTripChild[];
  // All stops for this parent
  stops?: ParentTripStop[];
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
  // Supervisor information
  supervisor?: {
    id: Guid;
    fullName: string;
    phone: string;
  };
  // Vehicle information
  vehicle?: {
    id: Guid;
    maskedPlate: string;
    capacity: number;
    status: string;
  };
  currentLocation?: TripCurrentLocationDto;
  createdAt?: string;
  updatedAt?: string;
}

