import { parentTripMockApi } from '@/lib/trip-mock-data/parentTrip.mockApi';
import type { ParentTripDto } from '@/lib/trip-mock-data/parentTrip.types';
import { tripHubService } from '@/lib/signalr/tripHub.service';
import type { Guid } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Camera, MapView, PointAnnotation, type MapViewRef } from '@vietmap/vietmap-gl-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Params = { tripId?: Guid };

interface LocationUpdate {
  tripId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  accuracy?: number | null;
  isMoving?: boolean;
}

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
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

const getStopStatus = (stop: ParentTripDto['pickupStop'] | ParentTripDto['dropoffStop']) => {
  if (!stop) return 'pending';
  if (stop.departedAt) return 'completed';
  if (stop.arrivedAt) return 'arrived';
  return 'pending';
};

// Mock current bus location (in real app, this would come from SignalR)
const getMockBusLocation = (): [number, number] => {
  // Đà Nẵng coordinates - between pickup and dropoff
  return [108.2022, 16.0544];
};

export default function ParentTripTrackingScreen() {
  const { tripId } = useLocalSearchParams<Params>();
  const [trip, setTrip] = useState<ParentTripDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busLocation, setBusLocation] = useState<[number, number] | null>(null);
  const [cameraCenter, setCameraCenter] = useState<[number, number] | null>(null);
  const mapRef = useRef<MapViewRef>(null);

  // Load trip data
  useEffect(() => {
    if (!tripId) {
      Alert.alert('Error', 'Trip ID is missing', [
        { text: 'OK', onPress: () => router.replace('/(parent-tabs)/trips/today') },
      ]);
      return;
    }

    (async () => {
      try {
        const tripData = await parentTripMockApi.getById(tripId);
        if (tripData) {
          setTrip(tripData);
          // Set initial bus location
          if (tripData.status === 'InProgress') {
            setBusLocation(getMockBusLocation());
          }
        } else {
          Alert.alert('Error', 'Trip not found', [
            { text: 'OK', onPress: () => router.replace('/(parent-tabs)/trips/today') },
          ]);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load trip', [
          { text: 'OK', onPress: () => router.replace('/(parent-tabs)/trips/today') },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  // Initialize TripHub connection for real-time location updates
  useEffect(() => {
    if (!tripId || !trip || trip.status !== 'InProgress') return;

    const initializeTripHub = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.warn('⚠️ No access token found');
          return;
        }

        if (!tripHubService.isConnected()) {
          console.log('🔌 Initializing TripHub connection...');
          await tripHubService.initialize(token);
        }

        // Join trip group to receive location updates
        await tripHubService.joinTrip(tripId);
        console.log('✅ Joined trip group:', tripId);

        // Subscribe to location updates
        tripHubService.onLocationUpdate<LocationUpdate>((location) => {
          if (location.tripId === tripId) {
            const newLocation: [number, number] = [location.longitude, location.latitude];
            setBusLocation(newLocation);
            setCameraCenter(newLocation);
          }
        });

        console.log('✅ TripHub initialized for trip tracking:', tripId);
      } catch (error) {
        console.error('❌ Error initializing TripHub:', error);
        // Fallback to mock location
        setBusLocation(getMockBusLocation());
      }
    };

    initializeTripHub();

    // Cleanup
    return () => {
      tripHubService.offLocationUpdate();
      if (tripId) {
        tripHubService.leaveTrip(tripId).catch((error) => {
          console.error('❌ Error leaving trip:', error);
        });
      }
    };
  }, [tripId, trip]);


  const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
  const mapStyle = apiKey 
    ? `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`
    : undefined;

  // Center map on bus location or default location
  const getMapCenter = (): [number, number] => {
    if (busLocation) return busLocation;
    // Default to Đà Nẵng
    return [108.2022, 16.0544];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFDD00" />
          <Text style={styles.loadingText}>Loading trip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return null;
  }

  const pickupStatus = getStopStatus(trip.pickupStop);
  const dropoffStatus = getStopStatus(trip.dropoffStop);

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
          onPress={() => router.replace('/(parent-tabs)/trips/today')}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Tracking</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Child Info Card */}
        <View style={styles.childCard}>
          <View style={styles.childInfoRow}>
            {trip.childAvatar ? (
              <Image
                source={{ uri: trip.childAvatar }}
                style={styles.childAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.childAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={32} color="#9E9E9E" />
              </View>
            )}
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{trip.childName}</Text>
              {trip.childClassName && (
                <Text style={styles.childClass}>{trip.childClassName}</Text>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(trip.status) },
              ]}>
              <Text style={styles.statusText}>{getStatusText(trip.status)}</Text>
            </View>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.tripInfoCard}>
          <View style={styles.tripInfoRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.tripTime}>
              {formatTime(trip.plannedStartAt)} - {formatTime(trip.plannedEndAt)}
            </Text>
          </View>
          <View style={styles.tripInfoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.tripSchedule}>{trip.scheduleName}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Trip Progress</Text>
            <Text style={styles.progressText}>
              {trip.completedStops} / {trip.totalStops} stops
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(trip.completedStops / trip.totalStops) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          {mapStyle ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              mapStyle={mapStyle}
              logoEnabled={false}
              attributionEnabled={false}>
              <Camera
                defaultSettings={{
                  centerCoordinate: getMapCenter(),
                  zoomLevel: 13,
                  animationDuration: 0,
                }}
                centerCoordinate={cameraCenter || getMapCenter()}
                zoomLevel={cameraCenter ? 14 : 13}
                animationDuration={cameraCenter ? 1000 : 0}
              />
              
              {/* Bus Location Marker */}
              {busLocation && trip.status === 'InProgress' && (
                <PointAnnotation
                  id="bus-location"
                  coordinate={busLocation}
                  anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.busMarker}>
                    <Ionicons name="bus" size={32} color="#4CAF50" />
                    <View style={styles.busMarkerPulse} />
                  </View>
                </PointAnnotation>
              )}

              {/* Pickup Point Marker */}
              {trip.pickupStop && (
                <PointAnnotation
                  id="pickup-point"
                  coordinate={[108.2022, 16.0544]} // Mock coordinates
                  anchor={{ x: 0.5, y: 1 }}>
                  <View style={[
                    styles.stopMarker,
                    pickupStatus === 'completed' && styles.stopMarkerCompleted,
                    pickupStatus === 'arrived' && styles.stopMarkerArrived,
                  ]}>
                    <Ionicons 
                      name={pickupStatus === 'completed' ? 'checkmark-circle' : 'location'} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </View>
                </PointAnnotation>
              )}

              {/* Dropoff Point Marker */}
              {trip.dropoffStop && (
                <PointAnnotation
                  id="dropoff-point"
                  coordinate={[108.2025, 16.0550]} // Mock coordinates
                  anchor={{ x: 0.5, y: 1 }}>
                  <View style={[
                    styles.stopMarker,
                    styles.stopMarkerDropoff,
                    dropoffStatus === 'completed' && styles.stopMarkerCompleted,
                    dropoffStatus === 'arrived' && styles.stopMarkerArrived,
                  ]}>
                    <Ionicons 
                      name={dropoffStatus === 'completed' ? 'checkmark-circle' : 'location'} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </View>
                </PointAnnotation>
              )}
            </MapView>
          ) : (
            <View style={styles.mapError}>
              <Ionicons name="map-outline" size={48} color="#9E9E9E" />
              <Text style={styles.mapErrorText}>
                Map not available{'\n'}
                Please configure VietMap API key
              </Text>
            </View>
          )}
        </View>

        {/* Stops Information */}
        <View style={styles.stopsContainer}>
          {/* Pickup Stop */}
          {trip.pickupStop && (
            <View style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <View style={[styles.stopIcon, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="location" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.stopHeaderText}>
                  <Text style={styles.stopTitle}>Pickup Point</Text>
                  <Text style={styles.stopName}>{trip.pickupStop.pickupPointName}</Text>
                </View>
                <View style={[
                  styles.stopStatusBadge,
                  pickupStatus === 'completed' && styles.stopStatusCompleted,
                  pickupStatus === 'arrived' && styles.stopStatusArrived,
                ]}>
                  <Text style={styles.stopStatusText}>
                    {pickupStatus === 'completed' ? 'Completed' : 
                     pickupStatus === 'arrived' ? 'Arrived' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.stopAddress}>{trip.pickupStop.address}</Text>
              <View style={styles.stopTimes}>
                <View style={styles.stopTimeRow}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.stopTimeLabel}>Planned:</Text>
                  <Text style={styles.stopTimeValue}>
                    {formatTime(trip.pickupStop.plannedAt)}
                  </Text>
                </View>
                {trip.pickupStop.arrivedAt && (
                  <View style={styles.stopTimeRow}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#4CAF50" />
                    <Text style={styles.stopTimeLabel}>Arrived:</Text>
                    <Text style={styles.stopTimeValue}>
                      {formatTime(trip.pickupStop.arrivedAt)}
                    </Text>
                  </View>
                )}
                {trip.pickupStop.departedAt && (
                  <View style={styles.stopTimeRow}>
                    <Ionicons name="arrow-forward-circle-outline" size={14} color="#2196F3" />
                    <Text style={styles.stopTimeLabel}>Departed:</Text>
                    <Text style={styles.stopTimeValue}>
                      {formatTime(trip.pickupStop.departedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Dropoff Stop */}
          {trip.dropoffStop && (
            <View style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <View style={[styles.stopIcon, { backgroundColor: '#2196F3' }]}>
                  <Ionicons name="location" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.stopHeaderText}>
                  <Text style={styles.stopTitle}>Drop-off Point</Text>
                  <Text style={styles.stopName}>{trip.dropoffStop.pickupPointName}</Text>
                </View>
                <View style={[
                  styles.stopStatusBadge,
                  dropoffStatus === 'completed' && styles.stopStatusCompleted,
                  dropoffStatus === 'arrived' && styles.stopStatusArrived,
                ]}>
                  <Text style={styles.stopStatusText}>
                    {dropoffStatus === 'completed' ? 'Completed' : 
                     dropoffStatus === 'arrived' ? 'Arrived' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.stopAddress}>{trip.dropoffStop.address}</Text>
              <View style={styles.stopTimes}>
                <View style={styles.stopTimeRow}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.stopTimeLabel}>Planned:</Text>
                  <Text style={styles.stopTimeValue}>
                    {formatTime(trip.dropoffStop.plannedAt)}
                  </Text>
                </View>
                {trip.dropoffStop.arrivedAt && (
                  <View style={styles.stopTimeRow}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#4CAF50" />
                    <Text style={styles.stopTimeLabel}>Arrived:</Text>
                    <Text style={styles.stopTimeValue}>
                      {formatTime(trip.dropoffStop.arrivedAt)}
                    </Text>
                  </View>
                )}
                {trip.dropoffStop.departedAt && (
                  <View style={styles.stopTimeRow}>
                    <Ionicons name="arrow-forward-circle-outline" size={14} color="#2196F3" />
                    <Text style={styles.stopTimeLabel}>Departed:</Text>
                    <Text style={styles.stopTimeValue}>
                      {formatTime(trip.dropoffStop.departedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    fontFamily: 'RobotoSlab-Medium',
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  childCard: {
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
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: 20,
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
  tripInfoCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripTime: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    fontFamily: 'RobotoSlab-Medium',
  },
  tripSchedule: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontFamily: 'RobotoSlab-Medium',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFDD00',
    borderRadius: 4,
  },
  mapContainer: {
    height: 600,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  mapError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  mapErrorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Medium',
  },
  busMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFDD00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  busMarkerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFDD00',
    opacity: 0.3,
  },
  stopMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stopMarkerDropoff: {
    backgroundColor: '#2196F3',
  },
  stopMarkerCompleted: {
    backgroundColor: '#9E9E9E',
  },
  stopMarkerArrived: {
    backgroundColor: '#FF9800',
  },
  stopsContainer: {
    gap: 12,
  },
  stopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopHeaderText: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
    marginBottom: 2,
  },
  stopName: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  stopStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  stopStatusCompleted: {
    backgroundColor: '#4CAF50',
  },
  stopStatusArrived: {
    backgroundColor: '#FF9800',
  },
  stopStatusText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
  },
  stopAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: 'RobotoSlab-Regular',
  },
  stopTimes: {
    gap: 6,
  },
  stopTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
  },
  stopTimeValue: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'RobotoSlab-Bold',
  },
});

