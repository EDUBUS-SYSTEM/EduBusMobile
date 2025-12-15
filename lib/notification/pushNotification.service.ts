import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiService } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/constants/ApiConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices (not emulators)');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('📱 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permission denied. Push notifications will not work.');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('⚠️ Expo project ID not found. Please add it to app.json extra.eas.projectId');
        return null;
      }

      console.log('📱 Getting Expo Push Token...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId as string,
      });

      this.expoPushToken = tokenData.data;
      console.log('✅ Expo Push Token obtained:', this.expoPushToken.substring(0, 30) + '...');

      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
      await this.registerTokenWithBackend(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      // Validate token format before sending
      if (!token || !token.startsWith('ExponentPushToken[')) {
        console.error('❌ Invalid Expo Push Token format:', token?.substring(0, 50) + '...');
        throw new Error('Invalid Expo Push Token format');
      }

      const platform = Platform.OS;
      console.log(`📤 Registering device token with backend (Platform: ${platform})...`);

      await apiService.post(API_CONFIG.ENDPOINTS.DEVICE_TOKEN.REGISTER, {
        token: token,
        platform: platform,
      });

      console.log('✅ Device token successfully registered with backend');
    } catch (error: any) {
      console.error('❌ Error registering token with backend:', error);
      // Re-throw to let caller know it failed
      throw error;
    }
  }

  async unregisterToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('expoPushToken');
      if (token) {
        await apiService.post(API_CONFIG.ENDPOINTS.DEVICE_TOKEN.UNREGISTER, {
          token: token,
        });
        await AsyncStorage.removeItem('expoPushToken');
        console.log('Device token unregistered');
      }
    } catch (error) {
      console.error('Error unregistering token:', error);
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );
  }

  removeNotificationListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  async reinitializeToken(): Promise<void> {
    try {
      const storedToken = await AsyncStorage.getItem('expoPushToken');
      
      // Validate stored token - Expo Push Token should start with "ExponentPushToken["
      if (storedToken && storedToken.startsWith('ExponentPushToken[')) {
        console.log('📱 Found valid stored Expo Push Token, re-registering with backend...');
        this.expoPushToken = storedToken;
        await this.registerTokenWithBackend(storedToken);
        console.log('✅ Successfully re-registered stored push token');
        return;
      } else if (storedToken) {
        // Invalid token (might be JWT or corrupted), remove it
        console.warn('⚠️ Found invalid token in storage (not an Expo Push Token), removing it...');
        await AsyncStorage.removeItem('expoPushToken');
      }

      // No valid token found, try to get a new one
      console.log('📱 No valid token found, attempting to register for push notifications...');
      const newToken = await this.registerForPushNotifications();
      
      if (newToken) {
        console.log('✅ Successfully registered new push notification token');
      } else {
        console.warn('⚠️ Could not register push notification token (might be running on emulator or missing permissions)');
      }
    } catch (error) {
      console.error('❌ Error reinitializing push notification token:', error);
      throw error; // Re-throw to let caller know it failed
    }
  }
}

export const pushNotificationService = new PushNotificationService();

