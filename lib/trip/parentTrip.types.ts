import type { Guid } from '../types';
import type { DriverTripStatus } from './driverTrip.types';
import type { TripCurrentLocationDto } from './trip.response.types';

export interface ParentTripChild {
  id: Guid;
  name: string;
  studentImageId?: Guid | null;
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
  // Pickup stop info (flattened for convenience)
  pickupStop?: {
    sequenceOrder?: number;
    pickupPointName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    arrivedAt?: string;
    departedAt?: string;
    actualArrival?: string;
    actualDeparture?: string;
  };
  // Dropoff stop info (flattened for convenience)
  dropoffStop?: {
    sequenceOrder?: number;
    pickupPointName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    arrivedAt?: string;
    departedAt?: string;
    actualArrival?: string;
    actualDeparture?: string;
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
  // School location for this trip (backend TripController now returns SchoolLocation)
  schoolLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

