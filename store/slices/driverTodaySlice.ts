import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getTripsByDate } from '@/lib/trip/trip.api';
import { DriverTripDto } from '@/lib/trip/driverTrip.types';

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
  async ({ dateISO }: { dateISO: string }) => {
    // driverId is not needed as API uses token to identify driver
    const trips = await getTripsByDate(dateISO);
    console.log('Trips: ', trips);
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


