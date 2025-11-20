import { tripHubService } from '@/lib/signalr/tripHub.service';
import type { ParentTripDto } from '@/lib/trip/parentTrip.types';
import { getParentTripDetail } from '@/lib/trip/trip.api';
import type { Guid } from '@/lib/types';
import { getRoute } from '@/lib/vietmap/vietmap.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateTrip } from '@/store/slices/parentTodaySlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, LineLayer, MapView, PointAnnotation, ShapeSource, type MapViewRef } from '@vietmap/vietmap-gl-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

type VehicleInfo = {
  id?: Guid;
  maskedPlate: string;
  capacity: number;
  status?: string;
};

type ParentTripWithVehicle = ParentTripDto & {
  vehicle?: VehicleInfo;
};

export default function ParentTripTrackingScreen() {
  const { tripId } = useLocalSearchParams<Params>();
  const dispatch = useAppDispatch();
  const tripsFromStore = useAppSelector((state) => state.parentToday.trips);
  const [trip, setTrip] = useState<ParentTripWithVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [busLocation, setBusLocation] = useState<[number, number] | null>(null);
  const [cameraCenter, setCameraCenter] = useState<[number, number] | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const mapRef = useRef<MapViewRef>(null);
  const hasRealtimeRef = useRef(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Load trip data - check Redux store first, then fetch from API if not found
  useEffect(() => {
    if (!tripId) {
      Alert.alert('Error', 'Trip ID is missing', [
        { text: 'OK', onPress: () => router.replace('/(parent-tabs)/trips/today') },
      ]);
      return;
    }

    (async () => {
      try {
        // First, check if trip exists in Redux store
        let tripData: ParentTripDto | null | undefined = tripsFromStore.find(t => t.id === tripId);

        // If not in store, fetch from API
        if (!tripData) {
          tripData = await getParentTripDetail(tripId);
          // Cache trip detail in Redux store
          if (tripData) {
            dispatch(updateTrip(tripData));
          }
        }

        if (tripData) {
          setTrip(tripData);
        } else {
          Alert.alert('Error', 'Trip not found', [
            { text: 'OK', onPress: () => router.replace('/(parent-tabs)/trips/today') },
          ]);
        }
      } catch (error: any) {
        console.error('Error loading trip:', error);
        const errorMessage = error.message === 'UNAUTHORIZED'
          ? 'Session expired. Please login again.'
          : error.message || 'Failed to load trip';
        Alert.alert('Error', errorMessage, [
          { text: 'OK', onPress: () => router.replace('/(parent-tabs)/trips/today') },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId, tripsFromStore, dispatch]);

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
          if (location.tripId === tripId && trip) {
            const newLocation: [number, number] = [location.longitude, location.latitude];

            hasRealtimeRef.current = true;
            setBusLocation(newLocation);
            setCameraCenter(newLocation);

            // Update Redux store to sync with list screen
            // Note: We only update location-related data here, not the full trip object
            // The trip object structure doesn't include location, so we just update the trip
            // to trigger a re-render in list screen if needed
            dispatch(updateTrip({
              ...trip,
              // Location updates don't change trip data structure,
              // but updating Redux ensures list screen stays in sync
            }));
          }
        });

        console.log('✅ TripHub initialized for trip tracking:', tripId);
      } catch (error) {
        console.error('❌ Error initializing TripHub:', error);
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
  }, [tripId,trip, dispatch]);

  useEffect(() => {
    console.log('🚌 Bus location:', busLocation);
  }, [busLocation]);

  const pickupStatus = trip ? getStopStatus(trip.pickupStop) : 'pending';
  const dropoffStatus = trip ? getStopStatus(trip.dropoffStop) : 'pending';

  useEffect(() => {
    const fetchRouteToPickup = async () => {
      if (
        trip?.status !== 'InProgress' ||
        !busLocation ||
        !trip.pickupStop?.latitude ||
        !trip.pickupStop?.longitude ||
        pickupStatus === 'completed'
      ) {
        setRouteCoordinates(null);
        return;
      }

      setIsLoadingRoute(true);
      try {
        const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
        if (!apiKey) {
          console.warn('VietMap API key not configured');
          return;
        }


        const [longitude, latitude] = busLocation;

        const routeData = await getRoute(
          { lat: latitude, lng: longitude }, // Vị trí hiện tại của xe
          { lat: trip.pickupStop.latitude, lng: trip.pickupStop.longitude }, // Điểm đón
          apiKey
        );

        if (routeData) {
          setRouteCoordinates(routeData.coordinates);
          console.log('✅ Route fetched:', routeData.coordinates.length, 'points');
        } else {
          setRouteCoordinates(null);
        }
      } catch (error) {
        console.error('❌ Error fetching route:', error);
        setRouteCoordinates(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRouteToPickup();
  }, [busLocation, trip?.pickupStop, trip?.status, pickupStatus]);

  const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
  const mapStyle = apiKey
    ? `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`
    : undefined;

  // Center map on bus location or default location
  const getMapCenter = (): [number, number] => {
    if (busLocation) return busLocation;
    // Default to Da Nang
    return [108.2022, 16.0544];
  };

  const busPointKey = useMemo(() => {
    if (!busLocation) return 'bus';
    const [lon, lat] = busLocation;
    return `bus-${lon.toFixed(6)}-${lat.toFixed(6)}`;
  }, [busLocation]);

  const calculateMapBounds = (): { center: [number, number], zoom: number } => {
    const points: [number, number][] = [];

    // Add bus location if available
    if (busLocation) {
      points.push(busLocation);
    }

    // Add pickup point if coordinates available
    if (trip?.pickupStop?.latitude && trip.pickupStop.longitude) {
      points.push([trip.pickupStop.longitude, trip.pickupStop.latitude]);
    }

    // Add dropoff point if coordinates are available
    if (trip?.dropoffStop?.latitude && trip.dropoffStop.longitude) {
      points.push([trip.dropoffStop.longitude, trip.dropoffStop.latitude]);
    }

    if (points.length === 0) {
      return { center: [108.2022, 16.0544], zoom: 13 }; // Default Đà Nẵng
    }

    if (points.length === 1) {
      return { center: points[0], zoom: 14 };
    }

    //Calculate center and zoom to fit all points
    const lons = points.map(p => p[0]);
    const lats = points.map(p => p[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const center: [number, number] = [
      (minLon + maxLon) / 2,
      (minLat + maxLat) / 2
    ];

    // calculate zoom base distance
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);

    let zoom = 13;
    if (maxDiff > 0.1) zoom = 11;
    else if (maxDiff > 0.05) zoom = 12;
    else if (maxDiff > 0.01) zoom = 13;
    else zoom = 14;

    return { center, zoom };
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

        {/* Trip Info */}
        <View style={styles.tripInfoCard}>
          {/* Child Info */}
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
          </View>

          <View style={styles.tripInfoDivider} />

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
                  centerCoordinate: calculateMapBounds().center,
                  zoomLevel: calculateMapBounds().zoom,
                  animationDuration: 0,
                }}
                centerCoordinate={cameraCenter || calculateMapBounds().center}
                zoomLevel={cameraCenter ? 14 : calculateMapBounds().zoom}
                animationDuration={cameraCenter ? 1000 : 0}
              />

              {routeCoordinates && routeCoordinates.length > 0 && (
                <ShapeSource
                  id="route-source"
                  shape={{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: routeCoordinates,
                    },
                  }}>
                  <LineLayer
                    id="route-layer"
                    style={{
                      lineColor: '#3B82F6',
                      lineWidth: 8,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </ShapeSource>
              )}
              {/* Bus Location Marker */}
              {busLocation && trip.status === 'InProgress' && (
                <PointAnnotation
                  id="bus-location"
                  key={busPointKey}
                  coordinate={busLocation}
                  anchor={{ x: 0.5, y: 0.5 }}
                  onSelected={() => console.log('🚌 Bus marker selected')}
                  onDeselected={() => console.log('🚌 Bus marker deselected')}>
                  <View style={styles.busMarker}>
                    <View style={styles.busMarkerPulse} />
                    <Ionicons name="bus" size={32} color="#000000" style={{ zIndex: 10 }} />
                  </View>
                </PointAnnotation>
              )}


              {/* Pickup Point Marker */}
              {trip.pickupStop && trip.pickupStop.latitude && trip.pickupStop.longitude && (
                <PointAnnotation
                  id="pickup-point"
                  coordinate={[trip.pickupStop.longitude, trip.pickupStop.latitude]}
                  anchor={{ x: 0.5, y: 1 }}>
                  <View style={[
                    styles.stopMarker,
                    pickupStatus === 'completed' && styles.stopMarkerCompleted,
                    pickupStatus === 'arrived' && styles.stopMarkerArrived,
                  ]}>
                    <Ionicons
                      name={pickupStatus === 'completed' ? 'checkmark-circle' : 'location'}
                      size={24}
                      color="#4CAF50"
                    />
                  </View>
                </PointAnnotation>
              )}

              {/* Dropoff Point Marker */}
              {trip.dropoffStop && trip.dropoffStop.latitude && trip.dropoffStop.longitude && (
                <PointAnnotation
                  id="dropoff-point"
                  coordinate={[trip.dropoffStop.longitude, trip.dropoffStop.latitude]}
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
      </ScrollView>

      {/* Floating Driver Info Button */}
      {trip.driver && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowDriverModal(true)}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="account-tie" size={30} color="#FFFFFF" />
          <Text style={styles.floatingButtonLabel}>Driver</Text>
        </TouchableOpacity>
      )}

      {/* Driver Info Modal */}
      <Modal
        visible={showDriverModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDriverModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDriverModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Driver</Text>
              <TouchableOpacity
                onPress={() => setShowDriverModal(false)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {trip.driver && (
              <View style={styles.modalBody}>
                <View style={styles.modalDriverAvatarContainer}>
                  <View style={[styles.modalDriverAvatar, styles.avatarPlaceholder]}>
                    <MaterialCommunityIcons name="account-tie" size={80} color="#6B7280" />
                  </View>
                </View>

                <View style={styles.modalDriverInfo}>
                  <Text style={styles.modalDriverName}>{trip.driver.fullName}</Text>

                  {/* Vehicle Info */}
                  {trip.vehicle && (
                    <View style={styles.vehicleInfoContainer}>
                      <View style={styles.vehicleInfoItem}>
                        <View style={styles.vehicleInfoIcon}>
                          <Ionicons name="car" size={18} color="#6B7280" />
                        </View>
                        <View style={styles.vehicleInfoText}>
                          <Text style={styles.vehicleInfoLabel}>Vehicle</Text>
                          <Text style={styles.vehicleInfoValue}>
                            {trip.vehicle.maskedPlate}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.vehicleInfoDivider} />
                      <View style={styles.vehicleInfoItem}>
                        <View style={styles.vehicleInfoIcon}>
                          <Ionicons name="people" size={18} color="#6B7280" />
                        </View>
                        <View style={styles.vehicleInfoText}>
                          <Text style={styles.vehicleInfoLabel}>Capacity</Text>
                          <Text style={styles.vehicleInfoValue}>
                            {trip.vehicle.capacity} seats
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => {
                      // Handle call action
                      Alert.alert('Call', `Do you want to call ${trip.driver?.fullName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Call', onPress: () => {
                            // Implement call functionality
                            console.log('Calling:', trip.driver?.phone);
                          }
                        },
                      ]);
                    }}>
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>{trip.driver.phone}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusCardLabel: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
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
  tripInfoDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
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
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    paddingVertical: 8,
  },
  floatingButtonLabel: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalDriverAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalDriverAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  modalDriverInfo: {
    alignItems: 'center',
  },
  modalDriverName: {
    fontSize: 24,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    marginBottom: 24,
    textAlign: 'center',
  },
  vehicleInfoContainer: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 16,
  },
  vehicleInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  vehicleInfoDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  vehicleInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleInfoText: {
    flex: 1,
  },
  vehicleInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
    marginBottom: 2,
  },
  vehicleInfoValue: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'RobotoSlab-Bold',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  modalInfoLabel: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
  },
  modalInfoValue: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    flex: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    marginLeft: 8,
  },
});