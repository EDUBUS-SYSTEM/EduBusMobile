/**
 * Driver Vehicle Type Definitions
 * Contains all TypeScript interfaces and types for driver vehicle features
 */

/**
 * Vehicle Status Enum (from backend)
 * Matches backend enum: Active = 1, Inactive = 2, Maintenance = 3
 */
export enum VehicleStatus {
  Active = 1,
  Inactive = 2,
  Maintenance = 3
}

/**
 * Vehicle Status Labels for display
 */
export const VehicleStatusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.Active]: 'Active',
  [VehicleStatus.Inactive]: 'Inactive',
  [VehicleStatus.Maintenance]: 'Maintenance'
};

/**
 * Driver Vehicle Assignment Status Enum (from backend)
 * Matches backend enum: Pending = 1, Active = 2, Completed = 3, Cancelled = 4, Suspended = 5
 */
export enum DriverVehicleStatus {
  Pending = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4,
  Suspended = 5
}

/**
 * Driver Vehicle Assignment Status Labels for display
 */
export const DriverVehicleStatusLabels: Record<DriverVehicleStatus, string> = {
  [DriverVehicleStatus.Pending]: 'Pending',
  [DriverVehicleStatus.Active]: 'Active',
  [DriverVehicleStatus.Completed]: 'Completed',
  [DriverVehicleStatus.Cancelled]: 'Cancelled',
  [DriverVehicleStatus.Suspended]: 'Suspended'
};

/**
 * Vehicle data returned from API
 */
export interface VehicleData {
  vehicleId: string;
  licensePlate: string;
  capacity: number;
  status: VehicleStatus;
  statusNote?: string;
  isPrimaryDriver: boolean;
  assignmentStartTime: string;
  assignmentEndTime?: string;
  assignmentStatus: DriverVehicleStatus;
}

/**
 * Standard API response wrapper for vehicle data
 */
export interface VehicleResponse {
  success: boolean;
  data?: VehicleData;
  error?: string;
  message?: string;
}

/**
 * Vehicle student information on driver's vehicle
 */
export interface VehicleStudentInfo {
  studentId: string;
  firstName: string;
  lastName: string;
  pickupPointId: string;
  pickupPointAddress: string;
  pickupSequenceOrder: number;
  gradeLevel?: string;
  parentName?: string;
  parentPhone?: string;
}

/**
 * Vehicle students data
 */
export interface VehicleStudentsData {
  vehicleId: string;
  routeId?: string;
  routeName?: string;
  totalStudents: number;
  students: VehicleStudentInfo[];
}

/**
 * Response for vehicle students API
 */
export interface VehicleStudentsResponse {
  success: boolean;
  data?: VehicleStudentsData;
  error?: string;
  message?: string;
}

