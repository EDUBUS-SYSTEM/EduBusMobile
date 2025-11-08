import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { driverTripMockApi } from '@/lib/trip-mock-data/driverTrip.mockApi';
import { DriverTripDto } from '@/lib/trip-mock-data/driverTrip.types';

interface DriverTodayState {
  trips: DriverTripDto[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: DriverTodayState = {
  trips: [],
  status: 'idle',
};

export const fetchDriverTripsToday = createAsyncThunk(
  'driverToday/fetch',
  async ({ driverId, dateISO }: { driverId: string; dateISO: string }) => {
    const trips = await driverTripMockApi.getToday(driverId, dateISO);
    return trips;
  }
);

const driverTodaySlice = createSlice({
  name: 'driverToday',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDriverTripsToday.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(fetchDriverTripsToday.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.trips = action.payload;
      })
      .addCase(fetchDriverTripsToday.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default driverTodaySlice.reducer;


