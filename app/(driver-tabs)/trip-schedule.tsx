import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import DayModal from '../../features/driverSchedule/components/DayModal';
import { authApi } from '../../lib/auth/auth.api';
import { DriverSchedule, driverScheduleApi, ScheduleDto } from '../../lib/trip-mock-data/driverSchedule';

export default function DriverScheduleScreen() {
  const [schedule, setSchedule] = useState<DriverSchedule>({ dots: [], byDate: {} });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  const loadSchedules = useCallback(async () => {
    try {
      const loadedSchedules = await driverScheduleApi.getActiveSchedules();
      setSchedules(loadedSchedules);
    } catch {
      // Handle error silently
    }
  }, []);

  const loadSchedule = useCallback(async (scheduleId: string, startDate: string, endDate: string) => {
    try {
      setLoading(true);
      const userInfo = await authApi.getUserInfo();
      const driverId = userInfo.userId;

      if (!driverId) return;

      const scheduleData = await driverScheduleApi.getDriverSchedule(
        driverId,
        startDate,
        endDate,
        schedules
      );

      setSchedule(scheduleData);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [schedules]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  }, [loadSchedules]);

  const handleDateSelect = (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    setModalVisible(true);
  };

  const handleSchedulePress = async (schedule: ScheduleDto) => {
    setSelectedScheduleId(schedule.id);
    const startDate = schedule.effectiveFrom.split('T')[0];
    const endDate = schedule.effectiveTo ? schedule.effectiveTo.split('T')[0] : '2025-12-31';
    await loadSchedule(schedule.id, startDate, endDate);
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
    loadSchedules();
  }, [loadSchedules]);

  React.useEffect(() => {
    if (schedules.length > 0) {
      const firstSchedule = schedules[0];
      setSelectedScheduleId(firstSchedule.id);
      loadSchedule(firstSchedule.id, firstSchedule.effectiveFrom.split('T')[0], firstSchedule.effectiveTo ? firstSchedule.effectiveTo.split('T')[0] : '2025-12-31');
    }
  }, [schedules, loadSchedule]);

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

      <ScrollView
        style={[styles.content, { marginTop: -80 }]}
        contentContainerStyle={{ paddingBottom: 320 }}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />
        }
      >
        <View style={styles.chipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {schedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={[
                  styles.chip,
                  selectedScheduleId === schedule.id ? styles.chipActive : null
                ]}
                onPress={() => handleSchedulePress(schedule)}
              >
                <Text style={[
                  styles.chipText,
                  selectedScheduleId === schedule.id ? styles.chipTextActive : null
                ]}>
                  {schedule.name.length > 15 ? schedule.name.substring(0, 15) + '...' : schedule.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#F9A826',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#F9A826',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              arrowColor: '#F9A826',
              disabledArrowColor: '#d9e1e8',
              monthTextColor: '#2d4150',
              indicatorColor: '#F9A826',
              textDayFontFamily: 'RobotoSlab-Regular',
              textMonthFontFamily: 'RobotoSlab-Bold',
              textDayHeaderFontFamily: 'RobotoSlab-Medium',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 16,
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
                size={22}
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

        {Boolean(selectedDate && schedule.byDate[selectedDate]) && (
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <Text style={styles.tripCount}>
              {schedule.byDate[selectedDate].length} trip(s) scheduled
            </Text>
          </View>
        )}
      </ScrollView>

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
        <View style={styles.bottomDecorationCurve} />
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
  bottomDecorationCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    paddingVertical: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: '#F9A826',
    borderColor: '#F9A826',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  calendarContainer: {
    margin: 20,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    ...calendarShadow,
  },
  calendar: {
    borderRadius: 15,
  },
  selectedDateInfo: {
    margin: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F9A826',
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 4,
  },
  tripCount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Regular',
  },
});