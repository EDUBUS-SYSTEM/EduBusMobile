import { authApi } from '@/lib/auth/auth.api';
import { paymentApi } from '@/lib/payment/payment.api';
import { signalRService } from '@/lib/signalr/signalr.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';

export default function LoginSuccessSplash() {
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
        
        const token = await AsyncStorage.getItem('accessToken'); // Fix: use 'accessToken' not 'token'
        console.log('🔑 Token exists:', !!token);

        // Initialize SignalR for Parent and Driver roles if not already connected
        if (token && (userInfo.role === 'Parent' || userInfo.role === 'Driver')) {
          console.log('✅ Conditions met for SignalR init. Role:', userInfo.role);
          
          try {
            const isAlreadyConnected = signalRService.isConnected();
            console.log('🔌 SignalR already connected?', isAlreadyConnected);
            
            if (!isAlreadyConnected) {
              setStatusText('Connecting to real-time updates...');
              console.log('🔌 [LOGIN-SPLASH] Initializing SignalR for', userInfo.role);
              
              await signalRService.initialize(token);
              console.log('✅ [LOGIN-SPLASH] SignalR initialized successfully');
            } else {
              console.log('✅ [LOGIN-SPLASH] SignalR already connected, skipping');
            }
            setStatusText('Almost ready...');
          } catch (signalRError) {
            console.error('⚠️ [LOGIN-SPLASH] SignalR initialization failed:', signalRError);
            // Continue anyway - SignalR is not critical for app function
            setStatusText('Loading your dashboard...');
          }
        } else {
          console.log('⏭️ Skipping SignalR init. Token:', !!token, 'Role:', userInfo?.role);
        }

        // Small delay to show "Almost ready" text
        await new Promise(resolve => setTimeout(resolve, 500));

        // Route based on role
        if (userInfo.role === 'Driver') {
          router.replace('/(driver-tabs)/dashboard' as any);
        } else if (userInfo.role === 'Parent') {
          setStatusText('Đang kiểm tra thanh toán...');
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
          
        } else {
          // If somehow we get here with Admin role, logout and go to login
          console.error('Admin role detected in splash screen - this should not happen');
          await authApi.logout();
          router.replace('/login' as any);
        }
      } catch (error) {
        console.error('Error getting user info:', error);
        // Fallback to login screen
        router.replace('/login' as any);
      }
    };

    // Start initialization after 1 second (let animation play)
    const timer = setTimeout(initializeAndNavigate, 1000);

    return () => clearTimeout(timer);
  }, []);

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
