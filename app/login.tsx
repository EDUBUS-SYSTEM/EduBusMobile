import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
         <View style={{ flex: 1, backgroundColor: '#FFFFFF', position: 'relative' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
     
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
        <View style={{
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
            style={{
              flex: 1,
              fontSize: 16,
              fontFamily: 'RobotoSlab-Regular',
              color: '#000000',
            }}
            placeholder="User"
            placeholderTextColor="#929191"
          />
        </View>
        
        {/* Password Input Field */}
        <View style={{
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
            style={{
              flex: 1,
              fontSize: 16,
              fontFamily: 'RobotoSlab-Regular',
              color: '#000000',
            }}
            placeholder="Password"
            placeholderTextColor="#929191"
            secureTextEntry={!showPassword}
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
            elevation: 6
          }}
          activeOpacity={0.8}
        >
          <Text style={{
            color: '#FFFFFF',
            fontFamily: 'RobotoSlab-Bold',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '900'
          }}>
            Sign in
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
  );
}
