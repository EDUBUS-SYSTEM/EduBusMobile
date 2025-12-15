import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDriverTripsToday } from '@/store/slices/driverTodaySlice';
import { formatDateWithWeekday, getTodayISOString, toHourMinute } from '@/utils/date.utils';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const statusColor: Record<string, string> = {
  Scheduled: '#FFFFFF',
  InProgress: '#FFFFFF',
  Completed: '#FFFFFF',
  Delayed: '#FFFFFF',
  Cancelled: '#FFFFFF',
};
const statusBg: Record<string, string> = {
  InProgress: '#4CAF50',
  Completed: '#2196F3',
  Scheduled: '#FF9800',
  Cancelled: '#F44336',
  Delayed: '#FF5722',
  default: '#9E9E9E',
};

export default function DriverTripsTodayScreen() {
  const dispatch = useAppDispatch();
  const { trips, status } = useAppSelector((s) => s.driverToday);
  const [refreshing, setRefreshing] = React.useState(false);

  const todayDisplay = React.useMemo(() => {
    const now = new Date();
    return formatDateWithWeekday(now);
  }, []);

  const loadTrips = React.useCallback(async () => {
    try {
      const isoDate = getTodayISOString();
      await dispatch(fetchDriverTripsToday({ dateISO: isoDate })).unwrap();
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  }, [dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (mounted) {
          await loadTrips();
        }
      } catch {
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadTrips]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFD700', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'RobotoSlab-Bold', fontSize: 24, color: '#000000' }}>Trips Today</Text>
            <Text style={{ fontFamily: 'RobotoSlab-Medium', fontSize: 14, color: '#111827', marginTop: 4 }}>{todayDisplay}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={{ padding: 20 }}>
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
          const hasBlockingEarlierTrip = trips.some(
            (t) =>
              t.id !== trip.id &&
              new Date(t.plannedStartAt).getTime() < new Date(trip.plannedStartAt).getTime() &&
              t.status !== 'Completed'
          );
          const canStart = trip.status === 'Scheduled' && !hasBlockingEarlierTrip;

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

                {canStart && (
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
      </View>
    </ScrollView>
  );
}

