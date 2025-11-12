import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getParentTripsByDate, getParentTripDetail } from '@/lib/trip/trip.api';
import { ParentTripDto } from '@/lib/trip-mock-data/parentTrip.types';

interface ParentTodayState {
  trips: ParentTripDto[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
  lastUpdated?: string;
}

const initialState: ParentTodayState = {
  trips: [],
  status: 'idle',
};

export const fetchParentTripsToday = createAsyncThunk(
  'parentToday/fetch',
  async ({ dateISO }: { dateISO?: string | null }) => {
    const trips = await getParentTripsByDate(dateISO);
    return trips;
  }
);

/**
 * Fetch trip detail by ID and cache it in Redux store
 */
export const fetchParentTripDetail = createAsyncThunk(
  'parentToday/fetchDetail',
  async (tripId: string) => {
    const trip = await getParentTripDetail(tripId);
    return trip;
  }
);

const parentTodaySlice = createSlice({
  name: 'parentToday',
  initialState,
  reducers: {
    clearTrips: (state) => {
      state.trips = [];
      state.status = 'idle';
      state.error = undefined;
      state.lastUpdated = undefined;
    },
    updateTrip: (state, action) => {
      const updatedTrip = action.payload as ParentTripDto;
      const index = state.trips.findIndex(
        t => t.id === updatedTrip.id && t.childId === updatedTrip.childId
      );
      if (index !== -1) {
        // Update existing trip
        state.trips[index] = updatedTrip;
      } else {
        // Add new trip if not found (e.g., fetched from detail screen)
        state.trips.push(updatedTrip);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParentTripsToday.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(fetchParentTripsToday.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.trips = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchParentTripsToday.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchParentTripDetail.fulfilled, (state, action) => {
        // Cache trip detail in store
        if (action.payload) {
          const index = state.trips.findIndex(
            t => t.id === action.payload!.id && t.childId === action.payload!.childId
          );
          if (index !== -1) {
            // Update existing trip with full detail
            state.trips[index] = action.payload;
          } else {
            // Add new trip if not found
            state.trips.push(action.payload);
          }
        }
      });
  },
});

export const { clearTrips, updateTrip } = parentTodaySlice.actions;
export default parentTodaySlice.reducer;

