import { StudentAvatar } from '@/components/StudentAvatar';
import { UserAvatar } from '@/components/UserAvatar';
import { AttendanceUpdatedEvent, StopsReorderedEvent, TripStatusChangedEvent } from '@/lib/signalr/signalr.types';
import { tripHubService } from '@/lib/signalr/tripHub.service';
import { DriverTripStatus } from '@/lib/trip/driverTrip.types';
import type { ParentTripChild, ParentTripDto } from '@/lib/trip/parentTrip.types';
import { getParentTripDetail } from '@/lib/trip/trip.api';
import { TripType } from '@/lib/trip/trip.response.types';
import type { Guid } from '@/lib/types';
import { getRoute } from '@/lib/vietmap/vietmap.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateTrip } from '@/store/slices/parentTodaySlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, LineLayer, MapView, PointAnnotation, ShapeSource, type MapViewRef } from '@vietmap/vietmap-gl-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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
  recordedAt?: string;
}

interface StopArrivalUpdate {
  tripId: string;
  stopId: string;
  arrivedAt: string;
}

interface ApproachingStop {
  id: string;
  name: string;
  sequence: number;
  distance: number;
  childrenNames: string;
}

const formatTime = (iso: string) => {
  if (!iso) return '--:--';
  try {
    const date = new Date(iso);
    const vnTimeString = date.toLocaleString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    return vnTimeString;
  } catch {
    return '--:--';
  }
};

