import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function ParentHomeScreen() {
  const router = useRouter();

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
            Welcome Parents!
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
          <TouchableOpacity 
            onPress={() => router.push('/service-registration/student-selection')}
            style={{
              backgroundColor: '#FEFCE8',
              borderRadius: 15,
              padding: 20,
              width: '47%',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              borderWidth: 2,
              borderColor: '#FDC700'
            }}>
            <Ionicons name="clipboard" size={32} color="#D08700" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              color: '#000000',
              marginTop: 8,
              textAlign: 'center'
            }}>
              Register Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/(parent-tabs)/trips/today')}
            style={{
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
            <Ionicons name="calendar" size={32} color="#01CBCA" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              color: '#000000',
              marginTop: 8,
              textAlign: 'center'
            }}>
              Trips Today
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
            <Ionicons name="calendar" size={32} color="#01CBCA" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              color: '#000000',
              marginTop: 8,
              textAlign: 'center'
            }}>
              Schedule
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

        {/* Recent Activity */}
        <View style={{ marginTop: 30 }}>
                  <Text style={{
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 20,
          color: '#000000',
          marginBottom: 15
        }}>
          Recent Activity
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
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                                 Bus registered for next week
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="time" size={24} color="#FF9800" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                                 Bus will arrive at 7:30 AM
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle" size={24} color="#2196F3" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                                 Update student information
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
