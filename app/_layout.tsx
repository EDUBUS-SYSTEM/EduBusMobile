import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { store } from '@/store';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { signalRService } from '@/lib/signalr/signalr.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'RobotoSlab-Regular': require('../assets/fonts/RobotoSlab-Regular.ttf'),
    'RobotoSlab-Light': require('../assets/fonts/RobotoSlab-Light.ttf'),
    'RobotoSlab-Medium': require('../assets/fonts/RobotoSlab-Medium.ttf'),
    'RobotoSlab-Bold': require('../assets/fonts/RobotoSlab-Bold.ttf'),
  });

  // Initialize SignalR connection when app loads
  useEffect(() => {
    console.log('📍 App Layout mounted, initializing SignalR...');
    
    const initSignalRWithRetry = async () => {
      let retries = 0;
      const maxRetries = 3; // Reduced retries
      const retryDelay = 500; // ms between retries
      
      while (retries < maxRetries) {
        try {
          console.log(`📍 SignalR init attempt ${retries + 1}/${maxRetries}`);
          
          // Try to read token from AsyncStorage
          const token = await AsyncStorage.getItem('accessToken');
          
          if (token && !signalRService.isConnected()) {
            console.log('🔌 Initializing SignalR connection from App Layout');
            await signalRService.initialize(token);
            console.log('✅ SignalR connection established');
            return; // Success → exit
          } else if (!token) {
            console.log('⚠️ No token found, skipping SignalR init');
            return; // No token → exit (user not logged in)
          } else if (signalRService.isConnected()) {
            console.log('✅ SignalR already connected');
            return; // Already connected → exit
          }
        } catch (error: any) {
          retries++;
          
          // Only log error if it's not a network/connection error
          const isNetworkError = error?.message?.includes('Failed to fetch') || 
                               error?.message?.includes('ERR_CONNECTION_TIMED_OUT') ||
                               error?.message?.includes('negotiation');
          
          if (!isNetworkError) {
            console.error(`❌ SignalR init attempt ${retries} failed:`, error);
          } else if (retries === maxRetries) {
            // Only log once at the end if all retries failed due to network
            console.warn('⚠️ SignalR connection unavailable (server may be offline or network issue)');
          }
          
          // If not the last retry, wait before trying again
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      // Silent failure - SignalR is optional, app can work without it
      console.warn('⚠️ SignalR initialization skipped (optional feature)');
    };

    // Start immediately (no arbitrary delay!)
    let cancelled = false;
    
    initSignalRWithRetry().catch(error => {
      if (!cancelled) {
        console.error('❌ Fatal SignalR initialization error:', error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <Provider store={store}>
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
    </Provider>
  );
}
