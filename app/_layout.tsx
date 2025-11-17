import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { store } from '@/store';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { signalRService } from '@/lib/signalr/notificationHub.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationAlert } from '@/components/alerts/NotificationAlert';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNotificationAlert } from '@/hooks/useNotificationAlert';
import { setSignalRConnecting, setSignalRConnected, setSignalRError } from '@/store/slices/signalRSlice';

// Component to subscribe to arrival notifications
// ✅ Fixed: call the hook unconditionally; it manages its own logic
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(parent-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver-vehicle)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver-leave)" options={{ headerShown: false }} />
        <Stack.Screen name="account-profile" options={{ headerShown: false }} />
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
    console.log('📍 App Layout mounted, initializing SignalR...');
    
    const initSignalRWithRetry = async () => {
      let retries = 0;
      const maxRetries = 3;
      const retryDelay = 500;
      
      while (retries < maxRetries) {
        try {
          console.log(`📍 SignalR init attempt ${retries + 1}/${maxRetries}`);
          
          const token = await AsyncStorage.getItem('accessToken');
          
          if (token && !signalRService.isConnected()) {
            console.log('🔌 Initializing SignalR connection from App Layout');
            dispatch(setSignalRConnecting());
            await signalRService.initialize(token);
            dispatch(setSignalRConnected());
            console.log('✅ SignalR connection established');
            return;
          } else if (!token) {
            console.log('⚠️ No token found, skipping SignalR init');
            return;
          } else if (signalRService.isConnected()) {
            console.log('✅ SignalR already connected');
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
            console.error(`❌ SignalR init attempt ${retries} failed:`, error);
          } else if (retries === maxRetries) {
            console.warn('⚠️ SignalR connection unavailable (server may be offline or network issue)');
          }
          
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      console.warn('⚠️ SignalR initialization skipped (optional feature)');
    };

    let cancelled = false;
    
    initSignalRWithRetry().catch(error => {
      if (!cancelled) {
        console.error('❌ Fatal SignalR initialization error:', error);
        dispatch(setSignalRError(error?.message || 'Fatal SignalR error'));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
}

// Render ArrivalNotificationsSubscriber after RootLayoutContent
function RootLayoutWithNotifications() {
  return (
    <>
      <RootLayoutContent />
      <ArrivalNotificationsSubscriber />
      <SignalRInitializer />
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
