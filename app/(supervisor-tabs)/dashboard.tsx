import { getSupervisorTripsToday } from '@/lib/supervisor/supervisor.api';
import { DriverTripDto } from '@/lib/trip/driverTrip.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDriverTripsToday } from '@/store/slices/driverTodaySlice';
import { getTodayISOString, toHourMinute } from '@/utils/date.utils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const getStatusBgColor = (status: string): string => {
  const normalizedStatus = status?.toLowerCase() || '';
  const colors: Record<string, string> = {
    scheduled: '#D3E5FF',
    inprogress: '#FEF3C7',
    completed: '#E8F5E8',
    delayed: '#FFEBEE',
    cancelled: '#FFB8C2',
  };
  return colors[normalizedStatus] || '#F5F5F5';
};

const getStatusTextColor = (status: string): string => {
  const normalizedStatus = status?.toLowerCase() || '';
  const colors: Record<string, string> = {
    scheduled: '#0D6EFD',
    inprogress: '#F59E0B',
    completed: '#4CAF50',
    delayed: '#F44336',
    cancelled: '#FF0000',
  };
  return colors[normalizedStatus] || '#757575';
};

export default function SupervisorDashboardScreen() {
  const dispatch = useAppDispatch();
  const { trips: reduxTrips, status: reduxStatus } = useAppSelector((s) => s.driverToday);
  const [trips, setTrips] = React.useState<DriverTripDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  
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

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const isoDate = getTodayISOString();
        
        // Get trips from supervisor API
        try {
          const supervisorTrips = await getSupervisorTripsToday();
          if (mounted) {
            // Map SupervisorTripListItemDto to DriverTripDto
            const mappedTrips: DriverTripDto[] = supervisorTrips.map(trip => ({
              id: trip.id,
              routeId: '',
              serviceDate: trip.serviceDate,
              plannedStartAt: trip.plannedStartAt,
              plannedEndAt: trip.plannedEndAt,
              startTime: trip.startTime || undefined,
              endTime: trip.endTime || undefined,
              status: trip.status as DriverTripDto['status'],
              scheduleName: trip.routeName,
              totalStops: trip.totalStops,
              completedStops: trip.completedStops,
              stops: [],
              isOverride: false,
              overrideReason: '',
              overrideCreatedBy: undefined,
              overrideCreatedAt: undefined,
              createdAt: undefined,
              updatedAt: undefined,
            }));
            setTrips(mappedTrips);
            setLoading(false);
          }
        } catch (apiError) {
          console.warn('Supervisor API failed, using Redux:', apiError);
          // Fallback to Redux store
          if (mounted) {
            dispatch(fetchDriverTripsToday({ dateISO: isoDate }));
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading trips:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // Use supervisor trips if available, otherwise use Redux trips
  const displayTrips = trips.length > 0 ? trips : reduxTrips;
  const displayStatus = trips.length > 0 ? (loading ? 'loading' : 'idle') : reduxStatus;

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
        <View style={{ marginBottom: 10 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 22,
            color: '#111827',
          }}>
            Trips Today
          </Text>
        </View>

        {displayStatus === 'loading' && (
          <View style={{ backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12 }}>
            <Text style={{ fontFamily: 'RobotoSlab-Regular', color: '#6B7280' }}>Loading trips...</Text>
          </View>
        )}

        {displayStatus !== 'loading' && displayTrips.length === 0 && (
          <View style={{ backgroundColor: '#F8F9FA', padding: 20, borderRadius: 12, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
            <Text style={{ marginTop: 8, fontFamily: 'RobotoSlab-Medium', color: '#6B7280' }}>No trips today</Text>
          </View>
        )}

        {displayTrips.map((trip) => {
          const handleTripPress = () => {
            router.push(`/(supervisor-tabs)/trip/${trip.id}` as any);
          };

          const TripCardContent = () => (
            <>
              <View style={{ height: 6, backgroundColor: '#FFDD00' }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text style={{ marginLeft: 6, fontFamily: 'RobotoSlab-Medium', color: '#374151' }}>
                        {toHourMinute(trip.plannedStartAt)} - {toHourMinute(trip.plannedEndAt)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text style={{ marginLeft: 6, fontFamily: 'RobotoSlab-Regular', color: '#4B5563' }}>{trip.scheduleName}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: getStatusBgColor(trip.status), paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{
                      fontFamily: 'RobotoSlab-Bold',
                      fontSize: 12,
                      color: getStatusTextColor(trip.status)
                    }}>{trip.status}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 }}>
                    <Text style={{ fontFamily: 'RobotoSlab-Medium', color: '#6B7280', fontSize: 12 }}>Stops: {trip.totalStops}</Text>
                  </View>
                </View>
              </View>
            </>
          );

          return (
            <TouchableOpacity
              key={trip.id}
              onPress={handleTripPress}
              activeOpacity={0.7}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                marginBottom: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
                overflow: 'hidden'
              }}>
              <TripCardContent />
            </TouchableOpacity>
          );
        })}

        {/* Quick Actions */}
        <View style={{ marginTop: 30, marginBottom: 30 }}>
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

