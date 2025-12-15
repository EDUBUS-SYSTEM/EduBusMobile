import { authApi } from '@/lib/auth/auth.api';
import { paymentApi } from '@/lib/payment/payment.api';
import { signalRService } from '@/lib/signalr/notificationHub.service';
import { pushNotificationService } from '@/lib/notification/pushNotification.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useAppDispatch } from '@/store/hooks';
import { fetchUnreadCount } from '@/store/slices/notificationsSlice';
import { setSignalRConnecting, setSignalRConnected, setSignalRError } from '@/store/slices/signalRSlice';

export default function LoginSuccessSplash() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [statusText, setStatusText] = useState('Loading your dashboard...');

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Initialize and navigate
    const initializeAndNavigate = async () => {
      try {
        console.log('🎯 Starting initializeAndNavigate...');

        const userInfo = await authApi.getUserInfo();
        console.log('👤 User info:', userInfo);

        const token = await AsyncStorage.getItem('accessToken');
        console.log('🔑 Token exists:', !!token);

        if (token && (userInfo.role === 'Parent' || userInfo.role === 'Driver' || userInfo.role === 'Supervisor')) {
          console.log('✅ Conditions met for SignalR. Role:', userInfo.role);

          // IMPORTANT: Always reinitialize SignalR after login to ensure fresh connection
          // This fixes the issue where switching accounts doesn't update the SignalR connection
          try {
            console.log('🔄 [LOGIN-SPLASH] Reinitializing SignalR with fresh token...');

            // Stop existing connection if any
            if (signalRService.isConnected()) {
              console.log('🛑 [LOGIN-SPLASH] Stopping existing SignalR connection...');
              await signalRService.stop();
            }

            // Initialize SignalR with the new token
            console.log('🔌 [LOGIN-SPLASH] Starting new SignalR connection...');
            dispatch(setSignalRConnecting());
            await signalRService.initialize(token);
            dispatch(setSignalRConnected());
            console.log('✅ [LOGIN-SPLASH] SignalR reinitialized successfully');
          } catch (signalRError: any) {
            // Don't fail the login flow if SignalR fails
            console.error('❌ [LOGIN-SPLASH] Failed to reinitialize SignalR:', signalRError);
            dispatch(setSignalRError(signalRError?.message || 'SignalR initialization failed'));
          }

          // Register push notification token after login
          try {
            console.log('📱 [LOGIN-SPLASH] Registering push notification token after login...');
            await pushNotificationService.reinitializeToken();
            // Note: reinitializeToken() will log its own success/error messages
          } catch (pushError) {
            console.error('❌ [LOGIN-SPLASH] Error registering push token:', pushError);
            // Don't fail login if push notification fails
            // This is expected on emulators or if permissions are denied
          }

          try {
            await dispatch(fetchUnreadCount()).unwrap();
            console.log('🔢 Unread notifications preloaded');
          } catch (unreadError) {
            console.warn('⚠️ Failed to preload unread notifications:', unreadError);
          }

          setStatusText('Almost ready...');
        } else {
          console.log('⏭️ Skipping SignalR check. Token:', !!token, 'Role:', userInfo?.role);
        }

        // Small delay to show "Almost ready" text
        await new Promise(resolve => setTimeout(resolve, 200));

        // Route based on role
        if (userInfo.role === 'Driver') {
          router.replace('/(driver-tabs)/dashboard' as any);
        } else if (userInfo.role === 'Parent') {
          setStatusText('Checking payment status...');
          try {
            const paymentStatus = await paymentApi.checkUnpaidFees();
            // Store in AsyncStorage for usePaymentStatus hook to read later
            await AsyncStorage.setItem('paymentStatus', JSON.stringify(paymentStatus));

            // Decide navigation based on payment status
            if (paymentStatus.hasUnpaidFees && paymentStatus.count > 0) {
              console.log('⚠️ Parent has unpaid fees, navigating to notification');
              router.replace('/(parent-tabs)/payment-notification' as any);
            } else {
              console.log('✅ Parent has no unpaid fees, navigating to home');
              router.replace('/(parent-tabs)/home' as any);
            }
          } catch (paymentError) {
            console.error('Error checking payment status:', paymentError);
            // On error, go to home
            router.replace('/(parent-tabs)/home' as any);
          }
        } else if (userInfo.role === 'Supervisor') {
          router.replace('/(supervisor-tabs)/dashboard' as any);
        } else {
          // If somehow we get here with Admin role, logout and go to login
          console.error('❌ Admin role detected in splash screen - this should not happen');
          await authApi.logout();
          router.replace('/login' as any);
        }
      } catch (error) {
        console.error('❌ Error getting user info:', error);
        // Fallback to login screen
        router.replace('/login' as any);
      }
    };

    //  Wait for navigation to be ready before initializing
    // This is more reliable than using a fixed delay
    let navigationReady = false;
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      navigationReady = true;
    });

    // Start initialization after 1000ms (let animation play + ensure navigation ready)
    // beforeRemove event typically triggers within 100-200ms
    const timer = setTimeout(() => {
      if (navigationReady) {
        console.log('✅ Navigation ready, starting initialization...');
        initializeAndNavigate();
      } else {
        // Fallback: wait a bit more if navigation not ready
        console.warn('⚠️ Navigation not ready yet, waiting...');
        setTimeout(initializeAndNavigate, 500);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Top Yellow Circles */}
      <View style={{
        paddingTop: 80,
        paddingBottom: 60,
        paddingHorizontal: 24,
        position: 'relative',
        minHeight: 250
      }}>
        {/* Yellow Circles Background */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
          {/* Circle 1 - Top Left */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: -100,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FDE370',
            opacity: 1
          }} />

          {/* Circle 2 - Top Right */}
          <View style={{
            position: 'absolute',
            top: 10,
            left: 40,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FDE370',
            opacity: 1
          }} />

          {/* Circle 3 - Top Center */}
          <View style={{
            position: 'absolute',
            top: 10,
            left: 180,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FDE370',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            top: 0,
            left: 320,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FDE370',
            opacity: 1
          }} />

          {/* Circle 4 - Top Right */}
          <View style={{
            position: 'absolute',
            top: -80,
            right: 180,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FCCF08',
            opacity: 1
          }} />

          {/* Circle 5 - Top Right */}
          <View style={{
            position: 'absolute',
            top: -80,
            right: 40,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FCCF08',
            opacity: 1
          }} />

          {/* Circle 6 - Top Right */}
          <View style={{
            position: 'absolute',
            top: -90,
            right: 320,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FCCF08',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            top: -90,
            right: -100,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FCCF08',
            opacity: 1
          }} />
        </View>

        {/* Success Text */}
        <Animated.View style={{
          alignItems: 'center',
          marginTop: 50,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 42,
            color: '#000000',
            textAlign: 'center',
            fontWeight: '900',
            textShadowColor: '#01CBCA',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 4,
            letterSpacing: 2,
          }}>
            Welcome Back!
          </Text>
        </Animated.View>
      </View>

      {/* Main Logo Section */}
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
      }}>
        {/* Main Logo with Animation */}
        <Animated.View style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}>
          <View style={{
            width: 280,
            height: 280,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Glow Effect */}
            <View style={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: '#E0F7FA',
              opacity: 0.3,
            }} />

            {/* Logo Image */}
            <Image
              source={require('@/assets/images/edubus_logo.png')}
              style={{ width: 260, height: 260 }}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* Loading Text - Now Dynamic */}
        <Animated.Text style={{
          marginTop: 30,
          fontSize: 18,
          fontFamily: 'RobotoSlab-Regular',
          color: '#666666',
          textAlign: 'center',
          opacity: fadeAnim,
        }}>
          {statusText}
        </Animated.Text>
      </View>

      {/* Bottom Yellow Circles */}
      <View style={{
        paddingTop: 60,
        paddingBottom: 80,
        paddingHorizontal: 24,
        position: 'relative',
        minHeight: 250
      }}>
        {/* Yellow Circles Background */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
          {/* Bottom Circles (mirrored from top) */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: -100,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FDE370',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            bottom: 10,
            right: 40,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FDE370',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            bottom: 10,
            right: 180,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FDE370',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            bottom: 0,
            right: 320,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FDE370',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            bottom: -80,
            left: 180,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FCCF08',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            bottom: -80,
            left: 40,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FCCF08',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            bottom: -90,
            left: 320,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FCCF08',
            opacity: 1
          }} />

          <View style={{
            position: 'absolute',
            bottom: -90,
            left: -100,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FCCF08',
            opacity: 1
          }} />
        </View>
      </View>
    </View>
  );
}
