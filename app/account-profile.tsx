import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function AccountProfileScreen() {
  // Mock user data - in real app this would come from API
  const userProfile = {
    fullName: 'John Smith',
    email: 'john.smith@email.com',
    phoneNumber: '+1 (555) 123-4567',
    dateOfBirth: '15 March 1985',
    avatar: '👨' // This would be an actual image in real app
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#FFFFFF',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFD700',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000'
          }}>
            Account Profile
          </Text>
          
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFD700',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="notifications" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Profile Avatar Section */}
        <View style={{ alignItems: 'center', marginBottom: 20, marginTop: -20 }}>
          {/* Yellow Rings Background */}
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#FFD700',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 15,
          }}>
            {/* Middle Ring */}
            <View style={{
              width: 95,
              height: 95,
              borderRadius: 47.5,
              backgroundColor: '#FFEB3B',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Inner Ring */}
              <View style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#FFF59D',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* Avatar */}
                <View style={{
                  width: 55,
                  height: 55,
                  borderRadius: 27.5,
                  backgroundColor: '#E0F7FA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5
                }}>
                  <Ionicons name="person" size={28} color="#01CBCA" />
                </View>
              </View>
            </View>
          </View>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 24,
            color: '#000000',
            textAlign: 'center'
          }}>
            {userProfile.fullName}
          </Text>
        </View>

        {/* Profile Information Cards */}
        <View style={{ gap: 12, marginTop: -10 }}>
          {/* Email Card */}
          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 15,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E0F7FA',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15
              }}>
                <Ionicons name="mail-outline" size={20} color="#01CBCA" />
              </View>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 16,
                color: '#000000'
              }}>
                Email Address
              </Text>
            </View>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 16,
              color: '#666666',
              marginLeft: 55
            }}>
              {userProfile.email}
            </Text>
          </View>

          {/* Full Name Card */}
          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 15,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E0F7FA',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15
              }}>
                <Ionicons name="person-outline" size={20} color="#01CBCA" />
              </View>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 16,
                color: '#000000'
              }}>
                Full Name
              </Text>
            </View>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 16,
              color: '#666666',
              marginLeft: 55
            }}>
              {userProfile.fullName}
            </Text>
          </View>

          {/* Phone Number Card */}
          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 15,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E0F7FA',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15
              }}>
                <Ionicons name="call-outline" size={20} color="#01CBCA" />
              </View>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 16,
                color: '#000000'
              }}>
                Phone Number
              </Text>
            </View>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 16,
              color: '#666666',
              marginLeft: 55
            }}>
              {userProfile.phoneNumber}
            </Text>
          </View>

          {/* Date of Birth Card */}
          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 15,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E0F7FA',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15
              }}>
                <Ionicons name="calendar-outline" size={20} color="#01CBCA" />
              </View>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 16,
                color: '#000000'
              }}>
                Date of Birth
              </Text>
            </View>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 16,
              color: '#666666',
              marginLeft: 55
            }}>
              {userProfile.dateOfBirth}
            </Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#01CBCA',
            borderRadius: 25,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginTop: 15,
            marginBottom: 30,
            alignItems: 'center',
            alignSelf: 'center',
            width: '60%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 16,
            color: '#FFFFFF'
          }}>
            Edit Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
