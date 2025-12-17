import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUnreadCount } from '@/store/slices/notificationsSlice';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ParentHomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);
  const todayDisplay = useMemo(() => {
    const now = new Date();
    try {
      return now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return now.toDateString();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUnreadCount());
    }, [dispatch]),
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

      <View
        style={{
          paddingTop: 40,
          paddingBottom: 40,
          paddingHorizontal: 24,
          position: "relative",
          minHeight: 200,
          backgroundColor: "transparent",
        }}
      >

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >

          <View
            style={{
              position: "absolute",
              top: -40,
              left: -100,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />


          <View
            style={{
              position: "absolute",
              top: -30,
              left: 40,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />


          <View
            style={{
              position: "absolute",
              top: -30,
              left: 180,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: -40,
              left: 320,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />


          <View
            style={{
              position: "absolute",
              top: -90,
              right: 180,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />

          <View
            style={{
              position: "absolute",
              top: -90,
              right: 40,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />

          <View
            style={{
              position: "absolute",
              top: -90,
              right: 320,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: -90,
              right: -100,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
        </View>

        <View
          style={{ alignItems: "flex-start", marginBottom: 0, marginTop: 0 }}
        >
          <Image
            source={require("@/assets/images/edubus_logo.png")}
            style={{ width: 150, height: 150 }}
            contentFit="contain"
          />
        </View>

        <View
          style={{
            position: "absolute",
            bottom: -30,
            left: 0,
            right: 0,
            height: 40,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
        />
      </View>

      <View
        style={{
          alignItems: "center",
          marginTop: -80,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontFamily: "RobotoSlab-Bold",
            fontSize: 18,
            color: "#000000",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          Welcome Parents!
        </Text>
        <Text
          style={{
            fontFamily: "RobotoSlab-Medium",
            fontSize: 14,
            color: "#1F2937",
            textAlign: "center",
          }}
        >
          {todayDisplay}
        </Text>
      </View>

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

        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            onPress={() => router.push('/(parent-tabs)/trips/today')}
            style={styles.quickActionCard}>
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

          <TouchableOpacity
            onPress={() => router.push('/(parent-tabs)/notifications')}
            style={styles.quickActionCard}>
            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications" size={32} color="#01CBCA" />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#FF5722',
                    paddingHorizontal: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#FFFFFF',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'RobotoSlab-Bold',
                      fontSize: 11,
                      color: '#FFFFFF',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
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

          <TouchableOpacity
            onPress={() => router.push('/(parent-tabs)/trips/calendar')}
            style={styles.quickActionCard}>
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

          <TouchableOpacity
            onPress={() => router.push('/service-registration/student-selection')}
            style={styles.quickActionCard}>
            <Ionicons name="clipboard" size={32} color="#01CBCA" />
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

const sharedShadow = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  android: {
    elevation: 6,
    shadowColor: '#101828',
  },
  default: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
}) ?? {};

const styles = StyleSheet.create({
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#E0F7FA',
    borderRadius: 15,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    ...sharedShadow,
  },
});
