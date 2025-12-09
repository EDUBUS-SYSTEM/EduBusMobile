import { Guid } from '../types';

export type TripIncidentReason =
  | 'VehicleIssue'
  | 'StudentIssue'
  | 'RouteBlocked'
  | 'Weather'
  | 'SafetyConcern'
  | 'IoTDeviceIssue'
  | 'Other';

export type TripIncidentStatus = 'Open' | 'Acknowledged' | 'Resolved';

export type TripIncidentListItem = {
  id: Guid;
  tripId: Guid;
  reason: TripIncidentReason;
  title: string;
  description?: string | null;
  status: TripIncidentStatus;
  createdAt: string;
  routeName: string;
  vehiclePlate: string;
  serviceDate: string;
};

export type TripIncident = {
  id: Guid;
  tripId: Guid;
  supervisorId: Guid;
  supervisorName: string;
  reason: TripIncidentReason;
  title: string;
  description?: string | null;
  status: TripIncidentStatus;
  createdAt: string;
  updatedAt?: string | null;
  serviceDate: string;
  tripStatus: string;
  routeName: string;
  vehiclePlate: string;
  adminNote?: string | null;
  handledBy?: Guid | null;
  handledAt?: string | null;
};

export type TripIncidentPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TripIncidentListResponse = {
  data: TripIncidentListItem[];
  pagination: TripIncidentPagination;
};

export type CreateTripIncidentPayload = {
  reason: TripIncidentReason;
  title?: string;
  description?: string;
};

