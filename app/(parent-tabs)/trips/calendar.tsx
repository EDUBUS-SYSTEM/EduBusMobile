import { SemesterFilter } from '@/components/parent/SemesterFilter';
import { StudentSelector } from '@/components/parent/StudentSelector';
import { TripCalendar } from '@/components/parent/TripCalendar';
import { TripCard } from '@/components/parent/TripCard';
import type { AcademicSemester } from '@/lib/academicCalendar/academicCalendar.api';
import { academicCalendarApi } from '@/lib/academicCalendar/academicCalendar.api';
import { authApi } from '@/lib/auth/auth.api';
import { childrenApi } from '@/lib/parent/children.api';
import type { Child } from '@/lib/parent/children.type';
import type { ParentTripDto } from '@/lib/trip/parentTrip.types';
import { getParentTripsByDateRange } from '@/lib/trip/trip.api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ParentTripCalendarScreen() {
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<AcademicSemester | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [visibleTrips, setVisibleTrips] = useState<ParentTripDto[]>([]);
  const tripsCacheRef = useRef<Record<string, ParentTripDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [semesterLoading, setSemesterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load semesters
  const loadSemesters = useCallback(async () => {
    try {
      const activeCalendars = await academicCalendarApi.getActiveAcademicCalendars();
      const allSemesters: AcademicSemester[] = [];

      activeCalendars.forEach((calendar) => {
        allSemesters.push(...calendar.semesters);
      });

      // Sort by start date (newest first)
      const sortedSemesters = allSemesters.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      setSemesters(sortedSemesters);

      // Auto-select semester currently in progress; fallback to nearest upcoming; then first.
      if (sortedSemesters.length > 0 && !selectedSemester) {
        const now = new Date();
        const current = sortedSemesters.find((s) => {
          const start = new Date(s.startDate);
          const end = new Date(s.endDate || s.startDate);
          return start <= now && now <= end;
        });
        if (current) {
          setSelectedSemester(current);
          setCurrentDate(now);
          setSelectedDate(now);
        } else {
          const upcoming = [...sortedSemesters].reverse().find((s) => new Date(s.startDate) >= now);
          const pick = upcoming || sortedSemesters[0];
          setSelectedSemester(pick);
          const start = new Date(pick.startDate);
          setCurrentDate(start);
          setSelectedDate(start);
        }
      }
    } catch (err) {
      console.error('Error loading semesters:', err);
    }
  }, [selectedSemester]);

  // Load children
  const loadChildren = useCallback(async () => {
    try {
      const userInfo = await authApi.getUserInfo();
      if (userInfo.userId) {
        const childrenList = await childrenApi.getChildrenByParent(userInfo.userId);
        setChildren(childrenList);

        // Auto-select first child if available
        if (childrenList.length > 0 && !selectedChild) {
          setSelectedChild(childrenList[0]);
        }
      }
    } catch (err) {
      console.error('Error loading children:', err);
    }
  }, [selectedChild]);

  // Load trips for date range (3 months)
  const getMonthRange = useCallback((date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 3, 0);
    return { start, end };
  }, []);

  const getRangeKey = useCallback(
    (date: Date) => {
      if (!selectedSemester) return null;
      return `${selectedSemester.code}-${date.getFullYear()}-${date.getMonth()}`;
    },
    [selectedSemester]
  );

  const loadTripsForRange = useCallback(
    async (targetDate: Date, forceRefresh = false) => {
      if (!selectedSemester) {
        setVisibleTrips([]);
        return;
      }

      const rangeKey = getRangeKey(targetDate);
      if (!rangeKey) return;

      const cachedTrips = tripsCacheRef.current[rangeKey];
      if (!forceRefresh && cachedTrips) {
        setVisibleTrips(cachedTrips);
        return;
      }

      try {
        setError(null);
        setLoading(true);
        const { start, end } = getMonthRange(targetDate);

        const formatDateKey = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const startDateStr = formatDateKey(start);
        const endDateStr = formatDateKey(end);

        const tripsData = await getParentTripsByDateRange(startDateStr, endDateStr);
        tripsCacheRef.current = {
          ...tripsCacheRef.current,
          [rangeKey]: tripsData,
        };
        setVisibleTrips(tripsData);
      } catch (err: any) {
        console.error('Error loading trips:', err);
        setError(err.message || 'Failed to load trips');
        setVisibleTrips([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedSemester, getMonthRange, getRangeKey]
  );

  // Initialize data
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadSemesters(), loadChildren()]);
      setLoading(false);
    };
    initialize();
  }, [loadSemesters, loadChildren]);

  // Reload trips when semester or child changes
  useEffect(() => {
    if (!selectedSemester) return;

    const loadSemesterData = async () => {
      setSemesterLoading(true);
      tripsCacheRef.current = {};
      setVisibleTrips([]);

      const now = new Date();
      const start = new Date(selectedSemester.startDate);
      const end = new Date(selectedSemester.endDate || selectedSemester.startDate);
      const target = start <= now && now <= end ? now : start;
      setCurrentDate(target);
      setSelectedDate(target);
    };

    loadSemesterData();
  }, [selectedSemester]);

  useEffect(() => {
    if (!selectedSemester) return;

    const loadData = async () => {
      await loadTripsForRange(currentDate);
      setSemesterLoading(false);
    };

    loadData();
  }, [currentDate, selectedSemester, loadTripsForRange]);

  // Filter trips by selected date
  const expandedTrips = useMemo(() => {
    const result: ParentTripDto[] = [];

    visibleTrips.forEach((trip) => {
      const childSources =
        (trip.children && trip.children.length > 0
          ? trip.children
          : trip.stops?.flatMap((stop) => stop.attendance || [])) || [];

      if (childSources.length === 0) {
        result.push(trip);
        return;
      }

      childSources.forEach((child) => {
        result.push({
          ...trip,
          childId: child.id,
          childName: child.name,
        });
      });
    });

    return result;
  }, [visibleTrips]);

  const childFilteredTrips = useMemo(() => {
    if (!selectedChild) return expandedTrips;

    return expandedTrips.filter((trip) => trip.childId === selectedChild.id);
  }, [expandedTrips, selectedChild]);

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredTripsByDate = useMemo(() => {
    if (!selectedDate) return childFilteredTrips;

    const dateStr = formatDateKey(selectedDate);
    return childFilteredTrips.filter((trip) => trip.serviceDate.startsWith(dateStr));
  }, [childFilteredTrips, selectedDate]);

  // Group trips by date for calendar indicators
  const tripsByDate = useMemo(() => {
    const map = new Map<string, number>();
    const sourceTrips = selectedChild ? childFilteredTrips : visibleTrips;
    sourceTrips.forEach((trip) => {
      const dateStr = trip.serviceDate.split('T')[0];
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    });
    return map;
  }, [visibleTrips, selectedChild, childFilteredTrips]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTripsForRange(currentDate, true);
    } finally {
      setRefreshing(false);
    }
  }, [currentDate, loadTripsForRange]);

  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const base = selectedDate ?? prev;
      const delta = direction === 'prev' ? -7 : 7;
      const newDate = new Date(base);
      newDate.setDate(base.getDate() + delta);
      setSelectedDate(newDate);
      loadTripsForRange(newDate);
      return newDate;
    });
  }, [selectedDate, loadTripsForRange]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleTripPress = useCallback((trip: ParentTripDto) => {
    router.push({
      pathname: '/(parent-tabs)/trip-detail/[tripId]',
      params: { tripId: trip.id, childId: trip.childId },
    });
  }, []);

  // Sort trips: completed first, then by time
  const sortedTrips = useMemo(() => {
    return [...filteredTripsByDate].sort((a, b) => {
      // Completed trips first
      if (a.status === 'Completed' && b.status !== 'Completed') return -1;
      if (a.status !== 'Completed' && b.status === 'Completed') return 1;

      // Then sort by planned start time
      return new Date(a.plannedStartAt).getTime() - new Date(b.plannedStartAt).getTime();
    });
  }, [filteredTripsByDate]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFDD00" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />

      {/* Header Section */}
      <View style={styles.header}>
        <BackgroundIcons />
        <View style={styles.backRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/edubus_logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Semester Filter */}
        {semesters.length > 0 && (
          <SemesterFilter
            semesters={semesters}
            selectedSemester={selectedSemester}
            onSelectSemester={setSelectedSemester}
          />
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Student Selector */}
        {children.length > 0 && (
          <View style={styles.selectorWrapper}>
            <StudentSelector
              students={children}
              selectedChild={selectedChild}
              onSelectChild={setSelectedChild}
            />
          </View>
        )}

        {/* Semester Loading Indicator */}
        {semesterLoading && (
          <View style={styles.semesterLoadingContainer}>
            <ActivityIndicator size="large" color="#FFDD00" />
            <Text style={styles.semesterLoadingText}>Loading semester data...</Text>
          </View>
        )}

        {/* Calendar */}
        <TripCalendar
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          tripsByDate={tripsByDate}
        />

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Trips List */}
        {sortedTrips.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#9E9E9E" />
            <Text style={styles.emptyText}>
              {selectedDate
                ? 'No trips on this date'
                : 'No trips available'}
            </Text>
          </View>
        )}

        {sortedTrips.map((trip) => (
          <TripCard
            key={`${trip.id}-${trip.childId}`}
            trip={trip}
            onPress={() => handleTripPress(trip)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Background Icons Component (inline for this screen)
function BackgroundIcons() {
  return (
    <View style={styles.backgroundIcons} pointerEvents="none">
      {/* Decorative bus icons */}
      <View style={[styles.bgIcon, { top: 20, left: 20 }]}>
        <Ionicons name="bus" size={24} color="#FDE370" />
      </View>
      <View style={[styles.bgIcon, { top: 40, right: 30 }]}>
        <Ionicons name="book" size={20} color="#FDE370" />
      </View>
      <View style={[styles.bgIcon, { top: 60, left: 50 }]}>
        <Ionicons name="school" size={18} color="#FDE370" />
      </View>
    </View>
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
    fontFamily: 'RobotoSlab-Medium',
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFF9C4',
    paddingTop: 12,
    paddingBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backgroundIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  bgIcon: {
    position: 'absolute',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  logo: {
    width: 78,
    height: 78,
  },
  logoText: {
    fontSize: 26,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
    color: '#F44336',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#9E9E9E',
  },
  selectorWrapper: {
    marginTop: -8,
  },
  semesterLoadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semesterLoadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'RobotoSlab-Medium',
  },
});

