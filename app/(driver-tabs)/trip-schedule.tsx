import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import DayModal from '../../features/driverSchedule/components/DayModal';
import { DriverSchedule, driverScheduleApi } from '../../lib/api/driverSchedule';
import { academicCalendarApi, AcademicSemesterDto } from '../../lib/api/academicCalendar';
import { authApi } from '../../lib/auth/auth.api';

export default function DriverScheduleScreen() {
  const [schedule, setSchedule] = useState<DriverSchedule>({ dots: [], byDate: {} });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [semesters, setSemesters] = useState<AcademicSemesterDto[]>([]);
  const [selectedSemesterCode, setSelectedSemesterCode] = useState<string>('');

  const loadSemesters = useCallback(async () => {
    try {
      const loadedSemesters = await academicCalendarApi.getActiveSemesters();
      setSemesters(loadedSemesters);
    } catch {
      // Handle error silently
    }
  }, []);

  const loadSchedule = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      const userInfo = await authApi.getUserInfo();
      const driverId = userInfo.userId;

      if (!driverId) return;

      const scheduleData = await driverScheduleApi.getDriverSchedule(
        driverId,
        startDate,
        endDate
      );

      setSchedule(scheduleData);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSemesters();
    setRefreshing(false);
  }, [loadSemesters]);

  const handleDateSelect = (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    setModalVisible(true);
  };

  const handleSemesterPress = async (semester: AcademicSemesterDto) => {
    setSelectedSemesterCode(semester.code);
    const startDate = semester.startDate.split('T')[0];
    const endDate = semester.endDate.split('T')[0];
    await loadSchedule(startDate, endDate);
  };

  const createMarkedDates = () => {
    const marked: any = {};
    
    schedule.dots.forEach(({ date, dots }) => {
      marked[date] = {
        marked: true,
        dots: dots,
        selected: selectedDate === date,
        selectedColor: '#F9A826',
        selectedTextColor: '#FFFFFF',
      };
    });

    return marked;
  };

  React.useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  React.useEffect(() => {
    if (semesters.length > 0) {
      const firstSemester = semesters[0];
      setSelectedSemesterCode(firstSemester.code);
      const startDate = firstSemester.startDate.split('T')[0];
      const endDate = firstSemester.endDate.split('T')[0];
      loadSchedule(startDate, endDate);
    }
  }, [semesters, loadSchedule]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9A826', '#FF8C00']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedules</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.chipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
            hideDayNames={false}
            showWeekNumbers={false}
            onPressArrowLeft={(subtractMonth) => subtractMonth()}
            onPressArrowRight={(addMonth) => addMonth()}
            disableArrowLeft={false}
            disableArrowRight={false}
            disableAllTouchEventsForDisabledDays={true}
          />
        </View>

        {selectedDate && schedule.byDate[selectedDate] && (
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <Text style={styles.tripCount}>
              {schedule.byDate[selectedDate].length} trip(s)
            </Text>
          </View>
        )}
      </ScrollView>

      <DayModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        date={selectedDate}
        trips={schedule.byDate[selectedDate] || []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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