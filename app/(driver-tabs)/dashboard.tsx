import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDriverTripsToday } from '@/store/slices/driverTodaySlice';
import { authApi } from '@/lib/auth/auth.api';
import { getTodayISOString, toHourMinute } from '@/utils/date.utils';


const statusColor: Record<string, string> = {
  Scheduled: '#4CAF50',
  InProgress: '#2196F3',
  Completed: '#9C27B0',
  Delayed: '#FF9800',
  Cancelled: '#F44336',
};
const statusBg: Record<string, string> = {
  Scheduled: '#E8F5E8',
  InProgress: '#E3F2FD',
  Completed: '#F3E5F5',
  Delayed: '#FFF3E0',
  Cancelled: '#FFEBEE',
};

export default function DriverDashboardScreen() {
  const dispatch = useAppDispatch();
  const { trips, status } = useAppSelector((s) => s.driverToday);
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
        const isoDate = getTodayISOString();
        if (mounted) {
          dispatch(fetchDriverTripsToday({ dateISO: isoDate }));
        }
      } catch {
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header with Logo */}
      <LinearGradient
        colors={['#FFDD00', '#FFDD00']}
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
          <Text
            style={{
              color: '#1F2937',
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              marginTop: 4,
              textTransform: 'capitalize',
              textAlign: 'center',
            }}
          >
            {todayDisplay}
          </Text>
        </View>
      </LinearGradient>

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

        {status === 'loading' && (
          <View style={{ backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12 }}>
            <Text style={{ fontFamily: 'RobotoSlab-Regular', color: '#6B7280' }}>Loading trips...</Text>
          </View>
        )}

        {status !== 'loading' && trips.length === 0 && (
          <View style={{ backgroundColor: '#F8F9FA', padding: 20, borderRadius: 12, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
            <Text style={{ marginTop: 8, fontFamily: 'RobotoSlab-Medium', color: '#6B7280' }}>No trips today</Text>
          </View>
        )}

        {trips.map((trip) => {
          const handleTripPress = () => {
            if (trip.status === 'InProgress') {
              router.push(`/(driver-tabs)/trip/${trip.id}` as any);
            }
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
                  <View style={{ backgroundColor: statusBg[trip.status] || '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{
                      fontFamily: 'RobotoSlab-Bold',
                      fontSize: 12,
                      color: statusColor[trip.status] || '#6B7280'
                    }}>{trip.status}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 }}>
                    <Text style={{ fontFamily: 'RobotoSlab-Medium', color: '#6B7280', fontSize: 12 }}>Stops: {trip.totalStops}</Text>
                  </View>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ fontFamily: 'RobotoSlab-Medium', color: '#6B7280', fontSize: 12 }}>Completed: {trip.completedStops}/{trip.totalStops}</Text>
                  </View>
                </View>

                {trip.status === 'Scheduled' && (
                  <View style={{ marginTop: 14, alignItems: 'flex-end' }}>
                    <TouchableOpacity
                      onPress={() => router.push(`/(driver-tabs)/trip-start/${trip.id}` as any)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFDD00' }}
                    >
                      <Text style={{ color: '#000000', fontFamily: 'RobotoSlab-Bold' }}>Start</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          );

          if (trip.status === 'InProgress') {
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
          }

          return (
            <View
              key={trip.id}
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
            </View>
          );
        })}
      

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
