import {
  mapParentNotification,
  type ParentNotificationDto,
} from '@/lib/notification/notification.api';
import { NotificationType } from '@/lib/notification/notification.type';
import { signalRService } from '@/lib/signalr/notificationHub.service';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { showAlert } from '@/store/slices/notificationAlertSlice';
import { addNotification } from '@/store/slices/notificationsSlice';
import { useEffect } from 'react';

/**
 * Custom hook to subscribe to arrival notifications from SignalR
 * Automatically dispatches showAlert action when notification is received
 * Uses Redux state to reactively subscribe when SignalR connection is established
 */
export const useNotificationAlert = () => {
  const isSignalRConnected = useAppSelector((state) => state.signalR.isConnected);
  
  useEffect(() => {
    if (!isSignalRConnected) {
      console.log('⏳ Waiting for SignalR connection...');
      return;
    }
    
    console.log('📡 Subscribing to arrival notifications');
    
    // Subscribe to notification events
    const handleNotification = (notification: ParentNotificationDto) => {
      console.log('🔔 [ReceiveNotification] Notification received:', JSON.stringify(notification, null, 2));

      const normalizedNotification = mapParentNotification(notification);
      store.dispatch(addNotification(normalizedNotification));
      
      const tripId = (() => {
        const metadataTripId = notification.metadata?.tripId;
        if (typeof metadataTripId === 'string' && metadataTripId.trim().length > 0) {
          return metadataTripId;
        }

        const relatedEntityId = notification.relatedEntityId;
        return typeof relatedEntityId === 'string' && relatedEntityId.trim().length > 0
          ? relatedEntityId
          : undefined;
      })();

      const etaMinutes = (() => {
        const etaMetadata = notification.metadata?.estimatedMinutes;
        return typeof etaMetadata === 'number' ? etaMetadata : undefined;
      })();
      
      // Check if this is an arrival alert notification
      if (notification.notificationType === NotificationType.TripInfo || 
          etaMinutes !== undefined) {
        console.log('📍 Arrival alert detected, dispatching showAlert');
        
        // Dispatch showAlert action
        store.dispatch(showAlert({
          isVisible: true,
          tripId,
          etaMinutes,
          message: notification.message,
          title: notification.title,
        }));
      }
      else {
        console.log('ℹ️ Other notification type received:', notification.notificationType);
      }
    };
    console.log('📡 Subscribing to arrival notifications (SignalR connected)');
    signalRService.onNotificationReceived(handleNotification);
    console.log('✅ Arrival notifications subscription completed');
    // Cleanup: unsubscribe when component unmounts or connection is lost
    return () => {
      console.log('📴 Unsubscribing from arrival notifications');
      signalRService.offNotificationReceived();
    };
  }, [isSignalRConnected]); 
};
