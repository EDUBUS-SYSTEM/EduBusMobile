import { StudentAvatar } from '@/components/StudentAvatar';
import { UserAvatar } from '@/components/UserAvatar';
import { StopsReorderedEvent } from '@/lib/signalr/signalr.types';
import { tripHubService } from '@/lib/signalr/tripHub.service';
import { getSupervisorTripDetail, submitManualAttendance } from '@/lib/supervisor/supervisor.api';
import { SupervisorTripDetailDto } from '@/lib/supervisor/supervisor.types';
import { tripIncidentApi } from '@/lib/trip/tripIncident.api';
import { TripIncidentListItem, TripIncidentReason } from '@/lib/trip/tripIncident.types';
import type { Guid } from '@/lib/types';
import { userAccountApi } from '@/lib/userAccount/userAccount.api';
import { toHourMinute } from '@/utils/date.utils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Params = { tripId?: Guid };

// Format time for attendance (convert to Vietnam timezone)
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


const getStatusColor = (status: string): string => {
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

const incidentReasonLabel: Record<TripIncidentReason, string> = {
  VehicleIssue: 'Vehicle issue',
  StudentIssue: 'Student issue',
  RouteBlocked: 'Route blocked',
  Weather: 'Weather',
  SafetyConcern: 'Safety concern',
  IoTDeviceIssue: 'IoT attendance device issue',
  Other: 'Other',
};

const incidentStatusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: '#FFF4E5', text: '#D97706' },
  acknowledged: { bg: '#E0F2FE', text: '#0369A1' },
  resolved: { bg: '#E7F9ED', text: '#15803D' },
};

const INCIDENT_REASONS: TripIncidentReason[] = [
  'SafetyConcern',
  'StudentIssue',
  'VehicleIssue',
  'RouteBlocked',
  'Weather',
  'IoTDeviceIssue',
  'Other',
];

