import { DriverTripDto } from '../trip/driverTrip.types';
import { mockDriverTrips } from './driverTrip.mock';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const isWithinRange = (serviceDate: string, startDate: string, endDate: string) => {
  const sDate = new Date(serviceDate).getTime();
  const from = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const to = new Date(`${endDate}T23:59:59.999Z`).getTime();
  return sDate >= from && sDate <= to;
};

export const driverTripMockApi = {
  async getByRange(driverId: string, startDate: string, endDate: string): Promise<DriverTripDto[]> {
    void driverId;
    await delay(200);
    return mockDriverTrips.filter((t) => isWithinRange(t.serviceDate, startDate, endDate));
  },
  async getToday(driverId: string, todayISODate: string): Promise<DriverTripDto[]> {
    return this.getByRange(driverId, todayISODate, todayISODate);
  },
  async getById(tripId: string): Promise<DriverTripDto | null> {
    await delay(200);
    return mockDriverTrips.find((t) => t.id === tripId) || null;
  },
};