const formatPlannedTime = (iso: string) => {
  if (!iso) return '--:--';
  try {
    const timeMatch = iso.match(/T(\d{2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`;
    }
    return '--:--';
  } catch {
    return '--:--';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'InProgress':
      return '#4CAF50';
    case 'Completed':
      return '#2196F3';
    case 'Scheduled':
      return '#FF9800';
    case 'Cancelled':
      return '#F44336';
    case 'Delayed':
      return '#FF5722';
    default:
      return '#9E9E9E';
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

type ChildStatusDisplay = {
  label: string;
  backgroundColor: string;
  textColor: string;
  subtitle?: string;
};

const getChildStateDisplay = (child: ParentTripChild, tripType?: TripType): ChildStatusDisplay => {
  const state = child.state;

  if (state === 'Absent') {
    return {
      label: 'Absent',
      backgroundColor: '#EF4444',
      textColor: '#FFFFFF',
      subtitle: 'Marked as absent'
    };
  }

  if (state === 'Alighted') {
    return {
      label: 'Dropped off',
      backgroundColor: '#2563EB',
      textColor: '#FFFFFF',
      subtitle: child.alightedAt ? `At ${formatTime(child.alightedAt)}` : 'Trip completed'
    };
  }

  if (state === 'Boarded' || state === 'Present') {
    return {
      label: 'Boarded',
      backgroundColor: '#4CAF50',
      textColor: '#FFFFFF',
      subtitle: child.boardedAt ? `At ${formatTime(child.boardedAt)}` : undefined
    };
  }

  if (state === 'Pending' || state === 'Scheduled') {
    return {
      label: 'Waiting to board',
      backgroundColor: '#9CA3AF',
      textColor: '#FFFFFF'
    };
  }

  return {
    label: state || 'Pending',
    backgroundColor: '#9CA3AF',
    textColor: '#FFFFFF'
  };
};

const getStopStatus = (stop: ParentTripDto['pickupStop'] | ParentTripDto['dropoffStop']) => {
  if (!stop) return 'pending';
  if (stop.departedAt) return 'completed';
  if (stop.arrivedAt) return 'arrived';
  return 'pending';
};

//Find current active stop not yet completed with lowest sequence
const getCurrentActiveStop = (stops?: { id: string; name: string; sequence: number; actualDeparture?: string; attendance?: ParentTripChild[]; address: string }[]) => {
  if (!stops || stops.length === 0) return null;

  // Find first stop without actualDeparture not yet departed
  const activeStop = stops.find(stop => !stop.actualDeparture);
  return activeStop || null;
};

// Check if all pickup stops are completed
const areAllPickupsCompleted = (stops?: { actualDeparture?: string }[]) => {
  if (!stops || stops.length === 0) return false;

  return stops.every(stop => stop.actualDeparture);
};

type VehicleInfo = {
  id?: Guid;
  maskedPlate: string;
  capacity: number;
  status?: string;
};

type ParentTripWithVehicle = ParentTripDto & {
  vehicle?: VehicleInfo;
  pickupStop?: {
    sequenceOrder?: number;
    pickupPointName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    arrivedAt?: string;
    departedAt?: string;
    actualArrival?: string;
    actualDeparture?: string;
  };
  dropoffStop?: {
    sequenceOrder?: number;
    pickupPointName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    arrivedAt?: string;
    departedAt?: string;
    actualArrival?: string;
    actualDeparture?: string;
  };
};

export default function ParentTripTrackingScreen() {
  const { tripId } = useLocalSearchParams<Params>();
  const dispatch = useAppDispatch();
  const tripsFromStore = useAppSelector((state) => state.parentToday.trips);
  const [trip, setTrip] = useState<ParentTripWithVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [busLocation, setBusLocation] = useState<[number, number] | null>(null);
  const [centerOnBusTimestamp, setCenterOnBusTimestamp] = useState<number>(0);
  const [followBus, setFollowBus] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<Guid | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef<MapViewRef>(null);
  const hasRealtimeRef = useRef(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [approachingStops, setApproachingStops] = useState<ApproachingStop[]>([]);
  const childStatusList = useMemo<ParentTripChild[]>(() => {
    if (trip?.children && trip.children.length > 0) {
      return trip.children;
    }

    if (trip?.childId && trip.childName) {
      return [{
        id: trip.childId,
        name: trip.childName,
      }];
    }

    return [];
  }, [trip?.children, trip?.childId, trip?.childName]);

  // Currently selected child, resolved from latest trip.children for realtime updates
  const selectedChild = useMemo<ParentTripChild | null>(() => {
    if (!selectedChildId || !trip?.children) return null;
    return trip.children.find((c) => c.id === selectedChildId) ?? null;
  }, [selectedChildId, trip?.children]);

  // Find the stop that contains the selected child
  const selectedChildStop = useMemo(() => {
    if (!selectedChild || !trip?.stops) return null;

    return trip.stops.find(stop =>
      stop.attendance?.some(att => att.id === selectedChild.id)
    ) ?? null;
  }, [selectedChild, trip?.stops]);

  const hasAllChildrenBoardStatus = useMemo(() => {
    if (!childStatusList || childStatusList.length === 0) return false;
    return childStatusList.every(child => child.boardStatus != null);
  }, [childStatusList]);

  const loadTrip = useCallback(async () => {
    if (!tripId) {
      Alert.alert('Error', 'Trip ID is missing', [
        { text: 'OK', onPress: () => router.replace('/(parent-tabs)/trips/today') },
      ]);
      return;
    }

    try {
      setLoading(true);

      const tripData = await getParentTripDetail(tripId);

      if (tripData) {
        setTrip(tripData);
        dispatch(updateTrip(tripData));
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
  }, [tripId, dispatch]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrip();
    setRefreshing(false);
  }, [loadTrip]);


  useEffect(() => {
    if (
      trip?.currentLocation &&
      typeof trip.currentLocation.longitude === 'number' &&
      typeof trip.currentLocation.latitude === 'number' &&
      !hasRealtimeRef.current
    ) {
      setBusLocation([trip.currentLocation.longitude, trip.currentLocation.latitude]);
    }
  }, [trip?.currentLocation, trip?.id]);


  useEffect(() => {
    if (!tripId || !trip || trip.status !== 'InProgress') return;
    const hasMultipleStops = (trip.stops?.length ?? 0) > 1;

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

        await tripHubService.joinTrip(tripId);
        tripHubService.onLocationUpdate<LocationUpdate>((location) => {
          if (location.tripId === tripId && trip) {
            const newLocation: [number, number] = [location.longitude, location.latitude];

            hasRealtimeRef.current = true;
            setBusLocation(newLocation);
            // Auto-center when follow mode is enabled
            if (followBus) {
              setCenterOnBusTimestamp(Date.now());
            }

            dispatch(updateTrip({
              ...trip,
              currentLocation: {
                latitude: location.latitude,
                longitude: location.longitude,
                recordedAt: location.recordedAt,
                speed: location.speed ?? undefined,
                accuracy: location.accuracy ?? undefined,
                isMoving: location.isMoving,
              },
            }));
          }
        });

        // Subscribe stop arrival event
        tripHubService.on<StopArrivalUpdate>('StopArrivalConfirmed', (data) => {
          console.log('🚏 Stop arrival confirmed:', data);

          if (data.tripId === tripId && trip) {
            // Update trip data with arrival time
            const updatedTrip = { ...trip };
            let wasUpdated = false;

            // Update stops array if exists
            if (updatedTrip.stops) {
              const stopIndex = updatedTrip.stops.findIndex(stop => stop.id === data.stopId);
              if (stopIndex !== -1) {
                updatedTrip.stops = updatedTrip.stops.map(stop =>
                  stop.id === data.stopId
                    ? { ...stop, actualArrival: data.arrivedAt }
                    : stop
                );
                wasUpdated = true;
                console.log('Updated stops array with arrival time');

                // Also update pickupStop or dropoffStop if they match this stop's sequence
                const arrivedStop = updatedTrip.stops[stopIndex];

                if (updatedTrip.pickupStop?.sequenceOrder === arrivedStop.sequence) {
                  updatedTrip.pickupStop = {
                    ...updatedTrip.pickupStop,
                    arrivedAt: data.arrivedAt,
                  };
                  console.log('Updated pickup stop arrival time');
                }

                if (updatedTrip.dropoffStop?.sequenceOrder === arrivedStop.sequence) {
                  updatedTrip.dropoffStop = {
                    ...updatedTrip.dropoffStop,
                    arrivedAt: data.arrivedAt,
                  };
                  console.log('Updated dropoff stop arrival time');
                }
              }
            }

            if (wasUpdated) {
              // Update local state
              setTrip(updatedTrip);

              // Update Redux store
              dispatch(updateTrip(updatedTrip));

              console.log('Trip state updated with stop arrival');
            }
          }
        });
        // Subscribe to attendance update events
        tripHubService.on<AttendanceUpdatedEvent>('AttendanceUpdated', (data) => {
          console.log('Attendance updated:', JSON.stringify(data, null, 2));

          if (data.tripId === tripId && trip) {
            const updatedTrip = { ...trip };
            let wasUpdated = false;
            const stopArrivedAt = data.arrivedAt ?? data.attendance.arrivedAt;
            const stopDepartedAt = data.departedAt ?? data.attendance.departedAt;

            // Update children array if exists
            if (updatedTrip.children) {
              const childIndex = updatedTrip.children.findIndex(
                c => c.id === data.attendance.studentId
              );

              if (childIndex !== -1) {
                updatedTrip.children = updatedTrip.children.map(child =>
                  child.id === data.attendance.studentId
                    ? {
                      ...child,
                      state: data.attendance.state,
                      boardStatus: data.attendance.boardStatus,
                      alightStatus: data.attendance.alightStatus,
                      boardedAt: data.attendance.boardedAt,
                      alightedAt: data.attendance.alightedAt,
                    }
                    : child
                );
                wasUpdated = true;
                console.log('Updated child attendance in children array');
              }
            }

            // Update stops array attendance if exists 
            if (updatedTrip.stops) {
              let updatedStopSequence: number | undefined;

              updatedTrip.stops = updatedTrip.stops.map((stop) => {
                if (stop.id !== data.stopId || !stop.attendance) {
                  return stop; // Return unchanged
                }

                let stopChanged = false;

                const updatedAttendance = stop.attendance.map(att =>
                  att.id === data.attendance.studentId
                    ? {
                      ...att,
                      state: data.attendance.state,
                      boardStatus: data.attendance.boardStatus,
                      alightStatus: data.attendance.alightStatus,
                      boardedAt: data.attendance.boardedAt,
                      alightedAt: data.attendance.alightedAt,
                    }
                    : att
                );

                if (updatedAttendance !== stop.attendance) {
                  stopChanged = true;
                }

                const updatedStop = {
                  ...stop,
                  ...(stopArrivedAt !== undefined ? { actualArrival: stopArrivedAt ?? undefined } : {}),
                  ...(stopDepartedAt !== undefined ? { actualDeparture: stopDepartedAt ?? undefined } : {}),
                  attendance: updatedAttendance,
                };

                if (stopArrivedAt !== undefined || stopDepartedAt !== undefined) {
                  stopChanged = true;
                }

                if (stopChanged) {
                  updatedStopSequence = stop.sequence;
                  wasUpdated = true;
                }

                return updatedStop;
              });

              // Sync pickupStop/dropoffStop timing if sequence matches
              if (updatedStopSequence !== undefined) {
                if (updatedTrip.pickupStop?.sequenceOrder === updatedStopSequence) {
                  updatedTrip.pickupStop = {
                    ...updatedTrip.pickupStop,
                    arrivedAt: stopArrivedAt ?? updatedTrip.pickupStop.arrivedAt,
                    departedAt: stopDepartedAt ?? updatedTrip.pickupStop.departedAt,
                  };
                }

                if (updatedTrip.dropoffStop?.sequenceOrder === updatedStopSequence) {
                  updatedTrip.dropoffStop = {
                    ...updatedTrip.dropoffStop,
                    arrivedAt: stopArrivedAt ?? updatedTrip.dropoffStop.arrivedAt,
                    departedAt: stopDepartedAt ?? updatedTrip.dropoffStop.departedAt,
                  };
                }
              }

              console.log('Updated attendance in stops array');
            }


            // Update local state and Redux store
            if (wasUpdated) {
              setTrip(updatedTrip);
              dispatch(updateTrip(updatedTrip));
              console.log('Attendance update applied to state');
            }
          }
        });

        // Subscribe to stops reordered event (only if parent has multiple stops)
        if (hasMultipleStops) {
          tripHubService.on<StopsReorderedEvent>('StopsReordered', (data) => {
            console.log('Parent - Stops reordered:', JSON.stringify(data, null, 2));

            if (data.tripId === tripId && trip) {
              // Update stops order based on new sequence
              setTrip((currentTrip) => {
                if (!currentTrip || !currentTrip.stops) return currentTrip;

                // Create a map of pickupPointId to new sequence order
                const sequenceMap = new Map<string, number>();
                data.stops.forEach((stop) => {
                  sequenceMap.set(stop.pickupPointId, stop.sequenceOrder);
                });

                // Update stops with new sequence order and sort by sequence
                const updatedStops = currentTrip.stops
                  .map((stop) => {
                    const newSequence = sequenceMap.get(stop.id);
                    if (newSequence !== undefined) {
                      return { ...stop, sequence: newSequence };
                    }
                    return stop;
                  })
                  .sort((a, b) => a.sequence - b.sequence);

                const updatedTrip = {
                  ...currentTrip,
                  stops: updatedStops,
                };

                // Update Redux store
                dispatch(updateTrip(updatedTrip));

                return updatedTrip;
              });
            }
          });
        }

        // Subscribe to trip status changed event
        tripHubService.on<TripStatusChangedEvent>('TripStatusChanged', (data) => {
          console.log('Trip status changed:', JSON.stringify(data, null, 2));

          if (data.tripId === tripId && trip) {
            const updatedTrip = {
              ...trip,
              status: data.status as DriverTripStatus,
              startTime: data.startTime || trip.startTime,
              endTime: data.endTime || trip.endTime,
            };

            setTrip(updatedTrip);
            dispatch(updateTrip(updatedTrip));

            console.log('Trip status updated to:', data.status);

            if (data.status === 'Completed') {
              Alert.alert(
                'Trip Completed',
                'The trip has been completed successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(parent-tabs)/trips/today')
                  }
                ]
              );
            }
          }
        });

        console.log('TripHub initialized for trip tracking:', tripId);
      } catch (error) {
        console.error('Error initializing TripHub:', error);
      }
    };

    initializeTripHub();

    // Cleanup
    return () => {
      tripHubService.offLocationUpdate();
      tripHubService.off('StopArrivalConfirmed');
      tripHubService.off('AttendanceUpdated');
      tripHubService.off('TripStatusChanged');
      if (hasMultipleStops) {
        tripHubService.off('StopsReordered');
      }
      if (tripId) {
        tripHubService.leaveTrip(tripId).catch((error) => {
          console.error(' Error leaving trip:', error);
        });
      }
    };
  }, [tripId, trip, dispatch, followBus]);

  // Calculate current active stop and status
  const currentStop = useMemo(() => getCurrentActiveStop(trip?.stops), [trip?.stops]);
  const allPickupsCompleted = useMemo(() => areAllPickupsCompleted(trip?.stops), [trip?.stops]);
  const currentStopStatus = useMemo(() => {
    if (!currentStop) return 'pending';
    if (currentStop.actualDeparture) return 'completed';
    if ((currentStop as any).actualArrival) return 'arrived';
    return 'pending';
  }, [currentStop]);

  const pickupStatus = trip ? getStopStatus(trip.pickupStop) : 'pending';
  const dropoffStatus = trip ? getStopStatus(trip.dropoffStop) : 'pending';

  useEffect(() => {
    const fetchRouteToPickup = async () => {
      if (
        trip?.status !== 'InProgress' ||
        !busLocation ||
        !trip.stops ||
        trip.stops.length === 0
      ) {
        setRouteCoordinates(null);
        return;
      }

      if (trip.tripType === TripType.Departure && hasAllChildrenBoardStatus) {
        if (!trip.schoolLocation?.latitude || !trip.schoolLocation?.longitude) {
          setRouteCoordinates(null);
          return;
        }

        setIsLoadingRoute(true);
        try {
          const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
          if (!apiKey) {
            setRouteCoordinates(null);
            return;
          }

          const [longitude, latitude] = busLocation;

          const routeData = await getRoute(
            { lat: latitude, lng: longitude },
            { lat: trip.schoolLocation.latitude, lng: trip.schoolLocation.longitude },
            apiKey
          );

          if (routeData) {
            setRouteCoordinates(routeData.coordinates);
          } else {
            setRouteCoordinates(null);
          }
        } catch (error) {
          setRouteCoordinates(null);
        } finally {
          setIsLoadingRoute(false);
        }

        return;
      }

      const nextStop = trip.stops.find(stop => !stop.actualDeparture);

      if (!nextStop || !nextStop.latitude || !nextStop.longitude) {
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
          { lat: latitude, lng: longitude },
          { lat: nextStop.latitude, lng: nextStop.longitude },
          apiKey
        );

        if (routeData) {
          setRouteCoordinates(routeData.coordinates);
          console.log('Route fetched to next stop:', nextStop.name, '-', routeData.coordinates.length, 'points');
        } else {
          setRouteCoordinates(null);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        setRouteCoordinates(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRouteToPickup();
  }, [busLocation, trip?.stops, trip?.status, trip?.tripType, trip?.schoolLocation, hasAllChildrenBoardStatus]);

  useEffect(() => {
    const calculateApproachingStops = async () => {
      if (
        trip?.status !== 'InProgress' ||
        !busLocation ||
        !trip.stops ||
        trip.stops.length === 0
      ) {
        setApproachingStops([]);
        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
      if (!apiKey) {
        console.warn(' VietMap API key not configured');
        return;
      }

      const pendingStops = trip.stops.filter(stop => !stop.actualDeparture);

      if (pendingStops.length === 0) {
        setApproachingStops([]);
        return;
      }

      try {
        const stopsWithDistance = await Promise.all(
          pendingStops.map(async (stop) => {
            if (!stop.latitude || !stop.longitude) {
              return null;
            }

            try {
              const [longitude, latitude] = busLocation;

              const routeData = await getRoute(
                { lat: latitude, lng: longitude },
                { lat: stop.latitude, lng: stop.longitude },
                apiKey
              );

              if (routeData && routeData.distance) {
                const distanceInKm = routeData.distance;
                const childrenNames = stop.attendance?.map(c => c.name).join(' and ') || '';

                return {
                  id: stop.id,
                  name: stop.name,
                  sequence: stop.sequence,
                  distance: distanceInKm,
                  childrenNames,
                };
              }

              return null;
            } catch (error) {
              console.error(`Error calculating distance to stop ${stop.name}:`, error);
              return null;
            }
          })
        );

        const approaching = stopsWithDistance
          .filter((stop): stop is ApproachingStop => stop !== null && stop.distance <= 2)
          .sort((a, b) => a.distance - b.distance);

        setApproachingStops(approaching);

        if (approaching.length > 0) {
        } else {
          console.log('No stops within 2km');
        }
      } catch (error) {
        console.error('Error calculating approaching stops:', error);
        setApproachingStops([]);
      }
    };

    calculateApproachingStops();
    const interval = setInterval(calculateApproachingStops, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [trip?.status, trip?.stops, busLocation]);

  const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
  const mapStyle = apiKey
    ? `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`
    : undefined;


  const getMapCenter = (): [number, number] => {
    if (busLocation) return busLocation;
    return [108.2022, 16.0544];
  };

  const busPointKey = useMemo(() => {
    if (!busLocation) return 'bus';
    const [lon, lat] = busLocation;
    return `bus-${lon.toFixed(6)}-${lat.toFixed(6)}`;
  }, [busLocation]);

  const calculateMapBounds = (): { center: [number, number], zoom: number } => {
    const points: [number, number][] = [];
    if (trip?.pickupStop?.latitude && trip.pickupStop.longitude) {
      points.push([trip.pickupStop.longitude, trip.pickupStop.latitude]);
    }
    if (trip?.dropoffStop?.latitude && trip.dropoffStop.longitude) {
      points.push([trip.dropoffStop.longitude, trip.dropoffStop.latitude]);
    }

    if (points.length === 0) {
      return { center: [108.2022, 16.0544], zoom: 13 };
    }

    if (points.length === 1) {
      return { center: points[0], zoom: 14 };
    }

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

  const initialMapBounds = useMemo(() => {
    return calculateMapBounds();
  }, [trip?.pickupStop?.latitude, trip?.pickupStop?.longitude, trip?.dropoffStop?.latitude, trip?.dropoffStop?.longitude]);

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>

        {/* Trip Info */}
        <View style={styles.tripInfoCard}>
          <View style={styles.tripInfoRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.tripTime}>
              {formatPlannedTime(trip.plannedStartAt)} - {formatPlannedTime(trip.plannedEndAt)}
            </Text>
          </View>
          <View style={styles.tripInfoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.tripSchedule}>{trip.scheduleName}</Text>
          </View>

          {/* Driver & Vehicle Info */}
          {(trip.driver || trip.vehicle) && (
            <>
              <View style={styles.tripInfoDivider} />
              {trip.driver && (
                <View style={styles.tripInfoRow}>
                  <Ionicons name="person-outline" size={20} color="#6B7280" />
                  <Text style={styles.tripSchedule}>
                    Driver: <Text style={styles.driverName}>{trip.driver.fullName}</Text>
                  </Text>
                </View>
              )}
              {trip.vehicle && (
                <View style={styles.tripInfoRow}>
                  <Ionicons name="car-outline" size={20} color="#6B7280" />
                  <Text style={styles.tripSchedule}>
                    {trip.vehicle.maskedPlate} · {trip.vehicle.capacity} seats
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.tripInfoDivider} />

          {/* Child Info */}
          <View style={styles.childInfoRow}>
            <View style={styles.childInfo}>
              <View style={styles.childInfoHeader}>
                <Text style={styles.childInfoTitle}>Children</Text>
                {childStatusList.length > 0 && (
                  <Text style={styles.childCountText}>
                    {childStatusList.length} children
                  </Text>
                )}
              </View>
              {childStatusList.length === 0 ? (
                <Text style={styles.childEmptyText}>No children assigned to this trip yet</Text>
              ) : (
                <View style={styles.childStatusList}>
                  {childStatusList.map((child) => {
                    const statusDisplay = getChildStateDisplay(child, trip.tripType);
                    return (
                      <TouchableOpacity
                        key={child.id}
                        style={styles.childStatusRow}
                        onPress={() => {
                          setSelectedChildId(child.id);
                          setShowChildModal(true);
                        }}
                        activeOpacity={0.7}>
                        <View style={styles.childStatusInfo}>
                          <View style={styles.childNameRow}>
                            <Ionicons name="person" size={20} color="#F59E0B" style={styles.childIcon} />
                            <Text style={styles.childName}>{child.name}</Text>
                          </View>

                        </View>
                        <View style={[styles.childStatusBadge, { backgroundColor: statusDisplay.backgroundColor }]}>
                          <Text style={[styles.childStatusBadgeText, { color: statusDisplay.textColor }]}>
                            {statusDisplay.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {trip.childClassName && childStatusList.length === 1 && (
                <Text style={styles.childClass}>Class {trip.childClassName}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Bus Status Banner */}
        {trip.status === 'InProgress' && (
          <>
            {!hasAllChildrenBoardStatus && approachingStops.length > 0 && currentStopStatus !== 'arrived' && (
              <View style={styles.statusBanner}>
                <View style={styles.statusBannerIconContainer}>
                  <Ionicons name="bus" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.statusBannerContent}>
                  {approachingStops.length === 1 ? (
                    <Text style={styles.statusBannerTitle}>
                      The bus is approaching the {trip.tripType === TripType.Departure ? 'pickup' : trip.tripType === TripType.Return ? 'drop-off' : 'pickup/drop-off'} point for{' '}
                      <Text style={styles.statusBannerTextBold}>
                        {approachingStops[0].childrenNames}
                      </Text>
                      , about {approachingStops[0].distance < 1
                        ? `${Math.round(approachingStops[0].distance * 1000)}m`
                        : `${approachingStops[0].distance.toFixed(1)}km`} away
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.statusBannerTitle}>
                        The bus is approaching:
                      </Text>
                      {approachingStops.map((stop) => (
                        <Text key={stop.id} style={styles.statusBannerBulletItem}>
                          • {trip.tripType === TripType.Departure ? 'Pickup' : trip.tripType === TripType.Return ? 'Drop-off' : 'Pickup/Drop-off'} point for{' '}
                          <Text style={styles.statusBannerTextBold}>
                            {stop.childrenNames}
                          </Text>
                          , about {stop.distance < 1
                            ? `${Math.round(stop.distance * 1000)}m`
                            : `${stop.distance.toFixed(1)}km`} away
                        </Text>
                      ))}
                    </>
                  )}
                </View>
              </View>
            )}

            {trip.tripType === TripType.Departure && (
              <>
                {hasAllChildrenBoardStatus && (
                  <View style={styles.statusBanner}>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        The bus has completed pick-up for your child.
                      </Text>
                    </View>
                  </View>
                )}

                {!hasAllChildrenBoardStatus && approachingStops.length === 0 && !allPickupsCompleted && currentStop && currentStopStatus === 'pending' && (
                  <View style={styles.statusBanner}>
                    <View style={styles.statusBannerIconContainer}>
                      <Ionicons name="bus" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        The school bus has started the trip.
                      </Text>
                    </View>
                  </View>
                )}

                {!hasAllChildrenBoardStatus && !allPickupsCompleted && currentStop && currentStopStatus === 'arrived' && (
                  <View style={styles.statusBanner}>
                    <View style={styles.statusBannerIconContainer}>
                      <Ionicons name="bus" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        The bus has arrived at the pickup point for{' '}
                        <Text style={styles.statusBannerTextBold}>
                          {currentStop.attendance?.map(c => c.name).join(' and ') || 'students'}
                        </Text>
                        ! Please bring your child to the bus
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {trip.tripType === TripType.Return && (
              <>
                {hasAllChildrenBoardStatus && (
                  <View style={styles.statusBanner}>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        The bus has completed drop-off for your child.
                      </Text>
                    </View>
                  </View>
                )}

                {!hasAllChildrenBoardStatus && approachingStops.length === 0 && !allPickupsCompleted && currentStop && currentStopStatus === 'pending' && (
                  <View style={styles.statusBanner}>
                    <View style={styles.statusBannerIconContainer}>
                      <Ionicons name="bus" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        The school bus has started the trip.
                      </Text>
                    </View>
                  </View>
                )}

                {!hasAllChildrenBoardStatus && !allPickupsCompleted && currentStop && currentStopStatus === 'arrived' && (
                  <View style={styles.statusBanner}>
                    <View style={styles.statusBannerIconContainer}>
                      <Ionicons name="bus" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        The bus has arrived at the drop-off point for{' '}
                        <Text style={styles.statusBannerTextBold}>
                          {currentStop.attendance?.map(c => c.name).join(' and ') || 'students'}
                        </Text>
                        ! Please pick up your child
                      </Text>
                    </View>
                  </View>
                )}

                {!hasAllChildrenBoardStatus && approachingStops.length === 0 && allPickupsCompleted && (
                  <View style={styles.statusBanner}>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        The bus has completed drop-off for your child.
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
            {(trip.tripType === undefined || trip.tripType === TripType.Unknown) && (
              <>
                {approachingStops.length === 0 && !allPickupsCompleted && currentStop && (
                  <View style={styles.statusBanner}>
                    <View style={styles.statusBannerIconContainer}>
                      <Ionicons name="bus" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        {currentStopStatus === 'arrived'
                          ? 'Bus has arrived!'
                          : 'Bus is on the way'}
                      </Text>
                      <Text style={styles.statusBannerText}>
                        {currentStopStatus === 'arrived' ? 'Picking up ' : 'Heading to pickup point for '}
                        <Text style={styles.statusBannerTextBold}>
                          {currentStop.attendance?.map(c => c.name).join(' and ') || 'students'}
                        </Text>
                      </Text>
                    </View>
                  </View>
                )}

                {approachingStops.length === 0 && allPickupsCompleted && trip.dropoffStop && (
                  <View style={[styles.statusBanner, styles.statusBannerSchool]}>
                    <View style={styles.statusBannerIconContainer}>
                      <Ionicons name="school" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.statusBannerContent}>
                      <Text style={styles.statusBannerTitle}>
                        Heading to school
                      </Text>
                      <Text style={styles.statusBannerText}>
                        All students picked up, on the way to{' '}
                        <Text style={styles.statusBannerTextBold}>
                          {trip.dropoffStop.pickupPointName || 'school'}
                        </Text>
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}

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
                key={`camera-${centerOnBusTimestamp}`}
                defaultSettings={{
                  centerCoordinate: centerOnBusTimestamp > 0 && busLocation ? busLocation : initialMapBounds.center,
                  zoomLevel: centerOnBusTimestamp > 0 && busLocation ? 14 : initialMapBounds.zoom,
                  animationDuration: centerOnBusTimestamp > 0 && busLocation ? 1000 : 0,
                }}
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
                  ]}>
                    <Ionicons
                      name="location"
                      size={36}
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
                  ]}>
                    <Ionicons
                      name="location"
                      size={36}
                      color="#FFFFFF"
                    />
                  </View>
                </PointAnnotation>
              )}

              {/* All Stops Markers */}
              {trip.stops && trip.stops.map((stop) => {
                if (!stop.latitude || !stop.longitude) return null;

                return (
                  <PointAnnotation
                    key={`stop-${stop.id}`}
                    id={`stop-${stop.id}`}
                    coordinate={[stop.longitude, stop.latitude]}
                    anchor={{ x: 0.5, y: 1 }}>
                    <View style={styles.stopMarkerContainer} collapsable={false}>
                      <View
                        style={[styles.stopMarkerBadge, { backgroundColor: '#C41E3A' }]}
                        collapsable={false}
                      />
                      <View style={[styles.stopMarkerPin, { borderTopColor: '#C41E3A' }]} />
                    </View>
                  </PointAnnotation>
                );
              })}

              {/* School Location Marker */}
              {trip.schoolLocation && trip.schoolLocation.latitude && trip.schoolLocation.longitude && (
                <PointAnnotation
                  id="school-location"
                  coordinate={[trip.schoolLocation.longitude, trip.schoolLocation.latitude]}
                  anchor={{ x: 0.5, y: 1 }}>
                  <View style={styles.schoolMarker}>
                    <Ionicons name="school" size={32} color="#FFFFFF" />
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

          {/* Center on Bus Button - Positioned inside map container */}
          {busLocation && trip.status === 'InProgress' && (
            <TouchableOpacity
              style={[
                styles.centerOnBusButton,
                followBus ? styles.centerOnBusButtonActive : styles.centerOnBusButtonInactive,
              ]}
              onPress={() => {
                const nextFollow = !followBus;
                setFollowBus(nextFollow);
                if (nextFollow && busLocation) {
                  setCenterOnBusTimestamp(Date.now());
                }
              }}
              activeOpacity={0.8}>
              <Ionicons name="locate" size={24} color="#000000" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Floating Buttons */}
      <View style={styles.floatingButtonsContainer}>
        {/* Supervisor Info Button */}
        {trip.supervisor && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setShowDriverModal(true)}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="account-tie" size={30} color="#FFFFFF" />
            <Text style={styles.floatingButtonLabel}>Supervisor</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Supervisor Info Modal */}
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
              <Text style={styles.modalTitle}>Supervisor</Text>
              <TouchableOpacity
                onPress={() => setShowDriverModal(false)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {trip.supervisor && (
              <View style={styles.modalBody}>
                <View style={styles.modalDriverAvatarContainer}>
                  <UserAvatar
                    userId={trip.supervisor?.id}
                    userName={trip.supervisor?.fullName}
                    size={120}
                    showBorder={false}
                  />
                </View>

                <View style={styles.modalDriverInfo}>
                  <Text style={styles.modalDriverName}>{trip.supervisor.fullName}</Text>

                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => {
                      // Handle call action
                      Alert.alert('Call', `Do you want to call ${trip.supervisor?.fullName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Call', onPress: () => {
                            // Implement call functionality (e.g., Linking.openURL)
                            console.log('Calling supervisor:', trip.supervisor?.phone);
                          }
                        },
                      ]);
                    }}>
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>{trip.supervisor.phone}</Text>
                  </TouchableOpacity>
                </View>
              </View >
            )
            }
          </View >
        </View >
      </Modal >

      {/* Child Info Modal */}
      <Modal
        visible={showChildModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowChildModal(false);
          setSelectedChildId(null);
        }}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowChildModal(false);
              setSelectedChildId(null);
            }}
          />
          <View style={styles.modalContent}>
            {selectedChild && (() => {
              const selectedChildStatus = getChildStateDisplay(selectedChild, trip.tripType);
              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedChild.name}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowChildModal(false);
                        setSelectedChildId(null);
                      }}
                      style={styles.modalCloseButton}>
                      <Ionicons name="close" size={24} color="#000000" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <View style={styles.modalDriverAvatarContainer}>
                      <StudentAvatar
                        studentId={selectedChild.id}
                        studentName={selectedChild.name}
                        studentImageId={selectedChild.studentImageId ?? undefined}
                        size={120}
                        style={styles.modalDriverAvatar}
                      />
                    </View>

                    <View style={styles.modalDriverInfo}>
                      {/* Address Info */}
                      {selectedChildStop?.address && (
                        <View style={styles.vehicleInfoContainer}>
                          <View style={styles.vehicleInfoItem}>
                            <View style={styles.vehicleInfoIcon}>
                              <Ionicons name="location" size={18} color="#6B7280" />
                            </View>
                            <View style={styles.vehicleInfoText}>
                              <Text style={styles.vehicleInfoValue}>
                                {selectedChildStop.address}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Detailed Status Info (board / alight) */}
                      <View style={styles.vehicleInfoContainer}>
                        <View style={styles.vehicleInfoItem}>
                          <View style={styles.vehicleInfoIcon}>
                            <Ionicons name="information-circle" size={18} color="#6B7280" />
                          </View>
                          <View style={styles.vehicleInfoText}>
                            <View style={{ marginTop: 4 }}>
                              <View style={styles.childStatusInlineRow}>
                                <View style={styles.childModalInlineGroup}>
                                  <Text style={styles.childModalStatusLabel}>
                                    Board
                                  </Text>
                                  <View
                                    style={[
                                      styles.childModalStatusPill,
                                      (selectedChild.boardStatus || 'Pending') === 'Present' && styles.childModalStatusPillPresent,
                                      (selectedChild.boardStatus || 'Pending') === 'Absent' && styles.childModalStatusPillAbsent,
                                      (selectedChild.boardStatus || 'Pending') === 'Boarded' && styles.childModalStatusPillBoarded,
                                    ]}
                                  >
                                    <Text style={styles.childModalStatusPillText}>
                                      {selectedChild.boardStatus ?? 'Pending'}
                                    </Text>
                                  </View>
                                </View>
                                {selectedChild.boardedAt && (
                                  <Text style={styles.vehicleInfoSubtext}>
                                    {formatTime(selectedChild.boardedAt)}
                                  </Text>
                                )}
                              </View>

                              <View style={[styles.childStatusInlineRow, { marginTop: 4 }]}>
                                <View style={styles.childModalInlineGroup}>
                                  <Text style={styles.childModalStatusLabel}>
                                    Alight
                                  </Text>
                                  <View
                                    style={[
                                      styles.childModalStatusPill,
                                      (selectedChild.alightStatus || 'Pending') === 'Present' && styles.childModalStatusPillPresent,
                                      (selectedChild.alightStatus || 'Pending') === 'Absent' && styles.childModalStatusPillAbsent,
                                      (selectedChild.alightStatus || 'Pending') === 'Boarded' && styles.childModalStatusPillBoarded,
                                    ]}
                                  >
                                    <Text style={styles.childModalStatusPillText}>
                                      {selectedChild.alightStatus ?? 'Pending'}
                                    </Text>
                                  </View>
                                </View>
                                {selectedChild.alightedAt && (
                                  <Text style={styles.vehicleInfoSubtext}>
                                    {formatTime(selectedChild.alightedAt)}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal >
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
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  childInfoTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
    textTransform: 'uppercase',
  },
  childCountText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'RobotoSlab-Medium',
  },
  childStatusList: {
  },
  childStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  childStatusInfo: {
    flex: 1,
    marginRight: 12,
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  childIcon: {
    marginRight: 8,
  },
  childName: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  childStatusTime: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Regular',
  },
  childStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 96,
    alignItems: 'center',
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
  statusBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  statusBannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusBannerContent: {
    flex: 1,
    marginRight: 12,
  },
  statusBannerTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  statusBannerText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
    color: '#000000',
  },
  statusBannerTextBold: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  statusBannerBulletItem: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
    color: '#000000',
    marginTop: 6,
    lineHeight: 20,
  },
  statusBannerSchool: {
    backgroundColor: '#C8E6C9',
    borderColor: '#81C784',
  },
  childStatusBadgeText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Bold',
  },
  childEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'RobotoSlab-Regular',
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
  driverName: {
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  stopMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stopMarkerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  schoolMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1565C0',
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
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    gap: 16,
  },
  floatingButton: {
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
  vehicleInfoSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Regular',
    marginTop: 4,
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
  childModalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childModalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  childModalStatusText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
  },
  childStatusInlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childModalInlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  childModalStatusLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
  },
  childModalStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  childModalStatusPillPresent: {
    backgroundColor: '#DCFCE7',
  },
  childModalStatusPillAbsent: {
    backgroundColor: '#FEE2E2',
  },
  childModalStatusPillBoarded: {
    backgroundColor: '#DBEAFE',
  },
  childModalStatusPillText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Bold',
    color: '#111827',
  },
});