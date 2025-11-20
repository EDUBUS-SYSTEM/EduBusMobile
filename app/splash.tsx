import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { authApi } from '@/lib/auth/auth.api';

export default function SplashScreen() {
  useEffect(() => {
    // Check authentication status and route accordingly
    const checkAuthAndRoute = async () => {
      try {
        const isLoggedIn = await authApi.isLoggedIn();
        
        if (isLoggedIn) {
          // User is logged in, get their role and route accordingly
          const userInfo = await authApi.getUserInfo();
          
          if (userInfo.role === 'Driver') {
            router.replace('/(driver-tabs)/dashboard' as any);
          } else if (userInfo.role === 'Parent') {
            router.replace('/(parent-tabs)/home' as any);
          } else if (userInfo.role === 'Supervisor') {
            router.replace('/(supervisor-tabs)/dashboard' as any);
          } else if (userInfo.role === 'Admin') {
            // Admin accounts are not allowed, logout and go to login
            console.log('Admin account detected - logging out');
            await authApi.logout();
            router.replace('/login' as any);
          } else {
            // Unknown role, logout and go to login
            console.log('Unknown role detected - logging out');
            await authApi.logout();
            router.replace('/login' as any);
          }
        } else {
          // User is not logged in, go to login screen
          router.replace('/login' as any);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Fallback to login screen
        router.replace('/login' as any);
      }
    };

    // Add a small delay for better UX
    const timer = setTimeout(checkAuthAndRoute, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Top Yellow Circles (like login) */}
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

        {/* Welcome Text */}
        <View style={{ alignItems: 'center', marginTop: 50 }}>
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
            Welcome !
          </Text>
        </View>
      </View>

      {/* Main Logo Section */}
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
      }}>
        {/* Main Logo */}
        <View style={{
          alignItems: 'center',
          justifyContent: 'center',
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
        </View>
      </View>

      {/* Bottom Yellow Circles (mirrored) */}
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
          {/* Circle 1 - Bottom Left (mirrored from top right) */}
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
          
          {/* Circle 2 - Bottom Right (mirrored from top left) */}
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
          
          {/* Circle 3 - Bottom Center (mirrored from top center) */}
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
          
          {/* Circle 4 - Bottom Right (mirrored from top left) */}
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
          
          {/* Circle 5 - Bottom Left (mirrored from top right) */}
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
          
          {/* Circle 6 - Bottom Center (mirrored from top center) */}
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
