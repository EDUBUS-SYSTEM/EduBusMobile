import { apiService } from '../api';
import { NotificationType } from './notification.type';

export interface ParentNotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: number;
  recipientType: number;
  status: number;
  timeStamp: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  expiresAt: string | null;
  priority: number;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  actionRequired: boolean;
  actionUrl: string | null;
  metadata?: Record<string, unknown>;
  isExpired: boolean;
  isRead: boolean;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
  tripId?: string;
  studentId?: string;
  raw?: ParentNotificationDto;
}

export interface NotificationQueryParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  type?: NotificationType;
}

export const mapParentNotification = (dto: ParentNotificationDto): NotificationResponse => {
  const metadata = dto.metadata ?? {};

  const tripIdFromMetadata = (metadata?.tripId as string | undefined) ?? undefined;
  const tripIdFromRelatedEntity =
    dto.relatedEntityType === 'Trip' ? (dto.relatedEntityId as string | undefined) : undefined;

  return {
    id: dto.id,
    type: (dto.notificationType as NotificationType) ?? NotificationType.SystemAlert,
    title: dto.title,
    message: dto.message,
    isRead: dto.isRead,
    createdAt: dto.timeStamp,
    readAt: dto.readAt ?? undefined,
    metadata,
    tripId: tripIdFromMetadata ?? tripIdFromRelatedEntity,
    studentId: metadata?.studentId as string | undefined,
    raw: dto,
  };
};

export const notificationApi = {
  /**
   * Get all notifications for current parent
   */
  getMyNotifications: async (params?: NotificationQueryParams): Promise<NotificationResponse[]> => {
    const data = await apiService.get<ParentNotificationDto[]>('/Notification', params);
    return data.map(mapParentNotification);
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    return apiService.put<void>(`/Notification/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    return apiService.put<void>('/Notification/mark-all-read');
  },

  /**
   * Delete a notification
   */
  delete: async (notificationId: string): Promise<void> => {
    return apiService.delete<void>(`/Notification/${notificationId}`);
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiService.get<{ count: number }>('/Notification/unread-count');
  },
};

