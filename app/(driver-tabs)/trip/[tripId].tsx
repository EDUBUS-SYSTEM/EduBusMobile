import { tripHubService } from '@/lib/signalr/tripHub.service';
import { DriverTripDto, DriverTripStopDto } from '@/lib/trip/driverTrip.types';
import { confirmArrival, getTripDetail } from '@/lib/trip/trip.api';
import type { Guid } from '@/lib/types';
import { getRoute } from '@/lib/vietmap/vietmap.service';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, LineLayer, MapView, PointAnnotation, ShapeSource, type MapViewRef } from '@vietmap/vietmap-gl-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [routeSegments, setRouteSegments] = useState<[number, number][][]>([]);
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
        const tripData = await getTripDetail(tripId);
        setTrip(tripData);
      } catch (error: any) {
        console.error('Error loading trip:', error);
        const errorMessage = error.message === 'UNAUTHORIZED'
          ? 'You are not authorized to view this trip'
          : error.message || 'Failed to load trip';
        Alert.alert('Error', errorMessage, [
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

  // Calculate routes between all stops in sequence
  React.useEffect(() => {
    const calculateRoutes = async () => {
      if (!trip) {
        setRouteSegments([]);
        return;
      }

      try {
        const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
        if (!apiKey) {
          console.warn('VietMap API key not configured');
          setRouteSegments([]);
          return;
        }

        // Sort stops by sequence order
        const sortedStops = [...trip.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        const segments: [number, number][][] = [];

        // Calculate route from vehicle to first pending stop (if vehicle location exists)
        if (clickedCoordinate) {
          const firstPendingStop = sortedStops.find((stop) => !stop.departedAt);
          if (firstPendingStop) {
            const [longitude, latitude] = clickedCoordinate;
            const routeData = await getRoute(
              { lat: latitude, lng: longitude },
              { lat: firstPendingStop.latitude, lng: firstPendingStop.longitude },
              apiKey
            );
            if (routeData && routeData.coordinates.length > 0) {
              segments.push(routeData.coordinates);
              console.log('✅ Route from vehicle to stop', firstPendingStop.sequenceOrder);
            }
          }
        }

        // Calculate routes between consecutive stops
        for (let i = 0; i < sortedStops.length - 1; i++) {
          const currentStop = sortedStops[i];
          const nextStop = sortedStops[i + 1];

          const routeData = await getRoute(
            { lat: currentStop.latitude, lng: currentStop.longitude },
            { lat: nextStop.latitude, lng: nextStop.longitude },
            apiKey
          );

          if (routeData && routeData.coordinates.length > 0) {
            segments.push(routeData.coordinates);
            console.log(`✅ Route from stop ${currentStop.sequenceOrder} to stop ${nextStop.sequenceOrder}`);
          }
        }

        setRouteSegments(segments);
        console.log('✅ Total route segments:', segments.length);
      } catch (error) {
        console.error('❌ Error calculating routes:', error);
        setRouteSegments([]);
      }
    };

    calculateRoutes();
  }, [trip, clickedCoordinate]);

  const handleArrive = async (stop: DriverTripStopDto) => {
    if (!trip) return;

    try {
      // Call API to notify parents
      await confirmArrival(trip.id, stop.pickupPointId);

      // Update local state
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
      console.log('Parents notified about arrival at:', stop.pickupPointName);
    } catch (error: any) {
      console.error('Error notifying arrival:', error);
      Alert.alert('Error', error.message || 'Failed to notify parents');
    }
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

  // Calculate map bounds to fit all stops
  const getMapBounds = React.useCallback(() => {
    if (!trip || !trip.stops || trip.stops.length === 0) {
      return {
        centerCoordinate: [108.2022, 16.0544] as [number, number], // Default Đà Nẵng
        zoomLevel: 12,
      };
    }

    const coordinates = trip.stops.map((stop) => [stop.longitude, stop.latitude] as [number, number]);
    
    // Calculate bounds
    const lngs = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    
    // Calculate center
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    
    // Calculate zoom level (simple approximation)
    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lngDiff, latDiff);
    
    // Increased zoom levels for closer view
    let zoomLevel = 14;
    if (maxDiff > 0.1) zoomLevel = 12;
    else if (maxDiff > 0.05) zoomLevel = 13;
    else if (maxDiff > 0.02) zoomLevel = 14;
    else if (maxDiff > 0.01) zoomLevel = 15;
    else zoomLevel = 16;
    
    return {
      centerCoordinate: [centerLng, centerLat] as [number, number],
      zoomLevel,
    };
  }, [trip]);

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
                  centerCoordinate: [108.2022, 16.0544] as [number, number], // Default Đà Nẵng
                  zoomLevel: 12,
                  animationDuration: 0,
                }}
                centerCoordinate={getMapBounds().centerCoordinate}
                zoomLevel={getMapBounds().zoomLevel}
                animationDuration={trip ? 500 : 0}
              />
              {/* Routes between all stops in sequence - placed before markers to avoid covering them */}
              {routeSegments.map((segment, index) => (
                <ShapeSource
                  key={`route-segment-${index}`}
                  id={`route-source-${index}`}
                  shape={{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: segment,
                    },
                  }}>
                  <LineLayer
                    id={`route-layer-${index}`}
                    style={{
                      lineColor: '#3B82F6',
                      lineWidth: 6,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </ShapeSource>
              ))}
              {/* Display all stop markers */}
              {trip.stops.map((stop) => {
                return (
                  <PointAnnotation
                    key={`stop-${stop.sequenceOrder}`}
                    id={`stop-${stop.sequenceOrder}`}
                    coordinate={[stop.longitude, stop.latitude]}
                    anchor={{ x: 0.5, y: 1 }}
                  >
                    <View style={styles.stopMarkerContainer}>
                      <Ionicons name="location" size={40} color="#C41E3A" />
                    </View>
                  </PointAnnotation>
                );
              })}
              {clickedCoordinate && (
                <PointAnnotation
                  id="clicked-pin"
                  coordinate={clickedCoordinate}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={styles.pinContainer}>
                    <Ionicons name="bus" size={28} color="#000000" />
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

      {/* Floating Pickup Points Button */}
      <TouchableOpacity
        style={styles.floatingPickupButton}
        onPress={() => setShowStopsModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.floatingButtonIconContainer}>
          <Ionicons name="list" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.floatingButtonBadge}>
          <Text style={styles.floatingButtonBadgeText}>{trip.totalStops}</Text>
        </View>
      </TouchableOpacity>

      {/* Stops List Modal */}
      <Modal
        visible={showStopsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStopsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pickup Points</Text>
              <TouchableOpacity
                onPress={() => setShowStopsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              {trip.stops.map((stop) => {
                const status = getStopStatus(stop);
                const isArrived = status === 'arrived' || status === 'completed';
                return (
                  <View key={stop.sequenceOrder} style={styles.stopItem}>
                    <View style={styles.stopItemLeft}>
                      <View style={[styles.stopNumberBadge, { backgroundColor: getStopStatusColor(status) }]}>
                        <Text style={styles.stopNumberText}>{stop.sequenceOrder}</Text>
                      </View>
                      <View style={styles.stopItemInfo}>
                        <Text style={styles.stopName}>{stop.pickupPointName}</Text>
                        <View style={styles.stopChipsRow}>
                          <View style={styles.stopChip}>
                            <Ionicons name="time-outline" size={14} color="#6B7280" />
                            <Text style={styles.stopChipText}>{formatTime(stop.plannedAt)}</Text>
                          </View>
                          {Array.isArray((stop as any).students) && (stop as any).students.length > 0 && (
                            <View style={styles.stopChip}>
                              <Ionicons name="people-outline" size={14} color="#6B7280" />
                              <Text style={styles.stopChipText} numberOfLines={1}>
                                {(stop as any).students.map((s: any) => s.studentName).join(', ')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.stopItemRight}>
                      <TouchableOpacity
                        style={[styles.notifyButton, isArrived && styles.notifyButtonDisabled]}
                        //disabled={isArrived}
                        activeOpacity={0.7}
                        onPress={() => handleArrive(stop)}
                      >
                        <Ionicons name="notifications" size={18} color={isArrived ? '#D1D5DB' : '#000000'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

const getStopStatusColor = (status: 'pending' | 'arrived' | 'completed'): string => {
  const colors = {
    pending: '#9CA3AF',
    arrived: '#3B82F6',
    completed: '#10B981',
  };
  return colors[status];
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
    position: 'relative',
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
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
    backgroundColor: '#FFDD00',
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stopMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stopMarkerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stopMarkerNumber: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  stopMarkerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  floatingPickupButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  floatingButtonBadgeText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#111827',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stopItemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  stopItemRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  stopNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  stopItemInfo: {
    flex: 1,
  },
  stopName: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  stopChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  stopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    maxWidth: '100%',
  },
  stopChipText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 6,
    maxWidth: 200,
  },
  stopStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  stopStatusBadgeText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFDD00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notifyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  notifyButtonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  notifyButtonTextDisabled: {
    color: '#D1D5DB',
  },
});