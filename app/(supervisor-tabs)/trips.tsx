import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatTodayLabel = () => {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${formatted}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'InProgress':
      return '#4CAF50';
    case 'Completed':
      return '#2196F3';
    case 'Scheduled':
      return '#FF9800';
    case 'Cancelled':
      return '#F44336';
    case 'Delayed':
      return '#FF5722';
    default:
      return '#9E9E9E';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'InProgress':
      return 'In Progress';
    case 'Completed':
      return 'Completed';
    case 'Scheduled':
      return 'Scheduled';
    case 'Cancelled':
      return 'Cancelled';
    case 'Delayed':
      return 'Delayed';
    default:
      return status;
  }
};

export default function SupervisorTripsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  // TODO: Replace with actual data from API
  const [trips] = useState<any[]>([]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // TODO: Fetch trips from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleTripPress = (tripId: string) => {
    router.push(`/(supervisor-tabs)/trip/${tripId}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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

      {/* Title Section */}
      <View
        style={{
          alignItems: "center",
          marginTop: -90,
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
          Student Trips
        </Text>
        <Text
          style={{
            fontFamily: "RobotoSlab-Medium",
            fontSize: 14,
            color: "#1F2937",
            textTransform: "capitalize",
            textAlign: "center",
          }}
        >
          {formatTodayLabel()}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {refreshing && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color="#01CBCA" />
            <Text style={{
              marginTop: 16,
              fontSize: 16,
              color: '#6B7280',
              fontFamily: 'RobotoSlab-Medium',
            }}>
              Loading trips...
            </Text>
          </View>
        )}
        {!refreshing && trips.length === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Ionicons name="calendar-outline" size={64} color="#9E9E9E" />
            <Text style={{
              marginTop: 16,
              fontSize: 16,
              color: '#9E9E9E',
              fontFamily: 'RobotoSlab-Medium',
            }}>
              No trips available
            </Text>
            <Text style={{
              marginTop: 8,
              fontSize: 14,
              color: '#9E9E9E',
              fontFamily: 'RobotoSlab-Regular',
              textAlign: 'center',
            }}>
              Student trips will appear here when available
            </Text>
          </View>
        )}
        {!refreshing && trips.length > 0 && trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={{
                backgroundColor: '#FFF8CF',
                borderRadius: 15,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#FDE370',
              }}
              onPress={() => handleTripPress(trip.id)}
              activeOpacity={0.7}>
              {/* Student Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {trip.studentAvatar ? (
                  <Image
                    source={{ uri: trip.studentAvatar }}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      marginRight: 12,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#E0E0E0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="person" size={24} color="#9E9E9E" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontFamily: 'RobotoSlab-Bold',
                    color: '#000000',
                    marginBottom: 4,
                  }}>
                    {trip.studentName || 'Student Name'}
                  </Text>
                  {trip.className && (
                    <Text style={{
                      fontSize: 14,
                      color: '#6B7280',
                      fontFamily: 'RobotoSlab-Medium',
                    }}>
                      {trip.className}
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: getStatusColor(trip.status || 'Scheduled'),
                  }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontFamily: 'RobotoSlab-Bold',
                  }}>
                    {getStatusText(trip.status || 'Scheduled')}
                  </Text>
                </View>
              </View>

              {/* Time Info */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                    marginLeft: 6,
                    fontFamily: 'RobotoSlab-Medium',
                  }}>
                    {trip.startTime ? formatTime(trip.startTime) : '--:--'} - {trip.endTime ? formatTime(trip.endTime) : '--:--'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                    marginLeft: 6,
                    fontFamily: 'RobotoSlab-Medium',
                  }}>
                    {trip.scheduleName || 'Schedule'}
                  </Text>
                </View>
              </View>

              {/* Route Info */}
              {trip.pickupLocation && (
                <View style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="location" size={16} color="#4CAF50" />
                    <Text style={{
                      fontSize: 14,
                      fontFamily: 'RobotoSlab-Medium',
                      color: '#6B7280',
                      marginLeft: 6,
                    }}>
                      Pickup: {trip.pickupLocation}
                    </Text>
                  </View>
                </View>
              )}

              {trip.dropoffLocation && (
                <View style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="location" size={16} color="#2196F3" />
                    <Text style={{
                      fontSize: 14,
                      fontFamily: 'RobotoSlab-Medium',
                      color: '#6B7280',
                      marginLeft: 6,
                    }}>
                      Dropoff: {trip.dropoffLocation}
                    </Text>
                  </View>
                </View>
              )}

              {/* View Details Button */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: 8,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: '#E0E0E0',
              }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFDD00',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                  onPress={() => handleTripPress(trip.id)}>
                  <Ionicons name="eye" size={16} color="#000000" />
                  <Text style={{
                    color: '#000000',
                    fontSize: 14,
                    fontFamily: 'RobotoSlab-Bold',
                    marginLeft: 6,
                  }}>
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
}

