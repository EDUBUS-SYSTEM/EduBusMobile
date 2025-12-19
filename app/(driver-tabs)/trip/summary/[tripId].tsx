import { DriverTripDto, DriverTripStopAttendanceDto, DriverTripStopDto } from '@/lib/trip/driverTrip.types';
import { getTripDetail } from '@/lib/trip/trip.api';
import type { Guid } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Params = { tripId?: Guid };

const formatTime = (iso: string | null | undefined) => {
    if (!iso) return '--:--';
    const date = new Date(iso);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const formatDuration = (start: string | undefined, end: string | undefined) => {
    if (!start || !end) return '--';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
};

const getStatusColor = (status: string | null) => {
    switch (status) {
        case 'Manual':
        case 'FaceRecognition':
            return '#10B981';
        case 'Absent':
            return '#EF4444';
        default:
            return '#9CA3AF';
    }
};

const getStatusIcon = (status: string | null): keyof typeof Ionicons.glyphMap => {
    switch (status) {
        case 'Manual':
        case 'FaceRecognition':
            return 'checkmark-circle';
        case 'Absent':
            return 'close-circle';
        default:
            return 'help-circle';
    }
};

export default function TripSummaryScreen() {
    const { tripId } = useLocalSearchParams<Params>();
    const [trip, setTrip] = useState<DriverTripDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedStops, setExpandedStops] = useState<Set<string>>(new Set());

    React.useEffect(() => {
        const loadTrip = async () => {
            if (!tripId) {
                router.back();
                return;
            }
            try {
                const tripData = await getTripDetail(tripId);
                setTrip(tripData);
                const allStopIds = new Set(tripData.stops.map(s => s.stopPointId));
                setExpandedStops(allStopIds);
            } catch (error) {
                console.error('Error loading trip:', error);
                router.back();
            } finally {
                setLoading(false);
            }
        };
        loadTrip();
    }, [tripId]);

    const toggleStop = (stopId: string) => {
        setExpandedStops(prev => {
            const next = new Set(prev);
            if (next.has(stopId)) {
                next.delete(stopId);
            } else {
                next.add(stopId);
            }
            return next;
        });
    };

    const renderStudentCard = (student: DriverTripStopAttendanceDto) => (
        <View key={student.studentId} style={styles.studentCard}>
            <View style={styles.studentHeader}>
                <View style={styles.studentAvatar}>
                    <Ionicons name="person" size={20} color="#6B7280" />
                </View>
                <Text style={styles.studentName}>{student.studentName}</Text>
            </View>
            <View style={styles.studentStatus}>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Board:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.boardStatus) + '20' }]}>
                        <Ionicons
                            name={getStatusIcon(student.boardStatus)}
                            size={14}
                            color={getStatusColor(student.boardStatus)}
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(student.boardStatus) }]}>
                            {student.boardStatus || 'N/A'} {student.boardedAt ? formatTime(student.boardedAt) : ''}
                        </Text>
                    </View>
                </View>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Alight:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.alightStatus) + '20' }]}>
                        <Ionicons
                            name={getStatusIcon(student.alightStatus)}
                            size={14}
                            color={getStatusColor(student.alightStatus)}
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(student.alightStatus) }]}>
                            {student.alightStatus || 'N/A'} {student.alightedAt ? formatTime(student.alightedAt) : ''}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderStopCard = (stop: DriverTripStopDto) => {
        const isExpanded = expandedStops.has(stop.stopPointId);
        return (
            <View key={stop.stopPointId} style={styles.stopCard}>
                <TouchableOpacity
                    style={styles.stopHeader}
                    onPress={() => toggleStop(stop.stopPointId)}
                    activeOpacity={0.7}
                >
                    <View style={styles.stopInfo}>
                        <View style={styles.stopBadge}>
                            <Text style={styles.stopBadgeText}>{stop.sequenceOrder}</Text>
                        </View>
                        <View style={styles.stopDetails}>
                            <Text style={styles.stopName}>{stop.stopPointName}</Text>
                            <Text style={styles.stopTime}>
                                Arrived: {formatTime(stop.arrivedAt)} • Departed: {formatTime(stop.departedAt)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.stopStats}>
                        <Text style={styles.stopStatsText}>{stop.presentStudents}/{stop.totalStudents}</Text>
                        <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#6B7280"
                        />
                    </View>
                </TouchableOpacity>
                {isExpanded && stop.attendance && stop.attendance.length > 0 && (
                    <View style={styles.studentsContainer}>
                        {stop.attendance.map(renderStudentCard)}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFDD00" />
                <Text style={styles.loadingText}>Loading summary...</Text>
            </View>
        );
    }

    if (!trip) return null;

    const sortedStops = [...trip.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const totalStudents = trip.stops.reduce((sum, s) => sum + s.totalStudents, 0);
    const presentStudents = trip.stops.reduce((sum, s) => sum + s.presentStudents, 0);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFDD00', '#FFDD00']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/(driver-tabs)/trips-today')}
                >
                    <Ionicons name="arrow-back" size={22} color="#000000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trip Summary</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.tripInfoCard}>
                    <View style={styles.tripTypeRow}>
                        <View style={[styles.tripTypeBadge, { backgroundColor: trip.tripType === 1 ? '#3B82F6' : '#8B5CF6' }]}>
                            <Text style={styles.tripTypeBadgeText}>
                                {trip.tripType === 1 ? 'Departure' : 'Return'}
                            </Text>
                        </View>
                        <View style={[styles.statusBadgeComplete]}>
                            <Text style={styles.statusBadgeCompleteText}>Completed</Text>
                        </View>
                    </View>
                    <Text style={styles.scheduleName}>{trip.scheduleName}</Text>
                    <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.timeText}>
                            {formatTime(trip.startTime)} → {formatTime(trip.endTime)}
                        </Text>
                        <Text style={styles.durationText}>
                            ({formatDuration(trip.startTime, trip.endTime)})
                        </Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{trip.completedStops}/{trip.totalStops}</Text>
                        <Text style={styles.statLabel}>Stops</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{totalStudents}</Text>
                        <Text style={styles.statLabel}>Students</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Stops & Attendance</Text>
                {sortedStops.map(renderStopCard)}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        marginTop: 12,
        fontFamily: 'RobotoSlab-Regular',
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 20,
        color: '#000000',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    tripInfoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tripTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    tripTypeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tripTypeBadgeText: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 12,
        color: '#FFFFFF',
    },
    statusBadgeComplete: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#10B981',
    },
    statusBadgeCompleteText: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 12,
        color: '#FFFFFF',
    },
    scheduleName: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 18,
        color: '#111827',
        marginBottom: 8,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        fontFamily: 'RobotoSlab-Regular',
        fontSize: 14,
        color: '#374151',
    },
    durationText: {
        fontFamily: 'RobotoSlab-Regular',
        fontSize: 14,
        color: '#6B7280',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 24,
        color: '#111827',
    },
    statLabel: {
        fontFamily: 'RobotoSlab-Regular',
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },
    sectionTitle: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 16,
        color: '#374151',
        marginBottom: 12,
    },
    stopCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    stopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#FAFAFA',
    },
    stopInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    stopBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFDD00',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stopBadgeText: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 14,
        color: '#000000',
    },
    stopDetails: {
        flex: 1,
    },
    stopName: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 14,
        color: '#111827',
    },
    stopTime: {
        fontFamily: 'RobotoSlab-Regular',
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    stopStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stopStatsText: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 14,
        color: '#10B981',
    },
    studentsContainer: {
        padding: 12,
        paddingTop: 0,
        gap: 8,
    },
    studentCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    studentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    studentName: {
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 14,
        color: '#111827',
    },
    studentStatus: {
        gap: 6,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusLabel: {
        fontFamily: 'RobotoSlab-Regular',
        fontSize: 12,
        color: '#6B7280',
        width: 45,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    statusText: {
        fontFamily: 'RobotoSlab-Regular',
        fontSize: 12,
    },
});
