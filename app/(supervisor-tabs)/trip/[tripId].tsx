import { getSupervisorTripDetail, updateAttendance } from '@/lib/supervisor/supervisor.api';
import { SupervisorTripDetailDto } from '@/lib/supervisor/supervisor.types';
import type { Guid } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Params = { tripId?: Guid };

// Extract time directly from string to avoid timezone shifts
const formatTime = (iso: string) => {
  if (!iso) return '--:--';
  try {
    // Check if it's an ISO string with 'T'
    if (iso.includes('T')) {
      return iso.split('T')[1].substring(0, 5);
    }
    // Fallback for other formats or if it's already a time
    const date = new Date(iso);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
  const colors: Record<string, string> = {
    Scheduled: '#E8F5E8',
    InProgress: '#E3F2FD',
    Completed: '#F3E5F5',
    Delayed: '#FFF3E0',
    Cancelled: '#FFEBEE',
  };
  return colors[status] || '#F3F4F6';
};

const getStatusTextColor = (status: string): string => {
  const colors: Record<string, string> = {
    Scheduled: '#4CAF50',
    InProgress: '#2196F3',
    Completed: '#9C27B0',
    Delayed: '#FF9800',
    Cancelled: '#F44336',
  };
  return colors[status] || '#6B7280';
};

export default function SupervisorTripDetailScreen() {
  const { tripId } = useLocalSearchParams<Params>();
  const [trip, setTrip] = React.useState<SupervisorTripDetailDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [attendanceStatus, setAttendanceStatus] = React.useState<Record<string, 'present' | 'absent' | null>>({});
  const insets = useSafeAreaInsets();

  const loadTripData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Get trip detail from supervisor API
      if (!tripId) return;
      const tripData = await getSupervisorTripDetail(tripId);

      setTrip(tripData);

      // Initialize attendance status for all students from stops
      const initialStatus: Record<string, 'present' | 'absent' | null> = {};
      tripData.stops.forEach(stop => {
        if (stop.attendance && Array.isArray(stop.attendance)) {
          stop.attendance.forEach((attendance) => {
            const studentId = attendance.studentId;
            if (studentId) {
              const state = attendance.state;
              if (state === 'Present' || state === 'Boarded') {
                initialStatus[studentId] = 'present';
              } else if (state === 'Absent') {
                initialStatus[studentId] = 'absent';
              } else {
                initialStatus[studentId] = null;
              }
            }
          });
        }
      });
      setAttendanceStatus(initialStatus);
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

  const handleAttendance = async (studentId: string, status: 'present' | 'absent') => {
    if (!trip || !tripId) {
      Alert.alert('Error', 'Trip information is missing');
      return;
    }

    // Optimistically update UI
    const newStatus = attendanceStatus[studentId] === status ? null : status;
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: newStatus
    }));

    // Find the stop that contains this student
    let stopId: string | undefined;
    for (const stop of trip.stops) {
      if (stop.attendance) {
        const attendance = stop.attendance.find(a => a.studentId === studentId);
        if (attendance) {
          stopId = stop.id;
          break;
        }
      }
    }

    if (!stopId) {
      Alert.alert('Error', 'Could not find student stop information');
      // Revert UI change
      setAttendanceStatus(prev => ({
        ...prev,
        [studentId]: attendanceStatus[studentId]
      }));
      return;
    }

    // Call API to update attendance
    try {
      const apiState = newStatus === 'present' ? 'Present' : newStatus === 'absent' ? 'Absent' : null;
      if (apiState) {
        await updateAttendance(tripId, stopId, studentId, apiState);
        // Success - UI already updated
      } else {
        // If status is null, we might want to clear attendance
        // For now, just keep the UI update
      }
    } catch (error: any) {
      console.error('Error updating attendance:', error);

      // Revert UI change on error
      setAttendanceStatus(prev => ({
        ...prev,
        [studentId]: attendanceStatus[studentId]
      }));

      Alert.alert(
        'Error',
        error.message || 'Failed to update attendance. Please try again.'
      );
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

  // Calculate total students
  const totalStudents = trip.stops.reduce((acc, stop) => acc + (stop.attendance?.length || 0), 0);

  // Calculate completed stops (stops with actualDeparture)
  const completedStops = trip.stops.filter(s => s.actualDeparture).length;

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
              Trip Details
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
                {formatTime(trip.plannedStartAt)} - {formatTime(trip.plannedEndAt)}
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
              <Text style={{ fontWeight: 'bold' }}>{completedStops}</Text> Completed
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
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
                  <Text style={styles.stopName}>Stop {stop.sequence}: {stop.name}</Text>
                  {/* Removed planned time as requested */}
                </View>
              </View>

              {/* Students List for this stop */}
              <View style={styles.stopStudents}>
                {stop.attendance && stop.attendance.length > 0 ? (
                  stop.attendance.map((student) => {
                    const currentStatus = attendanceStatus[student.studentId];
                    return (
                      <View
                        key={student.studentId}
                        style={[
                          styles.studentCard,
                          currentStatus === 'present' && styles.studentCardPresent,
                          currentStatus === 'absent' && styles.studentCardAbsent
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
                              {(student.className || 'No class info') + ` • Stop ${stop.sequence}`}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              currentStatus === 'present'
                                ? styles.statusPillPresent
                                : currentStatus === 'absent'
                                ? styles.statusPillAbsent
                                : styles.statusPillPending
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                currentStatus === 'present' && styles.statusPillTextActive,
                                currentStatus === 'absent' && styles.statusPillTextActive
                              ]}
                            >
                              {currentStatus === 'present'
                                ? 'Checked-in'
                                : currentStatus === 'absent'
                                ? 'Absent'
                                : 'Pending'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.attendanceButtons}>
                          <TouchableOpacity
                            style={[
                              styles.attendanceBtn,
                              styles.presentBtn,
                              currentStatus === 'present' && styles.presentBtnActive
                            ]}
                            onPress={() => handleAttendance(student.studentId, 'present')}
                          >
                            <Ionicons
                              name={currentStatus === 'present' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                              size={18}
                              color={currentStatus === 'present' ? '#FFFFFF' : '#2E7D32'}
                            />
                            <Text
                              style={[
                                styles.attendanceBtnText,
                                currentStatus === 'present' && styles.attendanceBtnTextActive
                              ]}
                            >
                              Present
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.attendanceBtn,
                              styles.absentBtn,
                              currentStatus === 'absent' && styles.absentBtnActive
                            ]}
                            onPress={() => handleAttendance(student.studentId, 'absent')}
                          >
                            <Ionicons
                              name={currentStatus === 'absent' ? 'close-circle' : 'close-circle-outline'}
                              size={18}
                              color={currentStatus === 'absent' ? '#FFFFFF' : '#C62828'}
                            />
                            <Text
                              style={[
                                styles.attendanceBtnText,
                                currentStatus === 'absent' && styles.attendanceBtnTextActive
                              ]}
                            >
                              Absent
                            </Text>
                          </TouchableOpacity>
                        </View>
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
    gap: 30,
    flexShrink: 0,
    marginTop: 12,
  },
  attendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
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
  noStudentsText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
});
