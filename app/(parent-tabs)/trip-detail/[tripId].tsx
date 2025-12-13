import { StudentAvatar } from '@/components/StudentAvatar';
import { UserAvatar } from '@/components/UserAvatar';
import type { ParentTripChild, ParentTripDto } from '@/lib/trip/parentTrip.types';
import { getParentTripDetail } from '@/lib/trip/trip.api';
import type { Guid } from '@/lib/types';
import { userAccountApi } from '@/lib/userAccount/userAccount.api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Params = { tripId?: Guid; childId?: Guid };

export default function ParentTripDetailScreen() {
  const { tripId, childId } = useLocalSearchParams<Params>();
  const [trip, setTrip] = useState<ParentTripDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverAvatarUrl, setDriverAvatarUrl] = useState<string | null>(null);
  const [supervisorAvatarUrl, setSupervisorAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      router.back();
      return;
    }

    (async () => {
      try {
        const data = await getParentTripDetail(tripId);
        if (!data) {
          setLoading(false);
          return;
        }

        setTrip(data);

        // Load driver avatar URL directly (UserAvatar component will handle authentication and fallback)
        if (data.driver?.id) {
          setDriverAvatarUrl(userAccountApi.getAvatarUrl(data.driver.id));
        }
        // Load supervisor avatar URL
        if (data.supervisor?.id) {
          setSupervisorAvatarUrl(userAccountApi.getAvatarUrl(data.supervisor.id));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  const formatTime = (iso: string): string => {
    const date = new Date(iso);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const studentAttendance: ParentTripChild | null = useMemo(() => {
    if (!trip) return null;

    const targetChildId = (childId as string) || trip.childId;
    
    // First, try to find from trip.children
    if (trip.children && trip.children.length > 0) {
      const matchFromChildren = trip.children.find(c => c.id === targetChildId);
      if (matchFromChildren) return matchFromChildren;
    }
    
    // Fallback to attendance from stops
    const allAttendance =
      trip.stops?.flatMap(stop => stop.attendance || []) || [];
    const match = allAttendance.find(a => a.id === targetChildId);
    return match || null;
  }, [trip, childId]);

  const formatLocalTime = (iso?: string | null) => {
    if (!iso) return '--';
    const date = new Date(iso);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'InProgress':
        return '#f3b610ff'; // Green
      case 'Completed':
        return '#4CAF50'; // Blue
      case 'Scheduled':
        return '#2196F3'; // Orange
      case 'Cancelled':
        return '#FF5722'; // Red
      case 'Delayed':
        return '#F44336'; // Deep Orange
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFDD00" />
          <Text style={styles.loadingText}>Loading trip detail...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const driver = trip.driver;
  const supervisor = trip.supervisor;
  const vehicle = trip.vehicle;
  const activeStudentName = studentAttendance?.name ?? trip.childName;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.replace('/(parent-tabs)/trips/calendar')}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#000000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Trip Detail</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Driver Information */}
        {driver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver</Text>
            <View style={styles.infoCard}>
              <View style={styles.driverRow}>
                <View style={{ marginRight: 12 }}>
                  <UserAvatar
                    avatarUrl={driverAvatarUrl}
                    userId={trip.driver?.id}
                    userName={trip.driver?.fullName}
                    size={64}
                    showBorder={false}
                  />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.fullName}</Text>
                  <Text style={styles.driverText}>Phone: {driver.phone}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Supervisor Information */}
        {supervisor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supervisor</Text>
            <View style={styles.infoCard}>
              <View style={styles.driverRow}>
                <View style={{ marginRight: 12 }}>
                  <UserAvatar
                    avatarUrl={supervisorAvatarUrl}
                    userId={trip.supervisor?.id}
                    userName={trip.supervisor?.fullName}
                    size={64}
                    showBorder={false}
                  />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{supervisor.fullName}</Text>
                  <Text style={styles.driverText}>Phone: {supervisor.phone}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Vehicle Information */}
        {vehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <View style={styles.infoCard}>
              <View style={styles.vehicleRow}>
                <View style={styles.vehicleIcon}>
                  <Ionicons name="bus" size={32} color="#000000" />
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehiclePlate}>{vehicle.maskedPlate}</Text>
                  <Text style={styles.vehicleText}>Type: School bus</Text>
                  <Text style={styles.vehicleText}>Size: {vehicle.capacity} seats</Text>
                  <Text style={styles.vehicleText}>Status: {vehicle.status}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Trip Detail Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Detail Information</Text>
          <View style={styles.statusCard}>
            <View style={[styles.statusHeader, { backgroundColor: getStatusColor(trip.status) }]}>
              <Text style={styles.statusHeaderText}>Status: {getStatusText(trip.status)}</Text>
            </View>
            <View style={styles.statusBody}>
              <View style={styles.studentInfoRow}>
                <StudentAvatar
                  studentId={studentAttendance?.id || trip.childId}
                  studentName={activeStudentName}
                  size={48}
                  showBorder={false}
                  style={styles.studentAvatar}
                />
                <Text style={styles.studentLabel}>
                  {activeStudentName}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Trip Time:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(trip.plannedStartAt)} - {formatTime(trip.plannedEndAt)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="map" size={18} color="#6B7280" />
                <Text style={styles.detailLabel}>Route Name:</Text>
                <Text style={styles.detailValue}>{trip.scheduleName}</Text>
              </View>

              {trip.childClassName && (
                <View style={styles.detailRow}>
                  <Ionicons name="school" size={18} color="#6B7280" />
                  <Text style={styles.detailLabel}>Class:</Text>
                  <Text style={styles.detailValue}>{trip.childClassName}</Text>
                </View>
              )}

              <View style={styles.attendanceSection}>
                {/* Boarding Information */}
                <View style={styles.attendanceBox}>
                  <View style={styles.attendanceHeader}>
                    <Ionicons name="log-in-outline" size={20} color="#4CAF50" />
                    <Text style={styles.attendanceHeaderText}>Boarding</Text>
                  </View>
                  <View style={styles.attendanceContent}>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>Status:</Text>
                      <Text style={[styles.attendanceValue, { color: '#4CAF50' }]}>
                        {studentAttendance?.boardStatus ||
                          (studentAttendance?.boardedAt ? 'Present' : 'Not Yet')}
                      </Text>
                    </View>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>Time:</Text>
                      <Text style={styles.attendanceValue}>
                        {formatLocalTime(studentAttendance?.boardedAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Alighting Information */}
                <View style={styles.attendanceBox}>
                  <View style={styles.attendanceHeader}>
                    <Ionicons name="log-out-outline" size={20} color="#2196F3" />
                    <Text style={styles.attendanceHeaderText}>Alighting</Text>
                  </View>
                  <View style={styles.attendanceContent}>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>Status:</Text>
                      <Text style={[styles.attendanceValue, { color: '#2196F3' }]}>
                        {studentAttendance?.alightStatus ||
                          (studentAttendance?.alightedAt ? 'Present' : 'Not Yet')}
                      </Text>
                    </View>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>Time:</Text>
                      <Text style={styles.attendanceValue}>
                        {formatLocalTime(studentAttendance?.alightedAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: '#FCDC44',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 0,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEFA0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#FFF8CF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  driverText: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Medium',
    color: '#4B5563',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#FFF1B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  vehicleText: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Medium',
    color: '#4B5563',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  statusHeader: {
    backgroundColor: '#3B7F3B',
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusHeaderText: {
    fontSize: 15,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
  },
  statusBody: {
    padding: 16,
    backgroundColor: '#FFF8CF',
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  studentLabel: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Medium',
    color: '#4B5563',
    marginLeft: 6,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    flexShrink: 1,
  },
  attendanceSection: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  attendanceBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fcc71bff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  attendanceHeaderText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    color: '#1F2937',
  },
  attendanceContent: {
    padding: 12,
    gap: 8,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 11,
    fontFamily: 'RobotoSlab-Medium',
    color: '#6B7280',
  },
  attendanceValue: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Bold',
    color: '#1F2937',
  },
});
