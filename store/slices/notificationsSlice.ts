import { notificationApi, type NotificationResponse } from '@/lib/notification/notification.api';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const PAGE_SIZE = 20;

type FetchNotificationsArgs = {
  page?: number;
  append?: boolean;
  isRefresh?: boolean;
};

type NotificationsState = {
  items: NotificationResponse[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  unreadCount: number;
};

const initialState: NotificationsState = {
  items: [],
  loading: false,
  loadingMore: false,
  refreshing: false,
  error: null,
  page: 0,
  hasMore: true,
  unreadCount: 0,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, append }: FetchNotificationsArgs = {}, { rejectWithValue }) => {
    try {
      const data = await notificationApi.getMyNotifications({
        page,
        pageSize: PAGE_SIZE,
      });

      return {
        data,
        page,
        append: append ?? page > 1,
        hasMore: data.length === PAGE_SIZE,
      };
    } catch (error: any) {
      const message = error?.message ?? 'Failed to load notifications';
      return rejectWithValue(message);
    }
  },
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationApi.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      const message = error?.message ?? 'Failed to mark notification as read';
      return rejectWithValue(message);
    }
  },
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.markAllAsRead();
      return true;
    } catch (error: any) {
      const message = error?.message ?? 'Failed to mark all notifications as read';
      return rejectWithValue(message);
    }
  },
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const { count } = await notificationApi.getUnreadCount();
      console.log('count', count);
      return count;
    } catch (error: any) {
      const message = error?.message ?? 'Failed to fetch unread count';
      return rejectWithValue(message);
    }
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationsError: (state) => {
      state.error = null;
    },
    resetNotificationsState: () => initialState,
    addNotification: (state, action: PayloadAction<NotificationResponse>) => {
      const exists = state.items.some((notification) => notification.id === action.payload.id);
      state.items = exists
        ? state.items.map((notification) =>
            notification.id === action.payload.id ? action.payload : notification,
          )
        : [action.payload, ...state.items];
      state.unreadCount = state.items.filter((notification) => !notification.isRead).length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        const { append, isRefresh, page } = action.meta.arg ?? {};
        state.error = null;

        if (append ?? (page ?? 1) > 1) {
          state.loadingMore = true;
        } else if (isRefresh) {
          state.refreshing = true;
        } else {
          state.loading = true;
        }
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { data, page, append, hasMore } = action.payload;
        state.items = append ? [...state.items, ...data] : data;
        state.page = page;
        state.hasMore = hasMore;
        state.unreadCount = state.items.filter((notification) => !notification.isRead).length;
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? state.error ?? null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.map((notification) =>
          notification.id === action.payload ? { ...notification, isRead: true } : notification,
        );
        state.unreadCount = state.items.filter((notification) => !notification.isRead).length;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items = state.items.map((notification) => ({ ...notification, isRead: true }));
        state.unreadCount = 0;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? null;
      });
  },
});

export const { clearNotificationsError, resetNotificationsState, addNotification } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;

