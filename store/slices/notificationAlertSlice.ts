import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationItem = {
  id: string;
  notificationId: string;
  tripId?: string;
  etaMinutes?: number;
  title: string;
  message: string;
  notificationType?: string;
  timestamp: number;
};

type NotificationAlertState = {
  queue: NotificationItem[];
  current: NotificationItem | null;
  isVisible: boolean;
  totalInQueue: number;
};

const initialState: NotificationAlertState = {
  queue: [],
  current: null,
  isVisible: false,
  totalInQueue: 0,
};

const notificationAlertSlice = createSlice({
  name: 'notificationAlert',
  initialState,
  reducers: {
    enqueueAlert: (state, action: PayloadAction<Omit<NotificationItem, 'id' | 'timestamp'>>) => {
      const newItem: NotificationItem = {
        ...action.payload,
        id: `${action.payload.notificationId}-${Date.now()}`,
        timestamp: Date.now(),
      };

      // Check if we should merge with existing notification in queue
      const existingIndex = state.queue.findIndex(
        item => item.tripId === newItem.tripId &&
          item.notificationType === newItem.notificationType &&
          item.tripId !== undefined
      );

      if (existingIndex !== -1) {
        // Merge: Update existing notification with new data
        console.log('🔄 Merging notification with existing queue item');
        state.queue[existingIndex] = {
          ...state.queue[existingIndex],
          ...newItem,
          // Keep the original id and timestamp for queue ordering
          id: state.queue[existingIndex].id,
          timestamp: state.queue[existingIndex].timestamp,
        };
      } else {
        // Add to queue
        state.queue.push(newItem);

        // Sort by priority: TripInfo first, then by timestamp
        state.queue.sort((a, b) => {
          const aPriority = a.notificationType === 'TripInfo' ? 0 : 1;
          const bPriority = b.notificationType === 'TripInfo' ? 0 : 1;

          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          return a.timestamp - b.timestamp;
        });
      }

      state.totalInQueue = state.queue.length + (state.current ? 1 : 0);

      // If nothing is currently showing, show the first item immediately
      if (!state.isVisible && !state.current) {
        state.current = state.queue.shift() || null;
        state.isVisible = state.current !== null;
        state.totalInQueue = state.queue.length + (state.current ? 1 : 0);
      }
    },

    showNextAlert: (state) => {
      if (state.queue.length > 0) {
        state.current = state.queue.shift() || null;
        state.isVisible = true;
        state.totalInQueue = state.queue.length + (state.current ? 1 : 0);
      } else {
        state.current = null;
        state.isVisible = false;
        state.totalInQueue = 0;
      }
    },

    hideCurrentAlert: (state) => {
      state.isVisible = false;
      // Don't clear current yet - let the animation complete
      // showNextAlert will be called after animation
    },

    clearAllAlerts: () => initialState,
  },
});

export const { enqueueAlert, showNextAlert, hideCurrentAlert, clearAllAlerts } = notificationAlertSlice.actions;
export default notificationAlertSlice.reducer;