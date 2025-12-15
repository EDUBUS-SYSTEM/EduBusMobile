import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDriverTripsToday } from '@/store/slices/driverTodaySlice';
import { getSupervisorTripsToday } from '@/lib/supervisor/supervisor.api';
import { DriverTripDto } from '@/lib/trip/driverTrip.types';
import { formatDateWithWeekday, getTodayISOString, toHourMinute } from '@/utils/date.utils';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

export default function SupervisorTripsTodayScreen() {
  const dispatch = useAppDispatch();
  const { trips: reduxTrips, status: reduxStatus } = useAppSelector((s) => s.driverToday);
  const [trips, setTrips] = React.useState<DriverTripDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const todayDisplay = React.useMemo(() => {
    const now = new Date();
    return formatDateWithWeekday(now);
  }, []);

  const loadTrips = React.useCallback(async () => {
    try {
      setLoading(true);
      const isoDate = getTodayISOString();
      try {
        const supervisorTrips = await getSupervisorTripsToday();
        const mappedTrips: DriverTripDto[] = supervisorTrips.map((trip) => ({
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
      } catch (apiError) {
        console.warn('Supervisor API failed, using Redux:', apiError);
        await dispatch(fetchDriverTripsToday({ dateISO: isoDate }));
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
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
      if (mounted) {
        await loadTrips();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadTrips]);

  const displayTrips = trips.length > 0 ? trips : reduxTrips;
  const displayStatus = trips.length > 0 ? (loading ? 'loading' : 'idle') : reduxStatus;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View
        style={{
          paddingTop: 50,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: '#FFD700',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'RobotoSlab-Bold', fontSize: 24, color: '#000000' }}>Trips Today</Text>
            <Text style={{ fontFamily: 'RobotoSlab-Medium', fontSize: 14, color: '#111827', marginTop: 4 }}>
              {todayDisplay}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={{ padding: 20 }}>
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
                      <Text style={{ marginLeft: 6, fontFamily: 'RobotoSlab-Regular', color: '#4B5563' }}>
                        {trip.scheduleName}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: getStatusBgColor(trip.status),
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'RobotoSlab-Bold',
                        fontSize: 12,
                        color: getStatusTextColor(trip.status),
                      }}
                    >
                      {trip.status}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <View
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ fontFamily: 'RobotoSlab-Medium', color: '#6B7280', fontSize: 12 }}>
                      Stops: {trip.totalStops}
                    </Text>
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
                overflow: 'hidden',
              }}
            >
              <TripCardContent />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

