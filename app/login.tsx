import { authApi } from '@/lib/auth/auth.api';
import { isRoleAllowed, getRoleErrorMessage } from '@/lib/auth/auth.utils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import { StatusBar, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, ScrollView, Platform, useWindowDimensions } from 'react-native';

export default function LoginScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputLayout = useRef({ y: 0, height: 0 });
  const passwordInputLayout = useRef({ y: 0, height: 0 });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      console.log('Login response:', res);
      
      if (res.success && res.data) {
        // Check if user role is allowed
        if (!isRoleAllowed(res.data.role)) {
          Alert.alert(
            'Access Denied', 
            getRoleErrorMessage(res.data.role),
            [
              {
                text: 'OK',
                onPress: () => {
                  // Clear any stored data and stay on login screen
                  authApi.logout();
                }
              }
            ]
          );
          return;
        }
        
        console.log('Login success for role:', res.data.role);
        // Navigate to splash screen which will handle routing based on role
        router.push('/login-success-splash' as any);
      } else {
        // Handle API error response
        const errorMessage = res.error?.message || 'Login failed. Please try again.';
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (e: any) {
      console.log('Login error:', e);
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle different types of errors
      if (e.response?.data?.error?.message) {
        errorMessage = e.response.data.error.message;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailFocus = () => {
    setTimeout(() => {
      if (scrollViewRef.current && emailInputLayout.current.y > 0) {
        // Scroll để input field không bị che bởi keyboard
        // Điều chỉnh offset dựa trên kích thước màn hình
        const offset = screenHeight < 800 ? 120 : 150;
        scrollViewRef.current.scrollTo({
          y: Math.max(0, emailInputLayout.current.y - offset),
          animated: true,
        });
      }
    }, 300);
  };

  const handlePasswordFocus = () => {
    setTimeout(() => {
      if (scrollViewRef.current && passwordInputLayout.current.y > 0) {
        // Scroll để input field không bị che bởi keyboard
        // Điều chỉnh offset dựa trên kích thước màn hình
        const offset = screenHeight < 800 ? 80 : 120;
        scrollViewRef.current.scrollTo({
          y: Math.max(0, passwordInputLayout.current.y - offset),
          animated: true,
        });
      }
    }, 300);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: screenHeight < 800 ? 100 : 50
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', position: 'relative' }}>
          {/* Header Section with 4 Yellow Circles */}
          <View style={{ 
            paddingTop: 80, 
            paddingBottom: 60, 
            paddingHorizontal: 24,
            position: 'relative',
            minHeight: 250
          }}>
       {/* 4 Yellow Circles Background */}
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
         
         {/* Circle 3 - Bottom Left */}
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
         
         {/* Circle 4 - Bottom Right */}
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
         {/* Circle 5 - Bottom Right */}
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
         {/* Circle 5 - Bottom Right */}
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

       {/* Header Text */}
       <Text style={{ 
         color: '#000000', 
         fontFamily: 'RobotoSlab-Bold', 
         textAlign: 'center', 
         fontSize: 42, 
         marginTop: 40,
         zIndex: 1,
         fontWeight: '900',
         letterSpacing: 1
       }}>
         Hello, Sign in !
       </Text>
     </View>

     {/* Login Form Section - Pushed Down */}
     <View style={{ 
       marginHorizontal: 50, 
       marginBottom: 40,
       flex: 1,
       marginTop: 80
     }}>
                <LinearGradient
         colors={['#FFEE58', '#FFF18A']}
         start={{ x: 0, y: 0 }}
         end={{ x: 0, y: 1 }}
         style={{
         borderRadius: 60,
         paddingTop: 160,
         paddingHorizontal: 32,
         paddingBottom: 32,
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 8 },
         shadowOpacity: 0.1,
         shadowRadius: 16,
         elevation: 0,
         zIndex: 0
       }}>
        {/* Username Input Field */}
        <View 
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            emailInputLayout.current = { y, height };
          }}
          style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 120,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          paddingHorizontal: 16,
          paddingVertical: 6,
          marginBottom: 20
        }}>
          <View style={{
            backgroundColor: '#AAEDED',
            width: 50,
            height: 54,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            marginVertical: -6,
            marginLeft: -16,
            borderTopLeftRadius: 120,
            borderBottomLeftRadius: 120,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0
          }}>
            <Ionicons name="person" size={18} color="#000000" />
          </View>
          <TextInput
            ref={emailInputRef}
            style={{
              flex: 1,
              fontSize: 16,
              fontFamily: 'RobotoSlab-Regular',
              color: '#000000',
            }}
            placeholder="Email"
            placeholderTextColor="#929191"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={handleEmailFocus}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />
        </View>
        
        {/* Password Input Field */}
        <View 
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            passwordInputLayout.current = { y, height };
          }}
          style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 120,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          paddingHorizontal: 16,
          paddingVertical: 6,
          marginBottom: 20
        }}>
          <View style={{
            backgroundColor: '#AAEDED',
            width: 50,
            height: 54,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            marginVertical: -6,
            marginLeft: -16,
            borderTopLeftRadius: 120,
            borderBottomLeftRadius: 120,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0
          }}>
            <Ionicons name="key" size={18} color="#000000" />
          </View>
          <TextInput
            ref={passwordInputRef}
            style={{
              flex: 1,
              fontSize: 16,
              fontFamily: 'RobotoSlab-Regular',
              color: '#000000',
            }}
            placeholder="Password"
            placeholderTextColor="#929191"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={handlePasswordFocus}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{
              padding: 8,
              marginLeft: 8
            }}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#929191" 
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password Link */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity>
            <Text style={{ 
              color: '#000000', 
              fontFamily: 'RobotoSlab-Regular', 
              fontSize: 14 
            }}>
              Forgot the password
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#01CBCA',
            borderRadius: 30,
            paddingVertical: 8,
            paddingHorizontal: 16,
            width: '70%',
            alignSelf: 'center',
            shadowColor: '#01CBCA',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
            opacity: isLoading ? 0.7 : 1
          }}
          activeOpacity={0.8}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={{
            color: '#FFFFFF',
            fontFamily: 'RobotoSlab-Bold',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '900'
          }}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
    
    {/* Logo Section - Overlapping both white background and form */}
    <View style={{ 
      alignItems: 'center', 
      position: 'absolute',
      top: 215,
      left: 0,
      right: 0,
      zIndex: 9999,
      elevation: 9999
    }}>
      <Image
        source={require('@/assets/images/edubus_logo.png')}
        style={{ width: 400, height: 300 }}
        contentFit="contain"
      />
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
