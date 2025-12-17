import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { NotificationAlert } from '@/components/alerts/NotificationAlert';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNotificationAlert } from '@/hooks/useNotificationAlert';
import { pushNotificationService } from '@/lib/notification/pushNotification.service';
import { signalRService } from '@/lib/signalr/notificationHub.service';
import { store } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import { setSignalRConnected, setSignalRConnecting, setSignalRError } from '@/store/slices/signalRSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';


function ArrivalNotificationsSubscriber() {
  useNotificationAlert();
  return null;
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="login-success-splash" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(parent-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(supervisor-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver-vehicle)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver-leave)" options={{ headerShown: false }} />
        <Stack.Screen name="account-profile" options={{ headerShown: false }} />
        <Stack.Screen name="register-history" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="help-parent" options={{ headerShown: false }} />
        <Stack.Screen name="help-driver" options={{ headerShown: false }} />
        <Stack.Screen name="help-supervisor" options={{ headerShown: false }} />
        <Stack.Screen name="trip-history-driver" options={{ headerShown: false }} />
        <Stack.Screen name="trip-history-supervisor" options={{ headerShown: false }} />
        <Stack.Screen name="trip-history-supervisor/[tripId]" options={{ headerShown: false }} />
        <Stack.Screen name="trip-report" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="service-registration" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="index" redirect />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// Component to initialize SignalR - must be inside Provider
function SignalRInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log('App Layout mounted, initializing SignalR...');

    const initSignalRWithRetry = async () => {
      let retries = 0;
      const maxRetries = 3;
      const retryDelay = 500;

      while (retries < maxRetries) {
        try {
          console.log(`SignalR init attempt ${retries + 1}/${maxRetries}`);

          const token = await AsyncStorage.getItem('accessToken');

          if (token && !signalRService.isConnected()) {
            console.log('Initializing SignalR connection from App Layout');
            dispatch(setSignalRConnecting());
            await signalRService.initialize(token);
            dispatch(setSignalRConnected());
            console.log('SignalR connection established');
            return;
          } else if (!token) {
            console.log('No token found, skipping SignalR init');
            return;
          } else if (signalRService.isConnected()) {
            console.log('SignalR already connected');
            dispatch(setSignalRConnected());
            return;
          }
        } catch (error: any) {
          retries++;

          dispatch(setSignalRError(error?.message || 'SignalR connection failed'));

          const isNetworkError = error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('ERR_CONNECTION_TIMED_OUT') ||
            error?.message?.includes('negotiation');

          if (!isNetworkError) {
            console.error(`SignalR init attempt ${retries} failed:`, error);
          } else if (retries === maxRetries) {
            console.warn('SignalR connection unavailable (server may be offline or network issue)');
          }

          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      console.warn('SignalR initialization skipped (optional feature)');
    };

    let cancelled = false;

    initSignalRWithRetry().catch(error => {
      if (!cancelled) {
        console.error('Fatal SignalR initialization error:', error);
        dispatch(setSignalRError(error?.message || 'Fatal SignalR error'));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
}

function PushNotificationInitializer() {
  const router = useRouter();

  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        console.log(' Initializing push notifications...');

        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log(' No access token found, skipping push notification init');
          return;
        }

        await pushNotificationService.registerForPushNotifications();

        pushNotificationService.setupNotificationListeners(
          (notification) => {
            console.log(' Notification received while app is open:', notification);
          },
          (response) => {
            console.log('User tapped notification:', response);
            const data = response.notification.request.content.data;

            if (data) {
              const notificationId = data.notificationId as string | undefined;
              const tripId = data.tripId as string | undefined;
              const relatedEntityType = data.relatedEntityType as string | undefined;
              const relatedEntityId = data.relatedEntityId as string | undefined;

              AsyncStorage.getItem('userRole').then((role) => {
                if (tripId) {
                  if (role === 'Parent') {
                    router.push(`/(parent-tabs)/trip/${tripId}` as any);
                  } else if (role === 'Driver') {
                    router.push(`/(driver-tabs)/trip/${tripId}` as any);
                  } else if (role === 'Supervisor') {
                    router.push(`/(supervisor-tabs)/trip/${tripId}` as any);
                  }
                } else if (notificationId) {
                  if (role === 'Parent') {
                    router.push('/(parent-tabs)/notifications' as any);
                  } else if (role === 'Driver') {
                    router.push('/(driver-tabs)/notifications' as any);
                  } else if (role === 'Supervisor') {
                    router.push('/(supervisor-tabs)/notifications' as any);
                  }
                } else {
                  if (role === 'Parent') {
                    router.push('/(parent-tabs)/notifications' as any);
                  } else if (role === 'Driver') {
                    router.push('/(driver-tabs)/notifications' as any);
                  } else if (role === 'Supervisor') {
                    router.push('/(supervisor-tabs)/notifications' as any);
                  }
                }
              });
            }
          }
        );

        console.log(' Push notifications initialized');
      } catch (error) {
        console.error(' Error initializing push notifications:', error);
      }
    };

    initializePushNotifications();

    return () => {
      pushNotificationService.removeNotificationListeners();
    };
  }, [router]);

  return null;
}

// Render ArrivalNotificationsSubscriber after RootLayoutContent
function RootLayoutWithNotifications() {
  return (
    <>
      <RootLayoutContent />
      {/* === IN-APP NOTIFICATIONS DISABLED === */}
      {/* <ArrivalNotificationsSubscriber /> */}
      {/* <SignalRInitializer /> */}
      {/* Push Notification (device notifications) - ENABLED */}
      <PushNotificationInitializer />
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'RobotoSlab-Regular': require('../assets/fonts/RobotoSlab-Regular.ttf'),
    'RobotoSlab-Light': require('../assets/fonts/RobotoSlab-Light.ttf'),
    'RobotoSlab-Medium': require('../assets/fonts/RobotoSlab-Medium.ttf'),
    'RobotoSlab-Bold': require('../assets/fonts/RobotoSlab-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutWithNotifications />
        <NotificationAlert />
      </GestureHandlerRootView>
    </Provider>
  );
}
