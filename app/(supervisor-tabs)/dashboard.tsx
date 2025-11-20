import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function SupervisorDashboardScreen() {
  const todayDisplay = React.useMemo(() => {
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
          Welcome Supervisor!
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
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 22,
            color: '#111827',
            marginBottom: 20
          }}>
            Quick Actions
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
            <TouchableOpacity 
              onPress={() => router.push('/(supervisor-tabs)/trips')}
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
                View Trips
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(supervisor-tabs)/account')}
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
              <Ionicons name="person" size={32} color="#01CBCA" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#000000',
                marginTop: 8,
                textAlign: 'center'
              }}>
                My Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Overview */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000',
            marginBottom: 15
          }}>
            Overview
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
              <Ionicons name="people" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Total Students: Loading...
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="car" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Active Trips: Loading...
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Completed Today: Loading...
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{ marginBottom: 30 }}>
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
              <Ionicons name="information-circle" size={24} color="#2196F3" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Monitor student trips
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
                View trip schedules
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 16,
                color: '#000000',
                marginLeft: 10
              }}>
                Track trip status
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

