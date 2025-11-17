import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SignalRState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

const initialState: SignalRState = {
  isConnected: false,
  isConnecting: false,
};

const signalRSlice = createSlice({
  name: 'signalR',
  initialState,
  reducers: {
    setSignalRConnecting: (state) => {
      state.isConnecting = true;
      state.error = undefined;
    },
    setSignalRConnected: (state) => {
      state.isConnected = true;
      state.isConnecting = false;
      state.error = undefined;
    },
    setSignalRDisconnected: (state) => {
      state.isConnected = false;
      state.isConnecting = false;
    },
    setSignalRError: (state, action: PayloadAction<string>) => {
      state.isConnecting = false;
      state.error = action.payload;
    },
  },
});

export const {
  setSignalRConnecting,
  setSignalRConnected,
  setSignalRDisconnected,
  setSignalRError,
} = signalRSlice.actions;

export default signalRSlice.reducer;