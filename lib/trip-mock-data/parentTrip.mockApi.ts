import type { ParentTripDto } from '../trip/parentTrip.types';
import { mockParentTrips } from './parentTrip.mock';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const isToday = (serviceDate: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  const tripDate = new Date(serviceDate).toISOString().split('T')[0];
  return tripDate === today;
};

export const parentTripMockApi = {
  /**
   * Get all today's trips for parent's children
   */
  async getTodayTrips(parentId: string): Promise<ParentTripDto[]> {
    void parentId; // Mock doesn't need actual parentId
    await delay(300);
    return mockParentTrips.filter((trip) => isToday(trip.serviceDate));
  },

  /**
   * Get trip by ID
   */
  async getById(tripId: string): Promise<ParentTripDto | null> {
    await delay(200);
    return mockParentTrips.find((t) => t.id === tripId) || null;
  },

  /**
   * Get trips for a specific child
   */
  async getTripsByChildId(childId: string): Promise<ParentTripDto[]> {
    await delay(200);
    return mockParentTrips.filter((trip) => trip.childId === childId);
  },
};

