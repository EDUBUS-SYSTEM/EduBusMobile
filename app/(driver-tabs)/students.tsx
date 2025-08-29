import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function DriverStudentsScreen() {
  const students = [
    {
      id: 1,
      name: 'Nguyen Van An',
      grade: 'Grade 5A',
      pickupLocation: 'Central District',
      pickupTime: '7:00 AM',
      status: 'onboard',
      avatar: '👦'
    },
    {
      id: 2,
      name: 'Tran Thi Binh',
      grade: 'Grade 4B',
      pickupLocation: 'Park Street',
      pickupTime: '7:15 AM',
      status: 'onboard',
      avatar: '👧'
    },
    {
      id: 3,
      name: 'Le Van Cuong',
      grade: 'Grade 6A',
      pickupLocation: 'Market Square',
      pickupTime: '7:30 AM',
      status: 'waiting',
      avatar: '👦'
    },
    {
      id: 4,
      name: 'Pham Thi Dung',
      grade: 'Grade 5B',
      pickupLocation: 'School Gate',
      pickupTime: '7:45 AM',
      status: 'absent',
      avatar: '👧'
    },
    {
      id: 5,
      name: 'Hoang Van Em',
      grade: 'Grade 4A',
      pickupLocation: 'Main Campus',
      pickupTime: '8:00 AM',
      status: 'waiting',
      avatar: '👦'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'onboard': return '#4CAF50';
      case 'waiting': return '#FF9800';
      case 'absent': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'onboard': return 'On Board';
      case 'waiting': return 'Waiting';
      case 'absent': return 'Absent';
      default: return status;
    }
  };

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
          Students
        </Text>
        <Text style={{
          color: '#000000',
          fontFamily: 'RobotoSlab-Regular',
          fontSize: 16,
          textAlign: 'center',
          marginTop: 5
        }}>
          Manage your passenger list
        </Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={{ padding: 20 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F5F5F5',
          borderRadius: 25,
          paddingHorizontal: 15,
          paddingVertical: 10,
          marginBottom: 20
        }}>
          <Ionicons name="search" size={20} color="#666" />
          <Text style={{
            fontFamily: 'RobotoSlab-Regular',
            fontSize: 16,
            color: '#666',
            marginLeft: 10,
            flex: 1
          }}>
            Search students...
          </Text>
        </View>

        {/* Summary Stats */}
        <View style={{
          backgroundColor: '#E0F7FA',
          borderRadius: 15,
          padding: 20,
          marginBottom: 20
        }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 18,
            color: '#000000',
            marginBottom: 15
          }}>
            Today's Summary
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#4CAF50'
              }}>
                2
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                On Board
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#FF9800'
              }}>
                2
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                Waiting
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#F44336'
              }}>
                1
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                Absent
              </Text>
            </View>
          </View>
        </View>

        {/* Student List */}
        <Text style={{
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 20,
          color: '#000000',
          marginBottom: 15
        }}>
          Passenger List
        </Text>

        {students.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 15,
              padding: 20,
              marginBottom: 15,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              borderWidth: 1,
              borderColor: '#E0E0E0'
            }}>
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#E0F7FA',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 15
            }}>
              <Text style={{ fontSize: 24 }}>{student.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 16,
                color: '#000000'
              }}>
                {student.name}
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 14,
                color: '#666',
                marginTop: 2
              }}>
                {student.grade}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="location" size={14} color="#01CBCA" />
                <Text style={{
                  fontFamily: 'RobotoSlab-Medium',
                  fontSize: 12,
                  color: '#01CBCA',
                  marginLeft: 4
                }}>
                  {student.pickupLocation} • {student.pickupTime}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{
                backgroundColor: `${getStatusColor(student.status)}20`,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                marginBottom: 8
              }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Medium',
                  fontSize: 10,
                  color: getStatusColor(student.status),
                  textTransform: 'uppercase'
                }}>
                  {getStatusText(student.status)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={{
                  backgroundColor: '#E0F7FA',
                  borderRadius: 20,
                  padding: 8
                }}>
                  <Ionicons name="checkmark-circle" size={16} color="#01CBCA" />
                </TouchableOpacity>
                <TouchableOpacity style={{
                  backgroundColor: '#E0F7FA',
                  borderRadius: 20,
                  padding: 8
                }}>
                  <Ionicons name="call" size={16} color="#01CBCA" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

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
              backgroundColor: '#4CAF50',
              borderRadius: 15,
              padding: 15,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#FFFFFF',
                marginTop: 5
              }}>
                Mark All Present
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
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#FFFFFF',
                marginTop: 5
              }}>
                Send Alert
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
