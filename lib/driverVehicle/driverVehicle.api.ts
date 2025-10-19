import { API_CONFIG } from '@/constants/ApiConfig';
import { apiService } from '../api';
import type { VehicleResponse, VehicleStudentsResponse } from './driverVehicle.types';

/**
 * Driver Vehicle API Service
 * Handles all driver vehicle-related API calls
 */

/**
 * Get current driver's vehicle information
 */
export const getMyVehicle = async (): Promise<VehicleResponse> => {
  try {
    const data = await apiService.get<VehicleResponse>(API_CONFIG.ENDPOINTS.DRIVER_VEHICLE.CURRENT_DRIVER_VEHICLE);
    return data;
  } catch (error: any) {
    console.error('Error fetching vehicle:', error);
    
    // Handle 404 - No vehicle assigned
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'NO_VEHICLE_ASSIGNED',
        message: 'You have no vehicle assigned.',
      };
    }
    
    // Handle other errors
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Failed to load vehicle data. Please try again.',
    };
  }
};

/**
 * Get students on current driver's vehicle
 * Driver only - automatically uses driverId from token
 */
export const getMyVehicleStudents = async (): Promise<VehicleStudentsResponse> => {
  try {
    const data = await apiService.get<VehicleStudentsResponse>(
      API_CONFIG.ENDPOINTS.DRIVER_VEHICLE.CURRENT_VEHICLE_STUDENTS
    );
    return data;
  } catch (error: any) {
    console.error('Error fetching vehicle students:', error);
    
    // Handle 404 - No vehicle assigned
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'NO_VEHICLE_ASSIGNED',
        message: 'You have no vehicle assigned.',
      };
    }
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Please login again.',
      };
    }
    
    // Handle other errors
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Failed to load students. Please try again.',
    };
  }
};

