import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View, Animated } from 'react-native';
import { authApi } from '@/lib/auth/auth.api';

export default function LoginSuccessSplash() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

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

    // Navigate after 2 seconds
    const timer = setTimeout(async () => {
      try {
        const userInfo = await authApi.getUserInfo();
        
        if (userInfo.role === 'Driver') {
          router.replace('/(driver-tabs)/dashboard' as any);
        } else if (userInfo.role === 'Parent') {
          router.replace('/(parent-tabs)/home' as any);
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim]);

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

        {/* Loading Text */}
        <Animated.Text style={{
          marginTop: 30,
          fontSize: 18,
          fontFamily: 'RobotoSlab-Regular',
          color: '#666666',
          textAlign: 'center',
          opacity: fadeAnim,
        }}>
          Loading your dashboard...
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
