import { apiService } from '../api';
import {
  DriverVehicleStatus,
  VehicleResponse,
  VehicleStatus,
  VehicleStudentsResponse,
  type VehicleData,
} from '../driverVehicle/driverVehicle.types';

/**
 * Supervisor Vehicle API Service
 * Uses SupervisorVehicleController endpoints on backend
 */

interface SupervisorVehicleAssignmentDto {
  id: string;
  supervisorId: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleCapacity: number;
  startTimeUtc: string;
  endTimeUtc?: string | null;
  status: number;
  isActive: boolean;
  assignmentReason?: string | null;
  assignedByAdminName?: string | null;
}

interface SupervisorVehicleAssignmentResponse {
  success: boolean;
  data?: SupervisorVehicleAssignmentDto | null;
  error?: string;
  message?: string;
}

/**
 * Get current supervisor's vehicle information
 */
export const getMySupervisorVehicle = async (): Promise<VehicleResponse> => {
  try {
    const raw = await apiService.get<SupervisorVehicleAssignmentResponse>('/supervisorVehicle/current-vehicle');

    if (raw.success && raw.data) {
      const assignment = raw.data;
      const vehicle: VehicleData = {
        vehicleId: assignment.vehicleId,
        licensePlate: assignment.vehiclePlate,
        capacity: assignment.vehicleCapacity,
        status: assignment.isActive ? VehicleStatus.Active : VehicleStatus.Inactive,
        statusNote: assignment.assignmentReason ?? undefined,
        isPrimaryDriver: false,
        assignmentStartTime: assignment.startTimeUtc,
        assignmentEndTime: assignment.endTimeUtc ?? undefined,
        assignmentStatus: (assignment.status as DriverVehicleStatus) || DriverVehicleStatus.Active,
      };

      return {
        success: true,
        data: vehicle,
      };
    }

    return {
      success: false,
      error: raw.error || 'NO_VEHICLE_ASSIGNED',
      message: raw.message || 'You have no vehicle assigned.',
    };
  } catch (error: any) {
    console.error('Error fetching supervisor vehicle:', error);

    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'NO_VEHICLE_ASSIGNED',
        message: 'You have no vehicle assigned.',
      };
    }

    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Failed to load vehicle data. Please try again.',
    };
  }
};

/**
 * Get students on current supervisor's vehicle
 */
export const getMySupervisorVehicleStudents = async (): Promise<VehicleStudentsResponse> => {
  try {
    const data = await apiService.get<VehicleStudentsResponse>('/supervisorVehicle/current-vehicle/students');
    return data;
  } catch (error: any) {
    console.error('Error fetching supervisor vehicle students:', error);

    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'NO_VEHICLE_ASSIGNED',
        message: 'You have no vehicle assigned.',
      };
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Please login again.',
      };
    }

    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Failed to load students. Please try again.',
    };
  }
};


