import { StopsReorderedEvent } from '@/lib/signalr/signalr.types';
import { tripHubService } from '@/lib/signalr/tripHub.service';
import { getSupervisorTripDetail, submitManualAttendance } from '@/lib/supervisor/supervisor.api';
import { SupervisorTripDetailDto } from '@/lib/supervisor/supervisor.types';
import type { Guid } from '@/lib/types';
import { toHourMinute } from '@/utils/date.utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

// Format time for planned times (no timezone conversion)
const formatPlannedTime = (iso: string) => {
  if (!iso) return '--:--';
  try {
    const date = new Date(iso);
    const timeString = date.toLocaleString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    return timeString;
  } catch {
    return '--:--';
  }
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '');
  return letters.join('');
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

export default function SupervisorTripDetailScreen() {
  const { tripId } = useLocalSearchParams<Params>();
  const [trip, setTrip] = React.useState<SupervisorTripDetailDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [boardingStatus, setBoardingStatus] = React.useState<Record<string, 'Present' | 'Absent' | null>>({});
  const [alightingStatus, setAlightingStatus] = React.useState<Record<string, 'Present' | 'Absent' | null>>({});
  const [showBoardingDropdown, setShowBoardingDropdown] = React.useState<{ studentId: string; stopSequence: number; position: { x: number; y: number; width: number } } | null>(null);
  const [showAlightingDropdown, setShowAlightingDropdown] = React.useState<{ studentId: string; stopSequence: number; position: { x: number; y: number; width: number } } | null>(null);
  const insets = useSafeAreaInsets();

  const loadTripData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Get trip detail from supervisor API
      if (!tripId) return;
      const tripData = await getSupervisorTripDetail(tripId);

      setTrip(tripData);

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

  // Load trip data
  React.useEffect(() => {
    if (!tripId) {
      Alert.alert('Error', 'Trip ID is missing', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    loadTripData();
  }, [tripId, loadTripData]);

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
      await submitManualAttendance(tripId, stopSequence, studentId, status, null);
      await loadTripData();
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
      await submitManualAttendance(tripId, stopSequence, studentId, null, status);
      await loadTripData();
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
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          // Close dropdowns when scrolling
          setShowBoardingDropdown(null);
          setShowAlightingDropdown(null);
        }}
      >
        {/* Driver & Vehicle Info */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Driver & Vehicle</Text>
          <View style={styles.card}>
            {trip.driver ? (
              <View style={styles.driverRow}>
                <View style={styles.driverAvatar}>
                  <Ionicons name="person" size={20} color="#6B7280" />
                </View>
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
                          <View style={styles.studentAvatar}>
                            <Text style={styles.studentAvatarText}>{getInitials(student.studentName)}</Text>
                          </View>
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
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#C47F00',
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
});
