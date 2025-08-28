import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ParentContactsScreen() {
  const contacts = [
    {
      id: 1,
      name: 'Ms. Nguyen Thi Mai',
      role: 'Homeroom Teacher',
      phone: '0901 234 567',
      avatar: '👩‍🏫'
    },
    {
      id: 2,
      name: 'Mr. Tran Van Nam',
      role: 'Bus Driver',
      phone: '0901 234 568',
      avatar: '🚌'
    },
    {
      id: 3,
      name: 'Ms. Le Thi Hoa',
      role: 'Office Staff',
      phone: '0901 234 569',
      avatar: '👩‍💼'
    },
    {
      id: 4,
      name: 'Mr. Pham Van Minh',
      role: 'School Security',
      phone: '0901 234 570',
      avatar: '👮‍♂️'
    }
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
          Contacts
        </Text>
        <Text style={{
          color: '#000000',
          fontFamily: 'RobotoSlab-Regular',
          fontSize: 16,
          textAlign: 'center',
          marginTop: 5
        }}>
          Contact the school and transportation team
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
            Search contacts...
          </Text>
        </View>

        {/* Emergency Contact */}
        <View style={{
          backgroundColor: '#FFEBEE',
          borderRadius: 15,
          padding: 20,
          marginBottom: 20,
          borderLeftWidth: 4,
          borderLeftColor: '#F44336'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="warning" size={24} color="#F44336" />
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 18,
              color: '#F44336',
              marginLeft: 10
            }}>
              Emergency Contact
            </Text>
          </View>
          <TouchableOpacity style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 10,
            padding: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{ fontSize: 32, marginRight: 15 }}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 16,
                color: '#000000'
              }}>
                Emergency Hotline
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 14,
                color: '#666'
              }}>
                1900 1234
              </Text>
            </View>
            <Ionicons name="call" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* Contact List */}
        <Text style={{
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 20,
          color: '#000000',
          marginBottom: 15
        }}>
          Frequent Contacts
        </Text>

        {contacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
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
              <Text style={{ fontSize: 24 }}>{contact.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 16,
                color: '#000000'
              }}>
                {contact.name}
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 14,
                color: '#666',
                marginTop: 2
              }}>
                {contact.role}
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#01CBCA',
                marginTop: 2
              }}>
                {contact.phone}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{
                backgroundColor: '#E0F7FA',
                borderRadius: 20,
                padding: 8
              }}>
                <Ionicons name="call" size={20} color="#01CBCA" />
              </TouchableOpacity>
              <TouchableOpacity style={{
                backgroundColor: '#E0F7FA',
                borderRadius: 20,
                padding: 8
              }}>
                <Ionicons name="chatbubble" size={20} color="#01CBCA" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
