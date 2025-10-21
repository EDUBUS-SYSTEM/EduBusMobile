import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DriverTrip } from '../../../lib/api/driverSchedule';

interface DayModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  trips: DriverTrip[];
}

const { height: screenHeight } = Dimensions.get('window');

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'Scheduled':
      return '#E8F5E8';
    case 'InProgress':
      return '#E3F2FD';
    case 'Completed':
      return '#F3E5F5';
    case 'Delayed':
      return '#FFF3E0';
    case 'Cancelled':
      return '#FFEBEE';
    default:
      return '#F5F5F5';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Scheduled':
      return '#4CAF50';
    case 'InProgress':
      return '#2196F3';
    case 'Completed':
      return '#9C27B0';
    case 'Delayed':
      return '#FF9800';
    case 'Cancelled':
      return '#F44336';
    default:
      return '#757575';
  }
};

export default function DayModal({ visible, onClose, date, trips }: DayModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const isTripDisabled = (trip: DriverTrip) => {
    return trip.status === 'Cancelled';
  };

  const sortedTrips = [...trips].sort((a, b) => 
    new Date(a.plannedStartAt).getTime() - new Date(b.plannedStartAt).getTime()
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{formatDate(date)}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {sortedTrips.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No trips scheduled for this day</Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {sortedTrips.map((trip, index) => (
                  <View key={trip.id} style={styles.tripCard}>
                    <View style={styles.timelineIndicator}>
                      <View style={styles.timelineDot} />
                      {index < sortedTrips.length - 1 && <View style={styles.timelineLine} />}
                    </View>

                    <View style={[
                      styles.tripContent,
                      isTripDisabled(trip) && styles.disabledTrip
                    ]}>
                      <View style={styles.tripHeader}>
                        <View style={styles.timeContainer}>
                          <Text style={styles.tripTime}>
                            {formatTime(trip.plannedStartAt)} – {formatTime(trip.plannedEndAt)}
                          </Text>
                          <Text style={styles.tripCode}>Route: {trip.scheduleSnapshot.name}</Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusBgColor(trip.status) }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(trip.status) }
                          ]}>
                            {trip.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <Text style={styles.detailText}>
                          Start: {formatTime(trip.plannedStartAt)}
                        </Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailText}>
                          End: {formatTime(trip.plannedEndAt)}
                        </Text>
                      </View>
                      {trip.isOverride && (
                        <View style={styles.overrideInfo}>
                          <Text style={styles.overrideText}>
                            Override: {trip.overrideReason}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: screenHeight * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1091FF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'RobotoSlab-Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    maxHeight: screenHeight * 0.6,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'RobotoSlab-Regular',
    marginTop: 16,
    textAlign: 'center',
  },
  timeline: {
    padding: 20,
  },
  tripCard: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F9A826',
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  tripContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F9A826',
  },
  disabledTrip: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeContainer: {
    flex: 1,
  },
  tripTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 4,
  },
  tripCode: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'RobotoSlab-Medium',
  },
  detailsRow: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Regular',
    marginBottom: 4,
  },
  overrideInfo: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  overrideText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'RobotoSlab-Medium',
  },
});