import { configureStore } from '@reduxjs/toolkit';
import paymentReducer from './slices/paymentSlice';
import driverTodayReducer from './slices/driverTodaySlice';
import parentTodayReducer from './slices/parentTodaySlice';

export const store = configureStore({
  reducer: {
    payment: paymentReducer,
    driverToday: driverTodayReducer,
    parentToday: parentTodayReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;