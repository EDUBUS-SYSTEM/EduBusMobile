import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function DriverRoutesScreen() {
  const routes = [
    {
      id: 1,
      name: 'Morning Route',
      time: '7:00 AM - 8:30 AM',
      stops: 8,
      passengers: 12,
      status: 'active',
      color: '#4CAF50'
    },
    {
      id: 2,
      name: 'Afternoon Route',
      time: '3:30 PM - 5:00 PM',
      stops: 8,
      passengers: 12,
      status: 'upcoming',
      color: '#2196F3'
    },
    {
      id: 3,
      name: 'Evening Route',
      time: '6:00 PM - 7:30 PM',
      stops: 6,
      passengers: 8,
      status: 'completed',
      color: '#9E9E9E'
    }
  ];

  const stops = [
    { id: 1, name: 'Central District', time: '7:00 AM', status: 'completed' },
    { id: 2, name: 'Park Street', time: '7:15 AM', status: 'completed' },
    { id: 3, name: 'Market Square', time: '7:30 AM', status: 'current' },
    { id: 4, name: 'School Gate', time: '7:45 AM', status: 'upcoming' },
    { id: 5, name: 'Main Campus', time: '8:00 AM', status: 'upcoming' }
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}>
        <Text style={{
          color: '#000000',
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 28,
          textAlign: 'center'
        }}>
          Routes
        </Text>
        <Text style={{
          color: '#000000',
          fontFamily: 'RobotoSlab-Regular',
          fontSize: 16,
          textAlign: 'center',
          marginTop: 5
        }}>
          Manage your daily routes and stops
        </Text>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        {/* Current Route Status */}
        <View style={{
          backgroundColor: '#E8F5E8',
          borderRadius: 15,
          padding: 20,
          marginBottom: 25
        }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 18,
            color: '#000000',
            marginBottom: 15
          }}>
            Current Route Status
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#4CAF50'
              }}>
                3/8
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                Stops
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#4CAF50'
              }}>
                7:30 AM
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                Current Time
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#4CAF50'
              }}>
                On Time
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                Status
              </Text>
            </View>
          </View>
        </View>

        {/* Route List */}
        <Text style={{
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 20,
          color: '#000000',
          marginBottom: 15
        }}>
          Today's Routes
        </Text>

        {routes.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 15,
              padding: 20,
              marginBottom: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              borderWidth: 1,
              borderColor: '#E0E0E0'
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 18,
                color: '#000000'
              }}>
                {route.name}
              </Text>
              <View style={{
                backgroundColor: `${route.color}20`,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12
              }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Medium',
                  fontSize: 12,
                  color: route.color,
                  textTransform: 'capitalize'
                }}>
                  {route.status}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 14,
                color: '#666',
                marginLeft: 8
              }}>
                {route.time}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 14,
                  color: '#666',
                  marginLeft: 8
                }}>
                  {route.stops} stops
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people" size={16} color="#666" />
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 14,
                  color: '#666',
                  marginLeft: 8
                }}>
                  {route.passengers} passengers
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Current Route Stops */}
        <View style={{ marginTop: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000',
            marginBottom: 15
          }}>
            Current Route Stops
          </Text>

          {stops.map((stop, index) => (
            <View
              key={stop.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 15,
                paddingHorizontal: 10
              }}>
              {/* Status Indicator */}
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: 
                  stop.status === 'completed' ? '#4CAF50' :
                  stop.status === 'current' ? '#FF9800' : '#E0E0E0',
                marginRight: 15,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {stop.status === 'completed' && (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                )}
                {stop.status === 'current' && (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#FFFFFF'
                  }} />
                )}
              </View>

              {/* Stop Info */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Medium',
                  fontSize: 16,
                  color: '#000000'
                }}>
                  {stop.name}
                </Text>
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 14,
                  color: '#666'
                }}>
                  {stop.time}
                </Text>
              </View>

              {/* Status Text */}
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 12,
                color: 
                  stop.status === 'completed' ? '#4CAF50' :
                  stop.status === 'current' ? '#FF9800' : '#666',
                textTransform: 'capitalize'
              }}>
                {stop.status}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={{ marginTop: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000',
            marginBottom: 15
          }}>
            Quick Actions
          </Text>

          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: '#01CBCA',
              borderRadius: 15,
              padding: 15,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#FFFFFF',
                marginTop: 5
              }}>
                Start Route
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: '#FF9800',
              borderRadius: 15,
              padding: 15,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Ionicons name="pause" size={24} color="#FFFFFF" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#FFFFFF',
                marginTop: 5
              }}>
                Pause Route
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
