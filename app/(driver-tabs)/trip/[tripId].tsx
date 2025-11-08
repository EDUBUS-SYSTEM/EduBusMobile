import { driverTripMockApi } from '@/lib/trip-mock-data/driverTrip.mockApi';
import { DriverTripDto, DriverTripStopDto } from '@/lib/trip-mock-data/driverTrip.types';
import { tripHubService } from '@/lib/signalr/tripHub.service';
import type { Guid } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, MapView, PointAnnotation, type MapViewRef } from '@vietmap/vietmap-gl-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Params = { tripId?: Guid };

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getStopStatus = (stop: DriverTripStopDto): 'pending' | 'arrived' | 'completed' => {
  if (stop.departedAt) return 'completed';
  if (stop.arrivedAt) return 'arrived';
  return 'pending';
};

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams<Params>();
  const [trip, setTrip] = React.useState<DriverTripDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [clickedCoordinate, setClickedCoordinate] = useState<[number, number] | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load trip data
  React.useEffect(() => {
    if (!tripId) {
      Alert.alert('Error', 'Trip ID is missing', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    (async () => {
      try {
        const tripData = await driverTripMockApi.getById(tripId);
        if (tripData) {
          setTrip(tripData);
        } else {
          Alert.alert('Error', 'Trip not found', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load trip', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  // Initialize TripHub connection
  React.useEffect(() => {
    if (!tripId) return;

    const initializeTripHub = async () => {
      try {
        // Initialize TripHub connection
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.warn('⚠️ No access token found');
          return;
        }

        // Connect to TripHub if not already connected
        if (!tripHubService.isConnected()) {
          console.log('🔌 Initializing TripHub connection...');
          await tripHubService.initialize(token);
        }

        console.log('✅ TripHub initialized for trip:', tripId);
      } catch (error) {
        console.error('❌ Error initializing TripHub:', error);
      }
    };

    initializeTripHub();
  }, [tripId]);

  // Send location using clickedCoordinate (for testing)
  React.useEffect(() => {
    if (!tripId) return;

    let isMounted = true;

    // Clear any existing interval first
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    // Function to send location from clickedCoordinate
    const sendLocationUpdate = async () => {
      try {
        // Use clickedCoordinate instead of GPS location
        if (!clickedCoordinate) {
          console.log('⏳ Waiting for map click to set location...');
          return;
        }

        if (!isMounted || !tripHubService.isConnected()) {
          return;
        }

        // clickedCoordinate is [longitude, latitude]
        const [longitude, latitude] = clickedCoordinate;

        // For testing: use default values for speed, accuracy, isMoving
        const speed = null;
        const accuracy = null;
        const isMoving = false;

        await tripHubService.sendLocation(
          tripId,
          latitude,
          longitude,
          speed,
          accuracy,
          isMoving
        );

        console.log(`📍 Location sent from clickedCoordinate: (${latitude}, ${longitude})`);
      } catch (error) {
        console.error('❌ Error sending location:', error);
      }
    };

    // Send location immediately when clickedCoordinate changes
    if (clickedCoordinate) {
      sendLocationUpdate();

      // Set up interval to send location every 5 seconds
      locationIntervalRef.current = setInterval(() => {
        sendLocationUpdate();
      }, 5000); // 5 seconds
    }

    // Cleanup function
    return () => {
      isMounted = false;
      
      // Clear location interval
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [tripId, clickedCoordinate]);

  const handleArrive = (stop: DriverTripStopDto) => {
    if (!trip) return;

    const now = new Date().toISOString();
    const updatedStops = trip.stops.map((s) =>
      s.sequenceOrder === stop.sequenceOrder
        ? { ...s, arrivedAt: now }
        : s
    );

    const updatedTrip: DriverTripDto = {
      ...trip,
      stops: updatedStops,
      status: trip.status === 'Scheduled' ? 'InProgress' : trip.status,
      startTime: trip.status === 'Scheduled' ? now : trip.startTime,
    };

    setTrip(updatedTrip);
  };

  const handleDepart = (stop: DriverTripStopDto) => {
    if (!trip) return;

    const now = new Date().toISOString();
    const updatedStops = trip.stops.map((s) =>
      s.sequenceOrder === stop.sequenceOrder
        ? { ...s, departedAt: now }
        : s
    );

    const completedCount = updatedStops.filter((s) => s.departedAt).length;
    const updatedTrip: DriverTripDto = {
      ...trip,
      stops: updatedStops,
      completedStops: completedCount,
      status: completedCount === trip.totalStops ? 'Completed' : trip.status,
      endTime: completedCount === trip.totalStops ? now : trip.endTime,
    };

    setTrip(updatedTrip);
  };

  const handleUpdateStudents = (stop: DriverTripStopDto, present: number, absent: number) => {
    if (!trip) return;

    const updatedStops = trip.stops.map((s) =>
      s.sequenceOrder === stop.sequenceOrder
        ? { ...s, presentStudents: present, absentStudents: absent }
        : s
    );

    setTrip({ ...trip, stops: updatedStops });
  };

  const mapRef = useRef<MapViewRef>(null);

  const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
  const mapStyle = apiKey 
    ? `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`
    : undefined;

  const handleMapPress = (feature: GeoJSON.Feature) => {
    try {
      console.log('Map pressed, feature:', JSON.stringify(feature, null, 2));
      
      let longitude: number | null = null;
      let latitude: number | null = null;
      
      // Method 1: Try to get coordinates from geometry (most common case)
      if (feature.geometry) {
        if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
          const coords = feature.geometry.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            longitude = coords[0];
            latitude = coords[1];
          }
        }
      }
      
      // Method 2: Try to get coordinates from properties
      if ((!longitude || !latitude) && feature.properties) {
        const props = feature.properties as any;
        if (props.coordinates && Array.isArray(props.coordinates) && props.coordinates.length >= 2) {
          longitude = props.coordinates[0];
          latitude = props.coordinates[1];
        } else if (props.longitude !== undefined && props.latitude !== undefined) {
          longitude = props.longitude;
          latitude = props.latitude;
        } else if (props.lng !== undefined && props.lat !== undefined) {
          longitude = props.lng;
          latitude = props.lat;
        }
      }
      
      // If we got coordinates, set them
      if (longitude !== null && latitude !== null && !isNaN(longitude) && !isNaN(latitude)) {
        setClickedCoordinate([longitude, latitude]);
        console.log('✅ Map clicked at:', latitude, longitude);
      } else {
        console.warn('⚠️ Could not extract coordinates from feature:', feature);
      }
    } catch (error) {
      console.error('❌ Error handling map press:', error);
    }
  };

  const handleMapLongPress = (feature: GeoJSON.Feature) => {
    // Also handle long press as fallback
    handleMapPress(feature);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading trip...</Text>
        </View>
      </View>
    );
  }

  if (!trip) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFDD00', '#FFDD00']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.content}>
        {/* Trip Info Card */}
        <View style={styles.tripInfoCard}>
          <View style={styles.tripInfoRow}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.tripTime}>
              {formatTime(trip.plannedStartAt)} → {formatTime(trip.plannedEndAt)}
            </Text>
          </View>
          <View style={styles.tripInfoRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.tripSchedule}>{trip.scheduleName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
            <Text style={styles.statusText}>{trip.status}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(trip.completedStops / trip.totalStops) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {trip.completedStops} / {trip.totalStops} stops completed
          </Text>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          {mapStyle ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              mapStyle={mapStyle}
              onPress={handleMapPress}
              onLongPress={handleMapLongPress}
            >
              <Camera
                defaultSettings={{
                  centerCoordinate: [108.2022, 16.0544], // Đà Nẵng coordinates [longitude, latitude]
                  zoomLevel: 12,
                  animationDuration: 0, // No animation on initialization
                }}
              />
              {clickedCoordinate && (
                <PointAnnotation
                  id="clicked-pin"
                  coordinate={clickedCoordinate}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={styles.pinContainer}>
                    <Ionicons name="location" size={32} color="#FFDD00" />
                  </View>
                </PointAnnotation>
              )}
            </MapView>
          ) : (
            <View style={styles.mapError}>
              <Text style={styles.mapErrorText}>
                ⚠️ VietMap API key not configured.{'\n'}
                Please set EXPO_PUBLIC_VIETMAP_API_KEY in your .env file.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    Scheduled: '#E8F5E8',
    InProgress: '#E3F2FD',
    Completed: '#F3E5F5',
    Delayed: '#FFF3E0',
    Cancelled: '#FFEBEE',
  };
  return colors[status] || '#F3F4F6';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'RobotoSlab-Bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tripInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FFDD00',
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripTime: {
    marginLeft: 8,
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#374151',
  },
  tripSchedule: {
    marginLeft: 8,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#4B5563',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 12,
    color: '#111827',
  },
  progressContainer: {
    marginBottom: 20,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  mapError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 20,
  },
  mapErrorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Regular',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

