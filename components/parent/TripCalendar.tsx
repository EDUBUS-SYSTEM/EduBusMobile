import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TripCalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
  tripsByDate?: Map<string, number>;
}

export function TripCalendar({
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
  tripsByDate,
}: TripCalendarProps) {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Determine base date for the week (use selected date if available)
  const baseDate = selectedDate ?? currentDate;

  // Calculate start of week (Monday)
  const startOfWeek = new Date(baseDate);
  const dayOfWeek = startOfWeek.getDay() || 7; // Sunday (0) -> 7
  startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek - 1));

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }

  const headerMonth = monthNames[baseDate.getMonth()];
  const headerYear = baseDate.getFullYear();

  return (
    <View style={styles.container}>
      {/* Month and navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={() => onMonthChange('prev')}
          style={styles.navButton}
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {headerMonth} {headerYear}
        </Text>
        <TouchableOpacity
          onPress={() => onMonthChange('next')}
          style={styles.navButton}
          activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekItem}>
            <Text style={styles.weekDayText}>
              {weekDayLabels[index]}
            </Text>
          </View>
        ))}
      </View>

      {/* Date pills row */}
      <View style={styles.dateRow}>
        {weekDays.map((day, index) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : isSameDay(day, baseDate);
          const isCurrentDay = isToday(day);
          const dateKey = formatDateKey(day);
          const hasTrips = tripsByDate?.has(dateKey);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                isSelected && styles.dateItemSelected,
              ]}
              onPress={() => onDateSelect(day)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.dateText,
                  isSelected && styles.dateTextSelected,
                  !isSelected && isCurrentDay && styles.dateTextToday,
                ]}>
                {day.getDate()}
              </Text>
              {hasTrips && (
                <View style={styles.tripDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    padding: 4,
  },
  monthText: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 11,
    fontFamily: 'RobotoSlab-Medium',
    color: '#6B7280',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dateItemSelected: {
    backgroundColor: '#FFDD00',
    borderRadius: 999,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
    color: '#111827',
  },
  dateTextSelected: {
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  dateTextToday: {
    color: '#F59E0B',
    fontFamily: 'RobotoSlab-Bold',
  },
  tripDot: {
    marginTop: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
  },
});

