import { authApi } from '@/lib/auth/auth.api';
import { pushNotificationService } from '@/lib/notification/pushNotification.service';
import { paymentApi } from '@/lib/payment/payment.api';
import { signalRService } from '@/lib/signalr/notificationHub.service';
import { useAppDispatch } from '@/store/hooks';
import { fetchUnreadCount } from '@/store/slices/notificationsSlice';
import { setSignalRConnected, setSignalRConnecting, setSignalRError } from '@/store/slices/signalRSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';

export default function LoginSuccessSplash() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [statusText, setStatusText] = useState('Loading your dashboard...');

  useEffect(() => {

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

    const initializeAndNavigate = async () => {
      try {

        const userInfo = await authApi.getUserInfo();

        const token = await AsyncStorage.getItem('accessToken');

        if (token && (userInfo.role === 'Parent' || userInfo.role === 'Driver' || userInfo.role === 'Supervisor')) {

          try {

            if (signalRService.isConnected()) {
              await signalRService.stop();
            }

            dispatch(setSignalRConnecting());
            await signalRService.initialize(token);
            dispatch(setSignalRConnected());
          } catch (signalRError: any) {
            dispatch(setSignalRError(signalRError?.message || 'SignalR initialization failed'));
          }

          try {
            await pushNotificationService.reinitializeToken();
          } catch (pushError) {
          }

          try {
            await dispatch(fetchUnreadCount()).unwrap();
          } catch (unreadError) {
          }

          setStatusText('Almost ready...');
        }

        await new Promise(resolve => setTimeout(resolve, 200));
        if (userInfo.role === 'Driver') {
          router.replace('/(driver-tabs)/dashboard' as any);
        } else if (userInfo.role === 'Parent') {
          setStatusText('Checking payment status...');
          try {
            const paymentStatus = await paymentApi.checkUnpaidFees();
            await AsyncStorage.setItem('paymentStatus', JSON.stringify(paymentStatus));

            if (paymentStatus.hasUnpaidFees && paymentStatus.count > 0) {
              router.replace('/(parent-tabs)/payment-notification' as any);
            } else {
              router.replace('/(parent-tabs)/home' as any);
            }
          } catch (paymentError) {
            router.replace('/(parent-tabs)/home' as any);
          }
        } else if (userInfo.role === 'Supervisor') {
          router.replace('/(supervisor-tabs)/dashboard' as any);
        } else {
          await authApi.logout();
          router.replace('/login' as any);
        }
      } catch (error) {
        router.replace('/login' as any);
      }
    };

    let navigationReady = false;
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      navigationReady = true;
    });

    const timer = setTimeout(() => {
      if (navigationReady) {
        initializeAndNavigate();
      } else {
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

      <View style={{
        paddingTop: 80,
        paddingBottom: 60,
        paddingHorizontal: 24,
        position: 'relative',
        minHeight: 250
      }}>

        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>

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


      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
      }}>

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

            <View style={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: '#E0F7FA',
              opacity: 0.3,
            }} />


            <Image
              source={require('@/assets/images/edubus_logo.png')}
              style={{ width: 260, height: 260 }}
              contentFit="contain"
            />
          </View>
        </Animated.View>


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


      <View style={{
        paddingTop: 60,
        paddingBottom: 80,
        paddingHorizontal: 24,
        position: 'relative',
        minHeight: 250
      }}>

        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>

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
