import { configureStore } from '@reduxjs/toolkit';
import paymentReducer from './slices/paymentSlice';
import driverTodayReducer from './slices/driverTodaySlice';
import parentTodayReducer from './slices/parentTodaySlice';
import notificationAlertReducer from './slices/notificationAlertSlice';
import signalRReducer from './slices/signalRSlice';
import notificationsReducer from './slices/notificationsSlice';
export const store = configureStore({
  reducer: {
    payment: paymentReducer,
    driverToday: driverTodayReducer,
    parentToday: parentTodayReducer,
    notificationAlert: notificationAlertReducer,
    signalR: signalRReducer,
    notifications: notificationsReducer,
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