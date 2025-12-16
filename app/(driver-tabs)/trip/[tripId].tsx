import { AttendanceUpdatedEvent } from '@/lib/signalr/signalr.types';
import { tripHubService } from '@/lib/signalr/tripHub.service';
import { DriverTripDto, DriverTripStopDto } from '@/lib/trip/driverTrip.types';
import { confirmArrival, endTrip, getTripDetail, updateMultipleStopsSequence } from '@/lib/trip/trip.api';
import type { Guid } from '@/lib/types';
import { getRoute } from '@/lib/vietmap/vietmap.service';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, LineLayer, MapView, PointAnnotation, ShapeSource, type MapViewRef } from '@vietmap/vietmap-gl-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const [refreshing, setRefreshing] = useState(false);
  // Realtime bus location (updated from device GPS, not map clicks)
  const [busCoordinate, setBusCoordinate] = useState<[number, number] | null>(null);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState<DriverTripStopDto | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [routeSegments, setRouteSegments] = useState<[number, number][][]>([]);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [listKey, setListKey] = useState(0); // Key to force re-render DraggableFlatList
  const [followBus, setFollowBus] = useState(true);
  const [centerOnBusTimestamp, setCenterOnBusTimestamp] = useState<number>(0);
  const lastCameraKeyRef = useRef<string>('camera-static');

  // Helper to load trip data (used on mount and pull-to-refresh)
  const fetchTripDetail = React.useCallback(async () => {
    if (!tripId) {
      Alert.alert('Warning', 'Trip ID is missing', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    try {
      const tripData = await getTripDetail(tripId);
      setTrip(tripData);
    } catch (error: any) {
      console.error('Error loading trip:', error);
      const errorMessage = error.message === 'UNAUTHORIZED'
        ? 'You are not authorized to view this trip'
        : error.message || 'Failed to load trip';
      Alert.alert('Warning', errorMessage, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Initial load
  React.useEffect(() => {
    fetchTripDetail();
  }, [fetchTripDetail]);

  // Periodically send driver device location to TripHub (every 5 seconds)
  React.useEffect(() => {
    let isMounted = true;
    if (!tripId) return;

    const sendCurrentLocation = async () => {
      // Only send when trip is in progress and hub connected
      if (!trip || trip.status !== 'InProgress') return;
      if (!tripHubService.isConnected()) return;

      try {
        let loc: Location.LocationObject | null = null;
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });
        } catch (err) {
          console.warn('getCurrentPositionAsync failed, trying last known:', err);
          loc = await Location.getLastKnownPositionAsync({ maxAge: 5000 });
        }

        if (!loc) {
          console.warn('No location available (current or last known)');
          return;
        }

        const { latitude, longitude, speed, accuracy } = loc.coords;

        // Update bus marker on the map
        setBusCoordinate([longitude, latitude]);

        // Auto-center when follow mode is enabled
        if (followBus) {
          setCenterOnBusTimestamp(Date.now());
        }

        await tripHubService.sendLocation(
          tripId,
          latitude,
          longitude,
          speed ?? null,
          accuracy ?? null,
          Boolean(speed && speed > 0)
        );
      } catch (error) {
        console.error('❌ Error sending device location:', error);
      }
    };

    const startLocationInterval = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('⚠️ Location permission not granted');
          return;
        }

        // Send immediately
        await sendCurrentLocation();
        if (!isMounted) return;

        // Clear any existing interval before starting a new one
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
        }

        locationIntervalRef.current = setInterval(sendCurrentLocation, 5000);
      } catch (error) {
        console.error('❌ Error initializing location updates:', error);
      }
    };

    startLocationInterval();

    return () => {
      isMounted = false;
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [tripId, trip?.status, followBus]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTripDetail();
    setRefreshing(false);
  }, [fetchTripDetail]);

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

        // Join trip group to receive events
        await tripHubService.joinTrip(tripId);
        console.log('✅ Joined trip group:', tripId);

        // Subscribe to attendance update events
        tripHubService.on<AttendanceUpdatedEvent>('AttendanceUpdated', (data) => {
          console.log('🔔 Driver - Attendance updated:', JSON.stringify(data, null, 2));

          if (data.tripId === tripId) {
            // Use functional state update to avoid stale closure
            setTrip((currentTrip) => {
              if (!currentTrip) return currentTrip;

              const updatedTrip: DriverTripDto = { ...currentTrip };
              let wasUpdated = false;

              if (updatedTrip.stops) {
                updatedTrip.stops = updatedTrip.stops.map((stop) => {
                  if (stop.stopPointId !== data.stopId || !stop.attendance) {
                    return stop; // Return unchanged
                  }

                  const updatedStop: DriverTripStopDto = {
                    ...stop,
                    attendance: stop.attendance.map((student) =>
                      student.studentId === data.attendance.studentId
                        ? {
                          ...student,
                          state: data.attendance.state || student.state,
                          boardStatus: data.attendance.boardStatus ?? null,
                          alightStatus: data.attendance.alightStatus ?? null,
                          boardedAt: data.attendance.boardedAt ?? null,
                          alightedAt: data.attendance.alightedAt ?? null,
                        }
                        : student
                    ),
                  };

                  // If backend sends departedAt for this stop, update to complete the stop
                  if (data.attendance.departedAt) {
                    updatedStop.departedAt = data.attendance.departedAt;
                  }

                  if (data.attendance.arrivedAt) {
                    updatedStop.arrivedAt = data.attendance.arrivedAt;
                  }

                  wasUpdated = true;
                  return updatedStop;
                });

                console.log('✅ Driver - Updated attendance (and stop timing) in stops array');
              }

              if (wasUpdated) {
                // Recalculate completedStops based on departedAt
                const completedCount = updatedTrip.stops.filter((s) => s.departedAt).length;
                updatedTrip.completedStops = completedCount;
                // Do NOT auto-complete trip here; completion is handled via endTrip flow
                console.log(
                  '✅ Driver - Attendance update applied with completedStops:',
                  completedCount
                );
                return updatedTrip;
              }

              return currentTrip;
            });
          }
        });
        console.log('✅ TripHub initialized for trip:', tripId);
      } catch (error) {
        console.error('❌ Error initializing TripHub:', error);
      }
    };

    initializeTripHub();

    // Cleanup
    return () => {
      tripHubService.off('AttendanceUpdated');
      if (tripId) {
        tripHubService.leaveTrip(tripId).catch((error) => {
          console.error('❌ Error leaving trip:', error);
        });
      }
    };
  }, [tripId, trip?.id]);

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

        // Only keep stops that are not completed yet (no departedAt)
        const activeStops = sortedStops.filter((stop) => !stop.departedAt);

        // Check if vehicle location exists
        if (!busCoordinate) {
          setRouteSegments([]);
          console.log('ℹ️ No bus coordinate, clearing route segments');
          return;
        }

        const [longitude, latitude] = busCoordinate;

        // If all stops are completed
        if (activeStops.length === 0) {
          // For Departure trip only: show route from vehicle to school
          if (trip.tripType === 1 && trip.schoolLocation) {
            const routeToSchool = await getRoute(
              { lat: latitude, lng: longitude },
              { lat: trip.schoolLocation.latitude, lng: trip.schoolLocation.longitude },
              apiKey
            );

            if (routeToSchool && routeToSchool.coordinates.length > 0) {
              segments.push(routeToSchool.coordinates);
              console.log('✅ Route from vehicle to school (all stops completed)');
            }
          } else {
            // For Return trip: no route when all stops completed
            setRouteSegments([]);
            console.log('ℹ️ All stops completed (Return trip), clearing route segments');
            return;
          }
        } else {
          // Only connect vehicle to the FIRST incomplete stop (next stop to visit)
          const nextStop = activeStops[0];
          const routeData = await getRoute(
            { lat: latitude, lng: longitude },
            { lat: nextStop.latitude, lng: nextStop.longitude },
            apiKey
          );

          if (routeData && routeData.coordinates.length > 0) {
            segments.push(routeData.coordinates);
            console.log('✅ Route from vehicle to next stop:', nextStop.sequenceOrder);
          }

          // NO stop-to-stop connections
          // NO connection to school while stops are still active
        }

        setRouteSegments(segments);
        console.log('✅ Total route segments:', segments.length);
      } catch (error) {
        console.error('❌ Error calculating routes:', error);
        setRouteSegments([]);
      }
    };

    calculateRoutes();
  }, [trip, busCoordinate]);

  const handleArrive = async (stop: DriverTripStopDto) => {
    if (!trip) return;

    try {
      // Call API to notify parents
      await confirmArrival(trip.id, stop.stopPointId);

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
      console.log('Parents notified about arrival at:', stop.stopPointName);
    } catch (error: any) {
      console.error('Error notifying arrival:', error);
      Alert.alert('Warning', error.message || 'Failed to notify parents');
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

  const handleEndTrip = async () => {
    if (!trip || !tripId) {
      Alert.alert('Warning', 'Trip information is missing');
      return;
    }

    if (trip.status !== 'InProgress') {
      Alert.alert('Warning', 'Trip must be in progress to end it');
      return;
    }

    Alert.alert(
      'Complete Trip',
      'Are you sure you want to complete this trip?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete',
          style: 'destructive',
          onPress: async () => {
            try {
              await endTrip(tripId);
              await fetchTripDetail();
              Alert.alert('Success', 'Trip completed successfully', [
                { text: 'OK', onPress: () => router.replace('/(driver-tabs)/trips-today') },
              ]);
            } catch (error: any) {
              console.error('Error ending trip:', error);
              Alert.alert('Warning', error.message || 'Failed to complete trip. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewAttendance = (stop: DriverTripStopDto) => {
    setSelectedStop(stop);
    setShowAttendanceModal(true);
  };

  const handleDragEnd = async ({ data }: { data: DriverTripStopDto[] }) => {
    if (!trip) return;

    // Save original order to revert if needed
    const originalStops = [...trip.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    try {
      // Create a map of original stop positions by stopPointId
      const originalStopMap = new Map(
        trip.stops.map((stop, index) => [stop.stopPointId, { stop, originalIndex: index }])
      );

      // Check if any arrived stops changed position
      const arrivedStopsChanged = data.some((stop, newIndex) => {
        if (!stop.arrivedAt) return false; // Skip non-arrived stops

        const original = originalStopMap.get(stop.stopPointId);
        if (!original) return false;

        // Check if the arrived stop's position changed
        return original.originalIndex !== newIndex;
      });

      if (arrivedStopsChanged) {
        // Revert state back to original to force re-render DraggableFlatList
        setTrip({
          ...trip,
          stops: originalStops,
        });
        // Force re-render DraggableFlatList by changing key
        setListKey(prev => prev + 1);
        Alert.alert('Warning', 'Cannot reorder stops that have already been visited.');
        return;
      }

      // Update sequenceOrder for all stops based on new order
      const updatedStops = data.map((stop, index) => ({
        ...stop,
        sequenceOrder: index + 1, // sequenceOrder is 1-based
      }));

      // Prepare API request - only include non-arrived stops
      const stopsForAPI = updatedStops
        .filter(stop => !stop.arrivedAt)
        .map(stop => ({
          pickupPointId: stop.stopPointId,
          sequenceOrder: stop.sequenceOrder - 1, // Backend uses 0-based index
        }));

      // Only call API if there are stops to update
      if (stopsForAPI.length > 0) {
        // Call API to update sequence
        await updateMultipleStopsSequence(trip.id, stopsForAPI);

        // Update local state
        const updatedTrip: DriverTripDto = {
          ...trip,
          stops: updatedStops,
        };

        setTrip(updatedTrip);
        console.log('✅ Stops sequence updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating stops sequence:', error);
      Alert.alert('Warning', error.message || 'Failed to update stops sequence');
      // Revert to original order by refetching
      await fetchTripDetail();
    }
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
        centerCoordinate: [108.2022, 16.0544] as [number, number], // Default Da Nang
        zoomLevel: 12,
      };
    }

    const coordinates: [number, number][] = trip.stops.map(
      (stop) => [stop.longitude, stop.latitude] as [number, number]
    );

    // Include school location for departure trip only
    if (trip.tripType === 1 && trip.schoolLocation) {
      coordinates.push([
        trip.schoolLocation.longitude,
        trip.schoolLocation.latitude,
      ]);
    }

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

  const initialMapBounds = React.useMemo(() => {
    return getMapBounds();
  }, [getMapBounds]);

  const cameraSettings = React.useMemo(() => {
    if (followBus && centerOnBusTimestamp > 0 && busCoordinate) {
      return {
        centerCoordinate: busCoordinate,
        zoomLevel: 15,
        animationDuration: 1000,
      };
    }
    return null;
  }, [followBus, centerOnBusTimestamp, busCoordinate]);

  const cameraKey = React.useMemo(() => {
    if (followBus && centerOnBusTimestamp > 0) {
      const newKey = `camera-${centerOnBusTimestamp}`;
      lastCameraKeyRef.current = newKey;
      return newKey;
    }
    return lastCameraKeyRef.current;
  }, [followBus, centerOnBusTimestamp]);

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(driver-tabs)/trips-today')}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Progress</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
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
          {trip.supervisor && (
            <View style={styles.tripInfoRow}>
              <Ionicons name="person" size={16} color="#6B7280" />
              <Text style={styles.tripSchedule}>Supervisor: {trip.supervisor.fullName}</Text>
            </View>
          )}
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
              logoEnabled={false}
              attributionEnabled={false}
            >
              <Camera
                key={cameraKey}
                defaultSettings={cameraSettings || initialMapBounds}
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
              {/* Display all stop markers with sequence numbers */}
              {trip.stops.map((stop) => {
                return (
                  <PointAnnotation
                    key={`stop-${stop.sequenceOrder}`}
                    id={`stop-${stop.sequenceOrder}`}
                    coordinate={[stop.longitude, stop.latitude]}
                    anchor={{ x: 0.5, y: 1 }}
                  >
                    <View style={styles.stopMarkerContainer} collapsable={false}>
                      <View
                        style={[styles.stopMarkerBadge, { backgroundColor: '#C41E3A' }]}
                        collapsable={false}
                      >
                        <Text
                          style={[styles.stopMarkerNumber, { color: '#FFFFFF' }]}
                          allowFontScaling={false}
                        >
                          {stop.sequenceOrder}
                        </Text>
                      </View>
                      <View style={[styles.stopMarkerPin, { borderTopColor: '#C41E3A' }]} />
                    </View>
                  </PointAnnotation>
                );
              })}
              {/* School marker - only for departure trip (tripType === 1) */}
              {trip.tripType === 1 && trip.schoolLocation && (
                <PointAnnotation
                  id="school-location"
                  coordinate={[
                    trip.schoolLocation.longitude,
                    trip.schoolLocation.latitude,
                  ]}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={styles.schoolMarkerContainer}>
                    <Ionicons name="school" size={32} color="#2563EB" />
                  </View>
                </PointAnnotation>
              )}
              {busCoordinate && (
                <PointAnnotation
                  id="bus-pin"
                  coordinate={busCoordinate}
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

          {/* Center on Bus Button */}
          {busCoordinate && trip.status === 'InProgress' && (
            <TouchableOpacity
              style={[
                styles.centerOnBusButton,
                followBus ? styles.centerOnBusButtonActive : styles.centerOnBusButtonInactive,
              ]}
              onPress={() => {
                const nextFollow = !followBus;
                setFollowBus(nextFollow);
                if (nextFollow && busCoordinate) {
                  setCenterOnBusTimestamp(Date.now());
                }
              }}
              activeOpacity={0.8}>
              <Ionicons name="locate" size={24} color="#000000" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Floating Pickup Points Button */}
      <TouchableOpacity
        style={styles.floatingPickupButton}
        onPress={() => setShowStopsModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.floatingButtonIconContainer}>
          <Ionicons name="list" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Stops List Modal */}
      <Modal
        visible={showStopsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStopsModal(false)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Stops</Text>
                  {trip && (
                    <Text style={styles.modalStudentCount}>
                      {trip.stops.reduce((sum, stop) => sum + (stop.totalStudents || 0), 0)} students
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setShowStopsModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.draggableListContainer}>
                  <DraggableFlatList
                    key={listKey}
                    data={[...trip.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder)}
                    onDragEnd={handleDragEnd}
                    keyExtractor={(item) => item.stopPointId}
                    activationDistance={10}
                    autoscrollSpeed={50}
                    autoscrollThreshold={50}
                    renderItem={({ item, drag, isActive }: RenderItemParams<DriverTripStopDto>) => {
                      const status = getStopStatus(item);
                      const isArrived = status === 'arrived' || status === 'completed';
                      const canDrag = !isArrived && trip.status !== 'Completed';

                      return (
                        <ScaleDecorator>
                          <TouchableOpacity
                            style={[
                              styles.stopItem,
                              isActive && styles.stopItemActive,
                            ]}
                            onPress={() => {
                              // Only open attendance if not dragging
                              if (!isActive) {
                                handleViewAttendance(item);
                              }
                            }}
                            onLongPress={canDrag ? drag : undefined}
                            delayLongPress={300}
                            activeOpacity={0.7}
                            disabled={isActive}
                          >
                            <View style={styles.stopItemLeft}>
                              <View style={[styles.stopNumberBadge, { backgroundColor: getStopStatusColor(status) }]}>
                                <Text style={styles.stopNumberText}>{item.sequenceOrder}</Text>
                              </View>
                              <View style={styles.stopItemInfo}>
                                <Text style={styles.stopName}>{item.stopPointName}</Text>
                                <View style={styles.stopChipsRow}>
                                  <View style={styles.stopChip}>
                                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                                    <Text style={styles.stopChipText}>{item.totalStudents} student{item.totalStudents !== 1 ? 's' : ''}</Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                            <View style={styles.stopItemRight}>
                              <TouchableOpacity
                                style={[styles.notifyButton, isArrived && styles.notifyButtonDisabled]}
                                activeOpacity={0.7}
                                onPress={() => handleArrive(item)}
                              >
                                <Ionicons name="notifications" size={18} color={isArrived ? '#D1D5DB' : '#000000'} />
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        </ScaleDecorator>
                      );
                    }}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                  />
                </View>

                <TouchableOpacity
                  style={styles.endTripModalButton}
                  activeOpacity={0.8}
                  onPress={handleEndTrip}
                >
                  <Text style={styles.endTripModalButtonText}>Complete Trip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
      {/* Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <View style={styles.attendanceModalOverlay}>
          <View style={styles.attendanceModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.attendanceModalHeader}>
              <TouchableOpacity
                onPress={() => setShowAttendanceModal(false)}
                style={styles.attendanceCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.attendanceModalTitle}>
                {selectedStop?.stopPointName || 'Attendance'}
              </Text>
            </View>
            <ScrollView
              style={styles.attendanceModalBody}
              contentContainerStyle={styles.attendanceModalBodyContent}
              showsVerticalScrollIndicator={true}
            >
              {selectedStop?.attendance && selectedStop.attendance.length > 0 ? (
                selectedStop.attendance.map((student, index) => (
                  <View key={student.studentId} style={styles.studentItem}>
                    <View style={styles.studentInfo}>
                      <View style={styles.studentNumberBadge}>
                        <Text style={styles.studentNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.studentDetails}>
                        <Text style={styles.studentName}>{student.studentName}</Text>
                        {/* Display both board and alight status */}
                        <View style={{ flexDirection: 'column', gap: 4 }}>
                          {student.boardStatus && (
                            <View style={[
                              styles.studentStateBadge,
                              { backgroundColor: getStudentStateColor(student.boardStatus) }
                            ]}>
                              <Text style={styles.studentStateText}>
                                Board: {student.boardStatus}
                              </Text>
                            </View>
                          )}
                          {student.alightStatus && (
                            <View style={[
                              styles.studentStateBadge,
                              { backgroundColor: getStudentStateColor(student.alightStatus) }
                            ]}>
                              <Text style={styles.studentStateText}>
                                Alight: {student.alightStatus}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>

                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No attendance data</Text>
                </View>
              )}
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
const getStudentStateColor = (state: string): string => {
  const colors: Record<string, string> = {
    Present: '#10B981',
    Absent: '#EF4444',
    Boarded: '#3B82F6',
    NotBoarded: '#F59E0B',
    default: '#9CA3AF',
  };
  return colors[state] || colors.default;
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
    height: 600,
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
  schoolMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stopMarkerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  centerOnBusButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  centerOnBusButtonInactive: {
    backgroundColor: '#FFFFFF',
  },
  centerOnBusButtonActive: {
    backgroundColor: '#FFDD00',
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
    height: '80%',
    flexDirection: 'column',
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
  modalTitleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
  },
  modalTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#111827',
  },
  modalStudentCount: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#6B7280',
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
    flex: 1,
    padding: 20,
    minHeight: 0, // Important for flex children to shrink
  },
  draggableListContainer: {
    flex: 1,
    minHeight: 0, // Important for flex children to shrink
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  stopItemActive: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  stopItemDisabled: {
    opacity: 0.6,
  },
  dragHandle: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopItemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  stopItemRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',

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
  endTripModalButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endTripModalButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentNumberText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#6B7280',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  studentBoardedTime: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  studentStateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  studentStateText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },

  attendanceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  attendanceModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '70%',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  attendanceModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  attendanceModalBody: {
    flexShrink: 1,
    minHeight: 0,
  },
  attendanceModalBodyContent: {
    padding: 20,
    paddingBottom: 32,
  },
  attendanceCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  attendanceModalTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#111827',
  },
});