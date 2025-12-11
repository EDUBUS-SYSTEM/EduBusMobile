import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUnreadCount } from '@/store/slices/notificationsSlice';
import { formatDateWithWeekday } from '@/utils/date.utils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';


export default function DriverDashboardScreen() {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount);

  const todayDisplay = React.useMemo(() => {
    const now = new Date();
    return formatDateWithWeekday(now);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchUnreadCount());
    }, [dispatch])
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      {/* Header Section with Yellow Circles Background */}
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
        {/* Yellow Circles Background */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {/* Circle 1 - Top Left */}
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

          {/* Circle 2 - Top Right */}
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

          {/* Circle 3 - Bottom Left */}
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

          {/* Circle 4 - Bottom Right */}
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
          {/* Circle 5 - Bottom Right */}
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
          {/* Circle 6 - Bottom Right */}
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

        {/* Logo */}
        <View
          style={{ alignItems: "flex-start", marginBottom: 0, marginTop: 0 }}
        >
          <Image
            source={require("@/assets/images/edubus_logo.png")}
            style={{ width: 150, height: 150 }}
            contentFit="contain"
          />
        </View>

        {/* Curved White Border */}
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

      {/* Welcome Section */}
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
          Welcome Driver!
        </Text>
        <Text
          style={{
            color: "#1F2937",
            fontFamily: "RobotoSlab-Medium",
            fontSize: 14,
            textTransform: "capitalize",
            textAlign: "center",
          }}
        >
          {todayDisplay}
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        {/* Quick Actions */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000',
            marginBottom: 16
          }}>
            Quick Actions
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 12
          }}>
            <TouchableOpacity
              onPress={() => router.push('/(driver-tabs)/trips-today' as any)}
              style={{
                backgroundColor: '#E0F7FA',
                borderRadius: 15,
                padding: 18,
                width: '48%',
                alignItems: 'center',
                ...Platform.select({
                  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                  android: { elevation: 3 },
                  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                })
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

            <TouchableOpacity
              onPress={() => router.push('/(driver-tabs)/notifications' as any)}
              style={{
                backgroundColor: '#E0F7FA',
                borderRadius: 15,
                padding: 18,
                width: '48%',
                alignItems: 'center',
                ...Platform.select({
                  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                  android: { elevation: 3 },
                  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                })
              }}>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications" size={32} color="#01CBCA" />
                {unreadCount > 0 && (
                  <View style={{
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
                  }}>
                    <Text style={{
                      fontFamily: 'RobotoSlab-Bold',
                      fontSize: 11,
                      color: '#FFFFFF',
                    }}>
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
