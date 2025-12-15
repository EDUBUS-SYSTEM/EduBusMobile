import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import DayModal from '@/components/driverSchedule/DayModal';
import { academicCalendarApi, AcademicSemester } from '../../lib/academicCalendar/academicCalendar.api';
import { authApi } from '../../lib/auth/auth.api';
import { getSupervisorScheduleByRangeAsDriverTrip } from '../../lib/supervisor/supervisor.api';
import { DriverSchedule, DriverTrip } from '../../lib/trip-mock-data/driverSchedule';
import { DriverTripDto } from '../../lib/trip/driverTrip.types';
import { formatDateWithWeekday } from '@/utils/date.utils';

export default function SupervisorScheduleScreen() {
  const [schedule, setSchedule] = useState<DriverSchedule>({ dots: [], byDate: {} });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [selectedSemesterCode, setSelectedSemesterCode] = useState<string>('');

  const loadSemesters = useCallback(async () => {
    try {
      const loadedSemesters = await academicCalendarApi.getActiveSemesters();
      setSemesters(loadedSemesters);
    } catch (error: any) {
      console.error('Error loading semesters:', error);
      // Handle error silently for now
    }
  }, []);

  const loadSchedule = useCallback(async (semesterCode: string, startDate: string, endDate: string) => {
    try {
      setLoading(true);
      const userInfo = await authApi.getUserInfo();
      const supervisorId = userInfo.userId;

      if (!supervisorId) {
        console.warn('Supervisor ID not found');
        return;
      }

      // Try to get schedule from API first
      try {
        const apiTrips = await getSupervisorScheduleByRangeAsDriverTrip(supervisorId, startDate, endDate);

        if (apiTrips && apiTrips.length > 0) {
          // Convert DriverTripDto[] to DriverTrip[] format for DriverSchedule
          const byDate: Record<string, DriverTrip[]> = {};
          const dots: { date: string; dots: { color: string; selectedDotColor?: string }[] }[] = [];

          apiTrips.forEach((trip: DriverTripDto) => {
            const date = trip.serviceDate ? trip.serviceDate.split('T')[0] : new Date(trip.plannedStartAt).toISOString().split('T')[0];
            if (!byDate[date]) {
              byDate[date] = [];
            }

            // Convert DriverTripDto to DriverTrip format
            const driverTrip: DriverTrip = {
              id: trip.id,
              routeId: trip.routeId,
              serviceDate: trip.serviceDate,
              plannedStartAt: trip.plannedStartAt,
              plannedEndAt: trip.plannedEndAt,
              startTime: trip.startTime,
              endTime: trip.endTime,
              status: trip.status,
              scheduleSnapshot: {
                scheduleId: trip.id,
                name: trip.scheduleName || 'Unknown Schedule',
                startTime: trip.plannedStartAt.split('T')[1]?.split('.')[0] || '07:30',
                endTime: trip.plannedEndAt.split('T')[1]?.split('.')[0] || '08:30',
                rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
              },
              stops: trip.stops.map((stop) => ({
                stopId: stop.stopPointId,
                name: stop.stopPointName || stop.address,
                plannedArrival: stop.plannedAt,
                status: stop.departedAt ? 'completed' : 'pending',
              })),
              isOverride: trip.isOverride,
              overrideReason: trip.overrideReason,
              overrideCreatedBy: trip.overrideCreatedBy || '',
              overrideCreatedAt: trip.overrideCreatedAt || ''
            };

            byDate[date].push(driverTrip);
          });

          // Create dots for dates with trips
          Object.keys(byDate).forEach(date => {
            const tripCount = byDate[date].length;
            const dotColors = ['#4ECDC4', '#FF6B6B', '#45B7D1', '#FFEAA7', '#DDA0DD'];
            const dateDots = [];

            for (let i = 0; i < Math.min(tripCount, 5); i++) {
              dateDots.push({
                color: dotColors[i] || dotColors[4],
                selectedDotColor: '#F9A826'
              });
            }

            dots.push({ date, dots: dateDots });
          });

          setSchedule({ dots, byDate });
          return;
        }
      } catch (apiError) {
        console.warn('API call failed, falling back to mock data:', apiError);
      }

      // If supervisor API fails, don't call driver-only endpoints (causes 403)
      // Instead, clear current data so UI stays consistent with supervisor role
      setSchedule({ dots: [], byDate: {} });
    } catch (error: any) {
      console.error('Error loading schedule:', error);
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, []);


  const handleDateSelect = (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    setModalVisible(true);
  };

  const handleSemesterPress = async (semester: AcademicSemester) => {
    setSelectedSemesterCode(semester.code);
    const startDate = semester.startDate.split('T')[0];
    const endDate = semester.endDate.split('T')[0];
    await loadSchedule(semester.code, startDate, endDate);
  };

  const createMarkedDates = () => {
    const marked: Record<string, any> = {};

    for (const { date, dots } of schedule.dots) {
      marked[date] = {
        marked: true,
        dots: dots,
        selected: selectedDate === date,
        selectedColor: '#F9A826',
        selectedTextColor: '#FFFFFF',
      };
    }

    return marked;
  };

  React.useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  React.useEffect(() => {
    if (semesters.length > 0) {
      const firstSemester = semesters[0];
      setSelectedSemesterCode(firstSemester.code);
      loadSchedule(firstSemester.code, firstSemester.startDate.split('T')[0], firstSemester.endDate.split('T')[0]);
    }
  }, [semesters, loadSchedule]);

  return (
    <View style={styles.container}>
      {/* Header Section with Yellow Circles Background */}
      <View
        style={{
          paddingTop: 40,
          paddingBottom: 40,
          paddingHorizontal: 24,
          position: "relative",
          minHeight: 200,
          backgroundColor: "transparent",
        }}
      >
        {/* Yellow Circles Background */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {/* Circle 1 - Top Left */}
          <View
            style={{
              position: "absolute",
              top: -40,
              left: -100,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />

          {/* Circle 2 - Top Right */}
          <View
            style={{
              position: "absolute",
              top: -30,
              left: 40,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />

          {/* Circle 3 - Bottom Left */}
          <View
            style={{
              position: "absolute",
              top: -30,
              left: 180,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: -40,
              left: 320,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />

          {/* Circle 4 - Bottom Right */}
          <View
            style={{
              position: "absolute",
              top: -90,
              right: 180,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
          {/* Circle 5 - Bottom Right */}
          <View
            style={{
              position: "absolute",
              top: -90,
              right: 40,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
          {/* Circle 6 - Bottom Right */}
          <View
            style={{
              position: "absolute",
              top: -90,
              right: 320,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: -90,
              right: -100,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
        </View>

        {/* Header Content */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#000000' }]}>Schedules</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Curved White Border */}
        <View
          style={{
            position: "absolute",
            bottom: -30,
            left: 0,
            right: 0,
            height: 40,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
        />
      </View>

      <View style={styles.content}>
        {/* Semester Selection */}
        {semesters.length > 0 && (
          <View style={styles.chipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {semesters.map((semester) => (
                <TouchableOpacity
                  key={semester.code}
                  style={[
                    styles.chip,
                    selectedSemesterCode === semester.code ? styles.chipActive : null
                  ]}
                  onPress={() => handleSemesterPress(semester)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedSemesterCode === semester.code ? styles.chipTextActive : null
                  ]}>
                    {semester.name.length > 20 ? semester.name.substring(0, 20) + '...' : semester.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Calendar Card */}
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#F9A826',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#F9A826',
              dayTextColor: '#111827',
              textDisabledColor: '#D1D5DB',
              arrowColor: '#F9A826',
              disabledArrowColor: '#D1D5DB',
              monthTextColor: '#111827',
              indicatorColor: '#F9A826',
              textDayFontFamily: 'RobotoSlab-Regular',
              textMonthFontFamily: 'RobotoSlab-Bold',
              textDayHeaderFontFamily: 'RobotoSlab-Medium',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            markingType="dot"
            markedDates={createMarkedDates()}
            onDayPress={handleDateSelect}
            enableSwipeMonths={true}
            hideExtraDays={true}
            monthFormat="MMMM yyyy"
            hideArrows={false}
            disableMonthChange={false}
            firstDay={1}
            renderArrow={(direction) => (
              <Ionicons
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                size={24}
                color="#F9A826"
              />
            )}
            hideDayNames={false}
            showWeekNumbers={false}
            onPressArrowLeft={(subtractMonth) => subtractMonth()}
            onPressArrowRight={(addMonth) => addMonth()}
            disableArrowLeft={false}
            disableArrowRight={false}
            disableAllTouchEventsForDisabledDays={true}
          />
        </View>

        {/* Selected Date Info */}
        {Boolean(selectedDate && schedule.byDate[selectedDate]) && (
          <View style={styles.selectedDateInfo}>
            <View style={styles.selectedDateHeader}>
              <Ionicons name="calendar" size={20} color="#F9A826" />
              <Text style={styles.selectedDateTitle}>
                {formatDateWithWeekday(selectedDate)}
              </Text>
            </View>
            <View style={styles.tripCountContainer}>
              <Ionicons name="car" size={16} color="#6B7280" />
              <Text style={styles.tripCount}>
                {schedule.byDate[selectedDate].length} trip(s) scheduled
              </Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!loading && semesters.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No semesters available</Text>
            <Text style={styles.emptySubtext}>Please check back later</Text>
          </View>
        )}
      </View>

      {/* Bottom Decoration */}
      <View style={styles.bottomDecorationWrapper} pointerEvents="none">
        <View style={styles.bottomDecorationBackground}>
          <View style={[styles.circle, styles.bottomCircleRightFar]} />
          <View style={[styles.circle, styles.bottomCircleRightMid]} />
          <View style={[styles.circle, styles.bottomCircleRightNear]} />
          <View style={[styles.circle, styles.bottomCircleRightEdge]} />

          <View style={[styles.circle, styles.bottomCircleLeftFar]} />
          <View style={[styles.circle, styles.bottomCircleLeftMid]} />
          <View style={[styles.circle, styles.bottomCircleLeftNear]} />
          <View style={[styles.circle, styles.bottomCircleLeftEdge]} />
        </View>
      </View>

      <DayModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        date={selectedDate}
        trips={schedule.byDate[selectedDate] || []}
      />
    </View>
  );
}

const createShadowStyle = (nativeShadow: Record<string, any>, webShadow: string) =>
  Platform.OS === 'web' ? { boxShadow: webShadow } : nativeShadow;

const calendarShadow = createShadowStyle(
  {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  '0px 8px 20px rgba(0, 0, 0, 0.08)'
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'RobotoSlab-Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  bottomDecorationWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -90,
    height: 320,
  },
  bottomDecorationBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
  },
  bottomCircleRightFar: {
    backgroundColor: '#FDE370',
    bottom: -10,
    right: -120,
  },
  bottomCircleRightMid: {
    backgroundColor: '#FDE370',
    bottom: 20,
    right: 20,
  },
  bottomCircleRightNear: {
    backgroundColor: '#FDE370',
    bottom: 20,
    right: 180,
  },
  bottomCircleRightEdge: {
    backgroundColor: '#FDE370',
    bottom: -10,
    right: 330,
  },
  bottomCircleLeftFar: {
    backgroundColor: '#FCCF08',
    bottom: -80,
    left: -120,
  },
  bottomCircleLeftMid: {
    backgroundColor: '#FCCF08',
    bottom: -70,
    left: 20,
  },
  bottomCircleLeftNear: {
    backgroundColor: '#FCCF08',
    bottom: -70,
    left: 180,
  },
  bottomCircleLeftEdge: {
    backgroundColor: '#FCCF08',
    bottom: -90,
    left: 330,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 10,
  },
  chipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 12,
  },
  chipsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: '#F9A826',
    borderColor: '#F9A826',
    shadowColor: '#F9A826',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 8,
    ...calendarShadow,
  },
  calendar: {
    borderRadius: 12,
  },
  selectedDateInfo: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'RobotoSlab-Bold',
    flex: 1,
  },
  tripCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tripCount: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'RobotoSlab-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
});

