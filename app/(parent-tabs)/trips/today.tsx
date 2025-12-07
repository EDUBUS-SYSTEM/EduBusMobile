import { StudentAvatarsRow } from '@/components/StudentAvatarsRow';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchParentTripsToday } from '@/store/slices/parentTodaySlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const formatTime = (iso: string) => {
  const date = new Date(iso);
  // Use UTC time to match backend (backend stores times in UTC)
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
      return '#4CAF50'; // Green
    case 'Completed':
      return '#2196F3'; // Blue
    case 'Scheduled':
      return '#FF9800'; // Orange
    case 'Cancelled':
      return '#F44336'; // Red
    case 'Delayed':
      return '#FF5722'; // Deep Orange
    default:
      return '#9E9E9E'; // Grey
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

export default function TripsTodayScreen() {
  const dispatch = useAppDispatch();
  const { trips, status, error } = useAppSelector((state) => state.parentToday);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadTrips = React.useCallback(async () => {
    try {
      const today = new Date();
      const isoDate = today.toISOString().split('T')[0];
      await dispatch(fetchParentTripsToday({ dateISO: isoDate })).unwrap();
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadTrips();
  }, [loadTrips]);

  // Sort trips: InProgress trips first, then others
  const sortedTrips = React.useMemo(() => {
    return [...trips].sort((a, b) => {
      if (a.status === 'InProgress' && b.status !== 'InProgress') {
        return -1; // a comes first
      }
      if (a.status !== 'InProgress' && b.status === 'InProgress') {
        return 1; // b comes first
      }
      return 0; // keep original order for others
    });
  }, [trips]);

  const loading = status === 'loading' || status === 'idle';

  const handleTripPress = (tripId: string) => {
    router.push(`/(parent-tabs)/trip/${tripId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFDD00" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />

      {/* Header */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Trips Today</Text>
          <Text style={styles.headerSubtitle}>{formatTodayLabel()}</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {status === 'failed' && error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
            <Text style={styles.emptyText}>Error: {error}</Text>
          </View>
        )}
        {status !== 'failed' && sortedTrips.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#9E9E9E" />
            <Text style={styles.emptyText}>No trips today</Text>
          </View>
        )}
        {sortedTrips.length > 0 && sortedTrips.map((trip) => (
          <TouchableOpacity
            key={`${trip.id}-${trip.childId}`}
            style={styles.tripCard}
            disabled={trip.status !== 'InProgress'}
            onPress={trip.status === 'InProgress' ? () => handleTripPress(trip.id) : undefined}
            activeOpacity={0.7}>
            {/* Child Info */}
            <View style={styles.childInfoRow}>
              {trip.children && trip.children.length > 0 ? (
                <StudentAvatarsRow
                  students={trip.children.map(c => ({
                    id: c.id,
                    name: c.name,
                  }))}
                  size={36}
                  maxVisible={4}
                  showBorder={false}
                  style={styles.childAvatar}
                />
              ) : (
                <StudentAvatarsRow
                  students={[{
                    id: trip.childId,
                    name: trip.childName,
                  }]}
                  size={36}
                  showBorder={false}
                  style={styles.childAvatar}
                />
              )}
              <View style={styles.childInfo}>
                {trip.children && trip.children.length > 0 ? (
                  <>
                    <Text style={styles.childName}>
                      {trip.children.map(c => c.name).join(', ')}
                    </Text>
                    {trip.childClassName && (
                      <Text style={styles.childClass}>{trip.childClassName}</Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.childName}>{trip.childName}</Text>
                    {trip.childClassName && (
                      <Text style={styles.childClass}>{trip.childClassName}</Text>
                    )}
                  </>
                )}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(trip.status) },
                ]}>
                <Text style={styles.statusText}>
                  {getStatusText(trip.status)}
                </Text>
              </View>
            </View>

            {/* Time Info */}
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.timeText}>
                  {formatTime(trip.plannedStartAt)} -{' '}
                  {formatTime(trip.plannedEndAt)}
                </Text>
              </View>
              <View style={styles.timeItem}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.scheduleText}>{trip.scheduleName}</Text>
              </View>
            </View>

            {/* Pickup/Dropoff Info */}
            {trip.pickupStop && (
              <View style={styles.stopInfo}>
                <View style={styles.stopRow}>
                  <Ionicons name="location" size={16} color="#4CAF50" />
                  <Text style={styles.stopLabel}>Pickup Point</Text>
                </View>
                <Text style={styles.stopAddress}>
                  {trip.pickupStop.address}
                </Text>
              </View>
            )}

            {trip.dropoffStop && (
              <View style={styles.stopInfo}>
                <View style={styles.stopRow}>
                  <Ionicons name="location" size={16} color="#2196F3" />
                  <Text style={styles.stopLabel}>Drop-off Point</Text>
                </View>
                <Text style={styles.stopAddress}>
                  FPT Primary School Da Nang
                </Text>
              </View>
            )}

            {/* Progress Info */}
            <View style={styles.progressRow}>
              {trip.status === 'InProgress' && (
                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={() => handleTripPress(trip.id)}>
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  <Text style={styles.trackButtonText}>Track Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))
        }
      </ScrollView >
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'RobotoSlab-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9E9E9E',
    fontFamily: 'RobotoSlab-Medium',
  },
  tripCard: {
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
  },
  childInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  childAvatar: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  childClass: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'RobotoSlab-Bold',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontFamily: 'RobotoSlab-Medium',
  },
  scheduleText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontFamily: 'RobotoSlab-Medium',
  },
  stopInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stopLabel: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
    color: '#6B7280',
    marginLeft: 6,
    marginRight: 6,
  },
  stopName: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    flex: 1,
  },
  stopAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 22,
    marginBottom: 4,
  },
  stopTime: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 22,
    fontFamily: 'RobotoSlab-Medium',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDD00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackButtonText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    marginLeft: 6,
  },
});