export default function SupervisorTripDetailScreen() {
  const { tripId } = useLocalSearchParams<Params>();
  const [trip, setTrip] = React.useState<SupervisorTripDetailDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [boardingStatus, setBoardingStatus] = React.useState<Record<string, 'Present' | 'Absent' | null>>({});
  const [alightingStatus, setAlightingStatus] = React.useState<Record<string, 'Present' | 'Absent' | null>>({});
  const [driverAvatarUrl, setDriverAvatarUrl] = React.useState<string | null>(null);
  const [showBoardingDropdown, setShowBoardingDropdown] = React.useState<{ studentId: string; stopSequence: number; position: { x: number; y: number; width: number } } | null>(null);
  const [showAlightingDropdown, setShowAlightingDropdown] = React.useState<{ studentId: string; stopSequence: number; position: { x: number; y: number; width: number } } | null>(null);
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [incidents, setIncidents] = React.useState<TripIncidentListItem[]>([]);
  const [incidentsLoading, setIncidentsLoading] = React.useState(false);
  const [incidentDetailVisible, setIncidentDetailVisible] = React.useState(false);
  const [selectedIncident, setSelectedIncident] = React.useState<TripIncidentListItem | null>(null);
  const [incidentDetailLoading, setIncidentDetailLoading] = React.useState(false);
  const [reportModalVisible, setReportModalVisible] = React.useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = React.useState(false);
  const [reportReason, setReportReason] = React.useState<TripIncidentReason>('SafetyConcern');
  const [reportTitle, setReportTitle] = React.useState('');
  const [reportDescription, setReportDescription] = React.useState('');
  const [reportSubmitting, setReportSubmitting] = React.useState(false);
  const [reportError, setReportError] = React.useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const loadTripData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Get trip detail from supervisor API
      if (!tripId) return;
      const tripData = await getSupervisorTripDetail(tripId);

      setTrip(tripData);

      // Load driver avatar URL directly (UserAvatar component will handle authentication and fallback)
      if (tripData.driver?.id) {
        // Directly use getAvatarUrl - UserAvatar component will handle the case when no avatar exists
        setDriverAvatarUrl(userAccountApi.getAvatarUrl(tripData.driver.id));
      }

      // Initialize boarding and alighting status for all students from stops
      const initialBoarding: Record<string, 'Present' | 'Absent' | null> = {};
      const initialAlighting: Record<string, 'Present' | 'Absent' | null> = {};

      tripData.stops.forEach(stop => {
        if (stop.attendance && Array.isArray(stop.attendance)) {
          // Group by studentId to handle merged records from backend
          const studentAttendanceMap = new Map<string, typeof stop.attendance[0]>();

          stop.attendance.forEach((attendance) => {
            const studentId = attendance.studentId;
            if (studentId && !studentAttendanceMap.has(studentId)) {
              studentAttendanceMap.set(studentId, attendance);
            }
          });

          studentAttendanceMap.forEach((attendance, studentId) => {
            if (attendance.boardStatus) {
              initialBoarding[studentId] = attendance.boardStatus as 'Present' | 'Absent';
            }
            if (attendance.alightStatus) {
              initialAlighting[studentId] = attendance.alightStatus as 'Present' | 'Absent';
            }
          });
        }
      });
      setBoardingStatus(initialBoarding);
      setAlightingStatus(initialAlighting);
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
  }, [tripId]);

  const loadIncidents = React.useCallback(
    async (page = 1) => {
      if (!tripId) return;
      try {
        setIncidentsLoading(true);
        const response = await tripIncidentApi.getByTrip(tripId, page, 10);
        setIncidents(response.data || []);
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      } catch (error: any) {
        console.error('Error loading incidents:', error);
        setReportError(error.message || 'Unable to load incident reports.');
      } finally {
        setIncidentsLoading(false);
      }
    },
    [tripId, fadeAnim]
  );

  // Refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTripData(), loadIncidents()]);
    setRefreshing(false);
    // Haptic feedback on refresh complete
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [loadTripData, loadIncidents]);

  // Load trip data
  React.useEffect(() => {
    if (!tripId) {
      Alert.alert('Error', 'Trip ID is missing', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    loadTripData();
    loadIncidents();
  }, [tripId, loadTripData, loadIncidents]);

  // Initialize TripHub connection for realtime updates
  React.useEffect(() => {
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

        // Join trip group to receive events
        await tripHubService.joinTrip(tripId);
        console.log('✅ Joined trip group:', tripId);

        // Subscribe to stops reordered event
        tripHubService.on<StopsReorderedEvent>('StopsReordered', (data) => {
          console.log('🔔 Supervisor - Stops reordered:', JSON.stringify(data, null, 2));

          if (data.tripId === tripId && trip) {
            // Update stops order based on new sequence
            setTrip((currentTrip) => {
              if (!currentTrip) return currentTrip;

              // Create a map of pickupPointId to new sequence order
              const sequenceMap = new Map<string, number>();
              data.stops.forEach((stop) => {
                sequenceMap.set(stop.pickupPointId, stop.sequenceOrder);
              });

              // Update stops with new sequence order
              const updatedStops = currentTrip.stops.map((stop) => {
                const newSequence = sequenceMap.get(stop.id);
                if (newSequence !== undefined) {
                  return {
                    ...stop,
                    sequence: newSequence,
                  };
                }
                return stop;
              });

              // Sort stops by new sequence order
              updatedStops.sort((a, b) => a.sequence - b.sequence);

              console.log('✅ Supervisor - Updated stops order');
              return {
                ...currentTrip,
                stops: updatedStops,
              };
            });
          }
        });

        console.log('✅ TripHub initialized for supervisor trip:', tripId);
      } catch (error) {
        console.error('❌ Error initializing TripHub:', error);
      }
    };

    initializeTripHub();

    // Cleanup
    return () => {
      tripHubService.off('StopsReordered');
      if (tripId) {
        tripHubService.leaveTrip(tripId).catch((error) => {
          console.error('❌ Error leaving trip:', error);
        });
      }
    };
  }, [tripId, trip?.id, trip?.status, loadTripData]);

  const handleBoardingStatus = async (studentId: string, stopSequence: number, status: 'Present' | 'Absent') => {
    if (!trip || !tripId) {
      Alert.alert('Error', 'Trip information is missing');
      return;
    }

    setBoardingStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
    setShowBoardingDropdown(null);

    try {
      const result = await submitManualAttendance(tripId, stopSequence, studentId, status, null);

      setTrip((prev) => {
        if (!prev) return prev;
        const newStops = prev.stops.map((stop) => {
          if (stop.sequence !== stopSequence) {
            return stop;
          }
          const updatedAttendance = stop.attendance.map((a) => {
            if (a.studentId !== studentId) return a;
            return {
              ...a,
              boardStatus: status,
              boardedAt: result.timestamp,
            };
          });
          return {
            ...stop,
            attendance: updatedAttendance,
          };
        });
        return { ...prev, stops: newStops };
      });
    } catch (error: any) {
      console.error('Error updating boarding:', error);
      setBoardingStatus(prev => ({
        ...prev,
        [studentId]: prev[studentId]
      }));
      Alert.alert('Error', error.message || 'Failed to update boarding. Please try again.');
    }
  };

  const handleAlightingStatus = async (studentId: string, stopSequence: number, status: 'Present' | 'Absent') => {
    if (!trip || !tripId) {
      Alert.alert('Error', 'Trip information is missing');
      return;
    }

    setAlightingStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
    setShowAlightingDropdown(null);

    try {
      const result = await submitManualAttendance(tripId, stopSequence, studentId, null, status);

      setTrip((prev) => {
        if (!prev) return prev;
        const newStops = prev.stops.map((stop) => {
          if (stop.sequence !== stopSequence) {
            return stop;
          }
          const updatedAttendance = stop.attendance.map((a) => {
            if (a.studentId !== studentId) return a;
            return {
              ...a,
              alightStatus: status,
              alightedAt: result.timestamp,
            };
          });
          return {
            ...stop,
            attendance: updatedAttendance,
          };
        });
        return { ...prev, stops: newStops };
      });
    } catch (error: any) {
      console.error('Error updating alighting:', error);
      setAlightingStatus(prev => ({
        ...prev,
        [studentId]: prev[studentId]
      }));
      Alert.alert('Error', error.message || 'Failed to update alighting. Please try again.');
    }
  };

  const handleCallDriver = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const resetReportForm = () => {
    setReportReason('SafetyConcern');
    setReportTitle('');
    setReportDescription('');
    setReportError(null);
  };

  const handleOpenReport = () => {
    if (trip && trip.status !== 'InProgress') {
      Alert.alert('Trip is not active', 'Incident reports can only be sent while the trip is InProgress.');
      return;
    }
    const proceed = () => {
      resetReportForm();
      setReportModalVisible(true);
    };
    if (incidents.length > 0) {
      Alert.alert(
        'Report already exists',
        'You have sent an incident report for this trip. Send another?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send another', onPress: proceed },
        ]
      );
      return;
    }
    proceed();
  };

  const handlePreviewConfirm = () => {
    if (!reportReason) {
      setReportError('Please choose a report reason');
      return;
    }
    if (reportReason === 'Other') {
      if (!reportTitle.trim()) {
        setReportError('Title is required when reason is Other.');
        return;
      }
      if (!reportDescription.trim()) {
        setReportError('Description is required when reason is Other.');
        return;
      }
    }
    setConfirmModalVisible(true);
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '--';
    try {
      const date = new Date(iso);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateStr} ${timeStr}`;
    } catch {
      return '--';
    }
  };

  const handleSubmitReport = async () => {
    if (!tripId) return;
    setReportSubmitting(true);
    setReportError(null);
    try {
      await tripIncidentApi.create(tripId, {
        reason: reportReason,
        title: reportTitle.trim() || undefined,
        description: reportDescription.trim() || undefined,
      });
      await loadIncidents();
      setConfirmModalVisible(false);
      setReportModalVisible(false);
      // Haptic feedback on success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Report sent', 'The incident report has been sent to the dispatcher.');
    } catch (error: any) {
      // Haptic feedback on error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setConfirmModalVisible(false);
      setReportModalVisible(true);
      setReportError(error.message || 'Unable to send the report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenIncident = async (incident: TripIncidentListItem) => {
    setSelectedIncident(incident);
    setIncidentDetailVisible(true);

    // If description is missing, fetch full detail
    if (!incident.description) {
      try {
        setIncidentDetailLoading(true);
        const detail = await tripIncidentApi.getById(incident.id);
        setSelectedIncident({
          ...incident,
          ...detail,
        });
      } catch (error: any) {
        console.error('Error loading incident detail', error);
      } finally {
        setIncidentDetailLoading(false);
      }
    }
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

  const totalStudents = trip.stops.reduce((acc, stop) => acc + (stop.attendance?.length || 0), 0);

  const completedStudents = trip.stops.reduce((acc, stop) => {
    const alightedCount = stop.attendance?.filter(a => a.alightStatus === 'Present').length || 0;
    return acc + alightedCount;
  }, 0);

  const canReport = trip.status === 'InProgress';

  return (
    <View style={styles.container}>
      {/* Header - Matching Vehicle Screen Style */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top + 10, 40) }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Trip Attendances
            </Text>
            <Text style={styles.headerSubtitle}>
              {trip.routeName}
            </Text>
          </View>
        </View>

        {/* Trip Status Card inside Header */}
        <View style={styles.headerCard}>
          <View style={styles.tripInfoRow}>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.tripTime}>
                {toHourMinute(trip.plannedStartAt)} - {toHourMinute(trip.plannedEndAt)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
              <Text style={[styles.statusText, { color: getStatusTextColor(trip.status) }]}>{trip.status}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              <Text style={{ fontWeight: 'bold' }}>{trip.stops.length}</Text> Stops
            </Text>
            <View style={styles.statDot} />
            <Text style={styles.statText}>
              <Text style={{ fontWeight: 'bold' }}>{totalStudents}</Text> Students
            </Text>
            <View style={styles.statDot} />
            <Text style={styles.statText}>
              <Text style={{ fontWeight: 'bold' }}>{completedStudents}</Text> Completed
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={['#F59E0B', '#FFD700']}
            title="Refreshing..."
            titleColor="#666"
          />
        }
        onScrollBeginDrag={() => {
          setShowBoardingDropdown(null);
          setShowAlightingDropdown(null);
        }}
      >
        {/* Incident report CTA + list */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Incident Reports</Text>
            {canReport ? (
              <TouchableOpacity
                style={styles.reportButton}
                onPress={handleOpenReport}
                disabled={reportSubmitting}
              >
                <Ionicons name="alert-circle" size={16} color="#B45309" />
                <Text style={styles.reportButtonText}>
                  {incidents.length > 0 ? 'Another Report' : 'Report'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.reportDisabledContainer}>
                <View style={styles.reportDisabledBadge}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.reportDisabledText}>Available when trip is InProgress</Text>
                </View>
              </View>
            )}
          </View>
          {incidentsLoading ? (
            <View style={styles.incidentLoadingRow}>
              <ActivityIndicator size="small" color="#B45309" />
              <Text style={styles.incidentLoadingText}>Loading reports...</Text>
            </View>
          ) : incidents.length === 0 ? (
            <View style={styles.incidentEmptyCard}>
              <Ionicons name="checkmark-done-circle" size={24} color="#CA8A04" />
              <Text style={styles.incidentEmptyText}>
                No incident reports yet. Please send only when absolutely necessary.
              </Text>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {incidents.map((incident) => {
                const statusKey = String(incident.status || '').toLowerCase() || 'open';
                const badge = incidentStatusColors[statusKey] || incidentStatusColors.open;
                const displayTitle =
                  incident.reason === 'Other'
                    ? incident.title || 'Other'
                    : incidentReasonLabel[incident.reason] || incident.title || 'Incident';
                return (
                  <TouchableOpacity
                    key={incident.id}
                    style={styles.incidentCard}
                    activeOpacity={0.9}
                    onPress={() => handleOpenIncident(incident)}
                  >
                    <View style={styles.incidentRow}>
                      <View style={styles.incidentIcon}>
                        <Ionicons name="alert-circle" size={18} color="#B45309" />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.incidentTitle} numberOfLines={1}>
                          {displayTitle}
                        </Text>
                        <View style={styles.incidentMetaRow}>
                          <View style={styles.incidentReasonChip}>
                            <Ionicons name="flag" size={12} color="#92400E" />
                            <Text style={styles.incidentReasonText}>
                              {incidentReasonLabel[incident.reason]}
                            </Text>
                          </View>
                          <Text style={styles.incidentMetaText}>{formatDateTime(incident.createdAt)}</Text>
                        </View>
                      </View>
                      <View style={[styles.incidentStatusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.incidentStatusText, { color: badge.text }]}>
                          {incident.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}
        </View>

        {/* Driver & Vehicle Info */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Driver & Vehicle</Text>
          <View style={styles.card}>
            {trip.driver ? (
              <View style={styles.driverRow}>
                <UserAvatar
                  avatarUrl={driverAvatarUrl}
                  userId={trip.driver.id}
                  userName={trip.driver.fullName}
                  size={48}
                  showBorder={false}
                />
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{trip.driver.fullName}</Text>
                  <Text style={styles.driverPhone}>{trip.driver.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCallDriver(trip.driver!.phone)}
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.noInfoText}>No driver assigned</Text>
            )}

            <View style={styles.divider} />

            {trip.vehicle ? (
              <View style={styles.vehicleRow}>
                <View style={styles.vehicleIcon}>
                  <Ionicons name="bus-outline" size={20} color="#6B7280" />
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehiclePlate}>{trip.vehicle.maskedPlate}</Text>
                  <Text style={styles.vehicleDetail}>{trip.vehicle.capacity} Seats • {trip.vehicle.status}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noInfoText}>No vehicle assigned</Text>
            )}
          </View>
        </View>

        {/* Stops & Students */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Student List</Text>

          {trip.stops.map((stop, stopIndex) => (
            <View key={stop.id} style={styles.stopGroup}>
              {/* Stop Header (Timeline style) */}
              <View style={styles.stopHeader}>
                <View style={styles.timelineContainer}>
                  <View style={[
                    styles.timelineDot,
                    stopIndex === 0 && styles.timelineDotStart,
                    stopIndex === trip.stops.length - 1 && styles.timelineDotEnd
                  ]} />
                  {stopIndex < trip.stops.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>Stop {stop.sequence + 1}: {stop.name}</Text>
                  {/* Removed planned time as requested */}
                </View>
              </View>

              {/* Students List for this stop */}
              <View style={styles.stopStudents}>
                {stop.attendance && stop.attendance.length > 0 ? (
                  // Filter to get unique students only (in case backend returns duplicates)
                  stop.attendance
                    .filter((student, index, self) =>
                      index === self.findIndex(s => s.studentId === student.studentId)
                    )
                    .map((student) => {
                    const boardingStatusValue = boardingStatus[student.studentId];
                    const alightingStatusValue = alightingStatus[student.studentId];
                    const isBoarded = boardingStatusValue !== null && boardingStatusValue !== undefined;
                    const isAlighted = alightingStatusValue !== null && alightingStatusValue !== undefined;
                    
                    const boardedAt = student.boardedAt ? formatTime(student.boardedAt) : null;
                    const alightedAt = student.alightedAt ? formatTime(student.alightedAt) : null;
                    
                    let statusText = 'Not Checked';
                    if (isAlighted) {
                      statusText = alightingStatusValue === 'Present' 
                        ? `Alighted${alightedAt ? ` (${alightedAt})` : ''}` 
                        : `Absent (Alighting)${alightedAt ? ` (${alightedAt})` : ''}`;
                    } else if (isBoarded) {
                      statusText = boardingStatusValue === 'Present' 
                        ? `Boarded${boardedAt ? ` (${boardedAt})` : ''}` 
                        : `Absent (Boarding)${boardedAt ? ` (${boardedAt})` : ''}`;
                    }
                    
                    const uniqueKey = `${stop.id}-${student.studentId}`;
                    let boardingButtonRef: View | null = null;
                    let alightingButtonRef: View | null = null;
                    
                    return (
                      <View
                        key={uniqueKey}
                        style={[
                          styles.studentCard,
                          isBoarded && boardingStatusValue === 'Present' && styles.studentCardPresent,
                          isAlighted && alightingStatusValue === 'Present' && styles.studentCardAlighted,
                          (boardingStatusValue === 'Absent' || alightingStatusValue === 'Absent') && styles.studentCardAbsent
                        ]}
                      >
                        <View style={styles.studentHeader}>
                          <StudentAvatar
                            studentId={student.studentId}
                            studentName={student.studentName}
                            studentImageId={student.studentImageId}
                            size={48}
                            showBorder={false}
                          />
                          <View style={styles.studentInfo}>
                            <Text style={styles.studentName} numberOfLines={1}>
                              {student.studentName}
                            </Text>
                            <Text style={styles.studentMeta} numberOfLines={1}>
                              {(student.className || 'No class info') + ` • Stop ${stop.sequence + 1}`}
                            </Text>
                            {/* Show boarding/alighting status with times */}
                            {(isBoarded || isAlighted) && (
                              <View style={styles.attendanceStatusRow}>
                                {isBoarded && boardingStatusValue && (
                                  <Text style={styles.attendanceStatusText}>
                                    Boarding: {boardingStatusValue}
                                    {student.boardedAt && ` • ${formatTime(student.boardedAt)}`}
                                  </Text>
                                )}
                                {isAlighted && alightingStatusValue && (
                                  <Text style={styles.attendanceStatusText}>
                                    Alighting: {alightingStatusValue}
                                    {student.alightedAt && ` • ${formatTime(student.alightedAt)}`}
                                  </Text>
                                )}
                              </View>
                            )}
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              isAlighted
                                ? styles.statusPillAlighted
                                : isBoarded
                                ? styles.statusPillPresent
                                : styles.statusPillPending
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                (isBoarded || isAlighted) && styles.statusPillTextActive
                              ]}
                            >
                              {statusText}
                            </Text>
                          </View>
                        </View>

                        {trip.status === 'InProgress' && (
                          <View style={styles.attendanceButtons}>
                            {/* Boarding Button with Dropdown */}
                            <View
                              style={styles.dropdownContainer}
                              ref={(ref) => { boardingButtonRef = ref; }}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.attendanceBtn,
                                  styles.boardingBtn,
                                  isBoarded && boardingStatusValue === 'Present' && styles.boardingBtnActive,
                                  boardingStatusValue === 'Absent' && styles.boardingBtnAbsent
                                ]}
                                onPress={() => {
                                  if (showBoardingDropdown?.studentId === student.studentId) {
                                    setShowBoardingDropdown(null);
                                  } else {
                                    boardingButtonRef?.measureInWindow((x, y, width, height) => {
                                      setShowBoardingDropdown({
                                        studentId: student.studentId,
                                        stopSequence: stop.sequence,
                                        position: { x, y: y + height, width }
                                      });
                                      setShowAlightingDropdown(null);
                                    });
                                  }
                                }}
                                disabled={false}
                              >
                                <Ionicons
                                  name={isBoarded ? 'checkmark-circle' : 'arrow-up-circle-outline'}
                                  size={18}
                                  color={isBoarded && boardingStatusValue === 'Present' ? '#FFFFFF' : boardingStatusValue === 'Absent' ? '#FFFFFF' : '#2E7D32'}
                                />
                                <Text
                                  style={[
                                    styles.attendanceBtnText,
                                    (isBoarded && boardingStatusValue === 'Present') || boardingStatusValue === 'Absent' ? styles.attendanceBtnTextActive : {}
                                  ]}
                                  numberOfLines={1}
                                >
                                  Boarding {isBoarded && boardingStatusValue ? `(${boardingStatusValue})` : ''}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color={isBoarded && boardingStatusValue === 'Present' ? '#FFFFFF' : boardingStatusValue === 'Absent' ? '#FFFFFF' : '#2E7D32'} />
                              </TouchableOpacity>
                            </View>

                            {/* Alighting Button with Dropdown */}
                            <View
                              style={styles.dropdownContainer}
                              ref={(ref) => { alightingButtonRef = ref; }}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.attendanceBtn,
                                  styles.alightingBtn,
                                  isAlighted && alightingStatusValue === 'Present' && styles.alightingBtnActive,
                                  alightingStatusValue === 'Absent' && styles.alightingBtnAbsent,
                                  ((!isBoarded || boardingStatusValue === 'Absent') && trip.status === 'InProgress') && styles.attendanceBtnDisabled
                                ]}
                                onPress={() => {
                                  if (showAlightingDropdown?.studentId === student.studentId) {
                                    setShowAlightingDropdown(null);
                                  } else {
                                    alightingButtonRef?.measureInWindow((x, y, width, height) => {
                                      setShowAlightingDropdown({
                                        studentId: student.studentId,
                                        stopSequence: stop.sequence,
                                        position: { x, y: y + height, width }
                                      });
                                      setShowBoardingDropdown(null);
                                    });
                                  }
                                }}
                                disabled={(!isBoarded || boardingStatusValue === 'Absent') && trip.status === 'InProgress'}
                              >
                                <Ionicons
                                  name={isAlighted ? 'checkmark-circle' : 'arrow-down-circle-outline'}
                                  size={18}
                                  color={isAlighted && alightingStatusValue === 'Present' ? '#FFFFFF' : alightingStatusValue === 'Absent' ? '#FFFFFF' : '#1976D2'}
                                />
                                <Text
                                  style={[
                                    styles.attendanceBtnText,
                                    (isAlighted && alightingStatusValue === 'Present') || alightingStatusValue === 'Absent' ? styles.attendanceBtnTextActive : {}
                                  ]}
                                  numberOfLines={1}
                                >
                                  Alighting {isAlighted && alightingStatusValue ? `(${alightingStatusValue})` : ''}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color={isAlighted && alightingStatusValue === 'Present' ? '#FFFFFF' : alightingStatusValue === 'Absent' ? '#FFFFFF' : '#1976D2'} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                    })
                ) : (
                  <Text style={styles.noStudentsText}>No students</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Report incident modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setReportModalVisible(false);
          setConfirmModalVisible(false);
        }}
      >
        <View style={styles.reportModalOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setReportModalVisible(false);
              setConfirmModalVisible(false);
            }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardContainer}
            pointerEvents="box-none"
          >
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.reportModalCard}>
                <View style={styles.reportModalHeader}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.reportModalTitle}>Send incident report</Text>
                    <Text style={styles.reportModalSubtitle}>
                      Use this only for safety issues or disruptions to the schedule.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => setReportModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.formLabel}>Reason</Text>
                <View style={styles.reasonChipsRow}>
                  {INCIDENT_REASONS.map((reason) => {
                    const active = reportReason === reason;
                    return (
                      <TouchableOpacity
                        key={reason}
                        style={[
                          styles.reasonChip,
                          active ? styles.reasonChipActive : {},
                        ]}
                        onPress={() => setReportReason(reason)}
                      >
                        <Text
                          style={[
                            styles.reasonChipText,
                            active ? styles.reasonChipTextActive : {},
                          ]}
                        >
                          {incidentReasonLabel[reason]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.formLabel}>Title (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Student is car sick, need quick stop"
                  value={reportTitle}
                  onChangeText={setReportTitle}
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="next"
                />

                <Text style={styles.formLabel}>Detailed description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Add context, location, and actions taken..."
                  multiline
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />

                {reportError ? <Text style={styles.errorText}>{reportError}</Text> : null}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => setReportModalVisible(false)}
                    disabled={reportSubmitting}
                  >
                    <Text style={styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handlePreviewConfirm}
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Send</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          {confirmModalVisible && (
            <View style={styles.confirmOverlay} pointerEvents="box-none">
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setConfirmModalVisible(false)}
              />
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalKeyboardContainer}
                pointerEvents="box-none"
              >
                <View style={styles.confirmCard}>
                  <Text style={styles.confirmTitle}>Confirm before sending</Text>
                  <Text style={styles.confirmSubtitle}>
                    Make sure the details are accurate, not duplicated, and the driver has been informed when relevant.
                  </Text>
                  <View style={styles.confirmBulletRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                    <Text style={styles.confirmBulletText}>Trip is in progress and needs assistance/recording.</Text>
                  </View>
                  <View style={styles.confirmBulletRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                    <Text style={styles.confirmBulletText}>Driver has been informed when relevant.</Text>
                  </View>
                  <View style={styles.confirmBulletRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                    <Text style={styles.confirmBulletText}>Information in the report is accurate.</Text>
                  </View>

                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setConfirmModalVisible(false)}
                      disabled={reportSubmitting}
                    >
                      <Text style={styles.secondaryBtnText}>Review details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleSubmitReport}
                      disabled={reportSubmitting}
                    >
                      {reportSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Send now</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          )}
        </View>
      </Modal>

      {/* Incident detail modal */}
      <Modal
        visible={incidentDetailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIncidentDetailVisible(false)}
      >
        <View style={styles.reportModalOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIncidentDetailVisible(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardContainer}
            pointerEvents="box-none"
          >
            {selectedIncident && (
              <View style={styles.detailCard}>
                    <View style={styles.detailHeader}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.detailTitle}>
                          {selectedIncident.reason === 'Other'
                            ? selectedIncident.title || 'Other'
                            : incidentReasonLabel[selectedIncident.reason] || selectedIncident.title || 'Incident'}
                        </Text>
                        <Text style={styles.detailSubtitle}>{formatDateTime(selectedIncident.createdAt)}</Text>
                        <View style={styles.detailTagRow}>
                          <View style={styles.incidentReasonChip}>
                            <Ionicons name="flag" size={12} color="#92400E" />
                            <Text style={styles.incidentReasonText}>{incidentReasonLabel[selectedIncident.reason]}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.incidentStatusBadge, { backgroundColor: incidentStatusColors[String(selectedIncident.status || '').toLowerCase() || 'open']?.bg || '#FFF4E5' }]}>
                        <Text style={[styles.incidentStatusText, { color: incidentStatusColors[String(selectedIncident.status || '').toLowerCase() || 'open']?.text || '#D97706' }]}>
                          {selectedIncident.status}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.closeButton, { marginLeft: 8 }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => setIncidentDetailVisible(false)}
                      >
                        <Ionicons name="close" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="bus" size={16} color="#6B7280" />
                      <Text style={styles.detailValue}>Vehicle: {selectedIncident.vehiclePlate || '-'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#6B7280" />
                      <Text style={styles.detailValue}>Service: {formatDateTime(selectedIncident.serviceDate)}</Text>
                    </View>

                    <View style={styles.detailDescriptionBox}>
                      <Text style={styles.detailSectionTitle}>Description</Text>
                      {incidentDetailLoading ? (
                        <ActivityIndicator size="small" color="#0EA5E9" />
                      ) : (
                        <Text style={styles.detailDescriptionText}>
                          {selectedIncident.description || 'No description provided.'}
                        </Text>
                      )}
                    </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal for Boarding Dropdown */}
      <Modal
        visible={showBoardingDropdown !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBoardingDropdown(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBoardingDropdown(null)}
        >
          {showBoardingDropdown && (() => {
            const student = trip.stops
              .flatMap(s => s.attendance || [])
              .find(a => a.studentId === showBoardingDropdown.studentId);
            const boardingStatusValue = boardingStatus[showBoardingDropdown.studentId];

            return (
              <View
                style={[
                  styles.modalDropdown,
                  {
                    top: showBoardingDropdown.position.y,
                    left: showBoardingDropdown.position.x,
                    width: showBoardingDropdown.position.width,
                  }
                ]}
                onStartShouldSetResponder={() => true}
              >
                <TouchableOpacity
                  style={[styles.dropdownItem, boardingStatusValue === 'Present' && styles.dropdownItemActive]}
                  onPress={() => {
                    if (student) {
                      handleBoardingStatus(showBoardingDropdown.studentId, showBoardingDropdown.stopSequence, 'Present');
                    }
                  }}
                >
                  <Text style={[styles.dropdownItemText, boardingStatusValue === 'Present' && styles.dropdownItemTextActive]}>Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dropdownItem, boardingStatusValue === 'Absent' && styles.dropdownItemActive]}
                  onPress={() => {
                    if (student) {
                      handleBoardingStatus(showBoardingDropdown.studentId, showBoardingDropdown.stopSequence, 'Absent');
                    }
                  }}
                >
                  <Text style={[styles.dropdownItemText, boardingStatusValue === 'Absent' && styles.dropdownItemTextActive]}>Absent</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </TouchableOpacity>
      </Modal>

      {/* Modal for Alighting Dropdown */}
      <Modal
        visible={showAlightingDropdown !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAlightingDropdown(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAlightingDropdown(null)}
        >
          {showAlightingDropdown && (() => {
            const student = trip.stops
              .flatMap(s => s.attendance || [])
              .find(a => a.studentId === showAlightingDropdown.studentId);
            const alightingStatusValue = alightingStatus[showAlightingDropdown.studentId];

            return (
              <View
                style={[
                  styles.modalDropdown,
                  {
                    top: showAlightingDropdown.position.y,
                    left: showAlightingDropdown.position.x,
                    width: showAlightingDropdown.position.width,
                  }
                ]}
                onStartShouldSetResponder={() => true}
              >
                <TouchableOpacity
                  style={[styles.dropdownItem, alightingStatusValue === 'Present' && styles.dropdownItemActive]}
                  onPress={() => {
                    if (student) {
                      handleAlightingStatus(showAlightingDropdown.studentId, showAlightingDropdown.stopSequence, 'Present');
                    }
                  }}
                >
                  <Text style={[styles.dropdownItemText, alightingStatusValue === 'Present' && styles.dropdownItemTextActive]}>Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dropdownItem, alightingStatusValue === 'Absent' && styles.dropdownItemActive]}
                  onPress={() => {
                    if (student) {
                      handleAlightingStatus(showAlightingDropdown.studentId, showAlightingDropdown.stopSequence, 'Absent');
                    }
                  }}
                >
                  <Text style={[styles.dropdownItemText, alightingStatusValue === 'Absent' && styles.dropdownItemTextActive]}>Absent</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#000000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripTime: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  statText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#666',
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
  },
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 15,
    color: '#333',
  },
  driverPhone: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#666',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 15,
    color: '#333',
  },
  vehicleDetail: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#666',
  },
  noInfoText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  stopGroup: {
    marginBottom: 16,
  },
  stopHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    minHeight: 24,
  },
  timelineContainer: {
    width: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  timelineDotStart: {
    backgroundColor: '#4CAF50',
  },
  timelineDotEnd: {
    backgroundColor: '#F44336',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    position: 'absolute',
    top: 10,
    bottom: -16, // Extend to next stop
  },
  stopInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  stopName: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 15,
    color: '#333',
  },
  stopStudents: {
    paddingLeft: 24, // Align with timeline content
    gap: 8,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  studentCardPresent: {
    borderColor: 'rgba(25, 118, 210, 0.35)',
    backgroundColor: '#E3F2FD',
  },
  studentCardAlighted: {
    borderColor: 'rgba(46, 125, 50, 0.35)',
    backgroundColor: '#F2FFF4',
  },
  studentCardAbsent: {
    borderColor: 'rgba(198, 40, 40, 0.35)',
    backgroundColor: '#FFF5F5',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#1F2933',
  },
  studentMeta: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  attendanceStatusRow: {
    marginTop: 4,
    gap: 2,
  },
  attendanceStatusText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 11,
    color: '#4B5563',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  statusPillPending: {
    backgroundColor: '#EFF6FF',
  },
  statusPillPresent: {
    backgroundColor: '#C8E6C9',
  },
  statusPillAlighted: {
    backgroundColor: '#BBDEFB',
  },
  statusPillAbsent: {
    backgroundColor: '#FFCDD2',
  },
  statusPillText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#374151',
  },
  statusPillTextActive: {
    color: '#1F2933',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 12,
    flexShrink: 0,
    marginTop: 12,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  attendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    minWidth: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalDropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 100,
    overflow: 'hidden',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 30,
    zIndex: 99999,
    overflow: 'visible',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemActive: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  boardingBtn: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FFF4',
  },
  alightingBtn: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  boardingBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  boardingBtnAbsent: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  alightingBtnActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  alightingBtnAbsent: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  presentBtn: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FFF4',
  },
  absentBtn: {
    borderColor: '#F44336',
    backgroundColor: '#FFF3F3',
  },
  presentBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  absentBtnActive: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  attendanceBtnText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#374151',
  },
  attendanceBtnTextActive: {
    color: '#FFFFFF',
  },
  attendanceBtnDisabled: {
    opacity: 0.5,
  },
  noStudentsText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#3d5a80',
    borderWidth: 0,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  reportButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  reportDisabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexWrap: 'wrap',
  },
  reportDisabledContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  reportDisabledText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  incidentLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
  },
  incidentLoadingText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#92400E',
  },
  incidentEmptyCard: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  incidentEmptyText: {
    flex: 1,
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#78716C',
    lineHeight: 18,
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  incidentIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  incidentTitle: {
    flex: 1,
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 15,
    color: '#0F172A',
    marginRight: 10,
  },
  incidentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  incidentStatusText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 11,
  },
  incidentMetaRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  incidentReasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEDD5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  incidentReasonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#92400E',
  },
  incidentMetaText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  incidentRouteText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#4B5563',
  },
  incidentDescriptionText: {
    marginTop: 4,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  detailCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
  },
  detailSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#6B7280',
  },
  detailTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#374151',
  },
  detailDescriptionBox: {
    marginTop: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailSectionTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 13,
    color: '#111827',
    marginBottom: 6,
  },
  detailDescriptionText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalScroll: {
    width: '100%',
  },
  modalScrollContent: {
    width: '100%',
    alignItems: 'center',
  },
  reportModalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  reportModalTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
  },
  reportModalSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginLeft: 8,
  },
  formLabel: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#374151',
    marginTop: 6,
  },
  reasonChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  reasonChipActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  reasonChipText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#374151',
  },
  reasonChipTextActive: {
    color: '#92400E',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#374151',
  },
  errorText: {
    color: '#DC2626',
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  confirmTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
  },
  confirmSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#4B5563',
  },
  confirmBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmBulletText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
});
