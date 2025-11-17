import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type NotificationAlertState = {
  isVisible: boolean;
  tripId?: string;
  etaMinutes?: number;
  title?: string;
  message?: string;
  
};

const initialState: NotificationAlertState = { isVisible: false };

const notificationAlertSlice = createSlice({
  name: 'notificationAlert',
  initialState,
  reducers: {
    showAlert: (state, action: PayloadAction<NotificationAlertState>) => ({
      ...state,
      ...action.payload,
      isVisible: true,
    }),
    hideAlert: () => initialState,
  },
});

export const { showAlert, hideAlert } = notificationAlertSlice.actions;
export default notificationAlertSlice.reducer;