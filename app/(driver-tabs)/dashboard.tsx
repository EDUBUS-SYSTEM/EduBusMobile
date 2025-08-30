import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function DriverDashboardScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header with Logo */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 40,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={require('@/assets/images/edubus_logo.png')}
            style={{ width: 200, height: 150 }}
            contentFit="contain"
          />
          <Text style={{
            color: '#000000',
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 24,
            marginTop: 10,
            textAlign: 'center'
          }}>
            Welcome Driver!
          </Text>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={{ padding: 20 }}>
        <Text style={{
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 20,
          color: '#000000',
          marginBottom: 20
        }}>
          Quick Actions
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
          <TouchableOpacity style={{
            backgroundColor: '#E0F7FA',
            borderRadius: 15,
            padding: 20,
            width: '47%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Ionicons name="play-circle" size={32} color="#01CBCA" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              color: '#000000',
              marginTop: 8,
              textAlign: 'center'
            }}>
              Start Route
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{
            backgroundColor: '#E0F7FA',
            borderRadius: 15,
            padding: 20,
            width: '47%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Ionicons name="location" size={32} color="#01CBCA" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              color: '#000000',
              marginTop: 8,
              textAlign: 'center'
            }}>
              Current Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{
            backgroundColor: '#E0F7FA',
            borderRadius: 15,
            padding: 20,
            width: '47%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Ionicons name="people" size={32} color="#01CBCA" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              color: '#000000',
              marginTop: 8,
              textAlign: 'center'
            }}>
              Passenger List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{
            backgroundColor: '#E0F7FA',
            borderRadius: 15,
            padding: 20,
            width: '47%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Ionicons name="notifications" size={32} color="#01CBCA" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              color: '#000000',
              marginTop: 8,
              textAlign: 'center'
            }}>
              Notifications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={{ marginTop: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000',
            marginBottom: 15
          }}>
            Today's Schedule
          </Text>

          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 15,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="time" size={24} color="#FF9800" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Morning Route: 7:00 AM - 8:30 AM
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="location" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Route: Central District → School
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="people" size={24} color="#2196F3" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Passengers: 12 students
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Status */}
        <View style={{ marginTop: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000',
            marginBottom: 15
          }}>
            Vehicle Status
          </Text>

          <View style={{
            backgroundColor: '#E8F5E8',
            borderRadius: 15,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Vehicle: Bus #A-123
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="battery-full" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Fuel Level: 85%
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="settings" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Maintenance: All systems OK
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
