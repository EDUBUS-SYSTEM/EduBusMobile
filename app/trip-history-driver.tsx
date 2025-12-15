import { academicCalendarApi, AcademicSemester } from "@/lib/academicCalendar/academicCalendar.api";
import { getTripsByDate } from "@/lib/trip/trip.api";
import { DriverTripDto } from "@/lib/trip/driverTrip.types";
import { toHourMinute, formatDateWithWeekday, getTodayISOString } from "@/utils/date.utils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

export const options = { headerShown: false };

const statusBg: Record<string, string> = {
  InProgress: "#FFF3E0",
  Completed: "#E8F5E9",
  Cancelled: "#FEE2E2",
  Scheduled: "#E0F2FE",
  default: "#F3F4F6",
};

const statusColor: Record<string, string> = {
  InProgress: "#FB8C00",
  Completed: "#2E7D32",
  Cancelled: "#D32F2F",
  Scheduled: "#0284C7",
  default: "#6B7280",
};

export default function DriverTripHistoryScreen() {
  const todayISO = getTodayISOString();
  const todayDate = useMemo(() => new Date(todayISO), [todayISO]);

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trips, setTrips] = useState<DriverTripDto[]>([]);
  const [monthFetching, setMonthFetching] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() + 1 };
  });
  const [tripCache, setTripCache] = useState<Record<string, DriverTripDto[]>>({});
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<AcademicSemester | null>(null);
  const [totalTrips, setTotalTrips] = useState<number>(0);
  const [loadingTotal, setLoadingTotal] = useState(false);
  const toDateOnly = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 10);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const semesterBounds = useMemo(() => {
    if (!selectedSemester) return null;
    const start = new Date(selectedSemester.startDate);
    const end = new Date(selectedSemester.endDate);
    const maxEnd = end.getTime() < todayDate.getTime() ? end : todayDate;
    return { start, end: maxEnd };
  }, [selectedSemester, todayDate]);

  const isPastOrToday = (iso: string) => new Date(iso) <= todayDate;
  const isInSemester = (iso: string) => {
    if (!semesterBounds) return true; // no semester data -> allow
    const d = new Date(iso);
    return d >= semesterBounds.start && d <= semesterBounds.end;
  };

  const cacheTrips = (dateISO: string, data: DriverTripDto[]) => {
    setTripCache((prev) => ({ ...prev, [dateISO]: data }));
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.entries(tripCache).forEach(([dateISO, tripList]) => {
      const d = new Date(dateISO);
      if (semesterBounds) {
        if (d < semesterBounds.start || d > semesterBounds.end) return;
      }
      if (tripList && tripList.length > 0) {
        marks[dateISO] = { marked: true, dots: [{ color: "#F9A826" }] };
      }
    });
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: "#F9A826" };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: "#F9A826" };
    }
    return marks;
  }, [tripCache, selectedDate, semesterBounds]);

  const loadTrips = async (dateISO: string) => {
    if (!isPastOrToday(dateISO) || !isInSemester(dateISO)) {
      setTrips([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // prefer cached range data
      if (tripCache[dateISO] !== undefined) {
        setTrips(tripCache[dateISO]);
        return;
      }

      const data = await getTripsByDate(dateISO);
      const pastOnly = data.map((t) => ({
        ...t,
        serviceDate: toDateOnly(t.serviceDate),
      })).filter((t) => isPastOrToday(t.serviceDate));

      cacheTrips(dateISO, pastOnly);
      setTrips(pastOnly);
    } catch (err: any) {
      setError(err?.message || "Failed to load trips");
      setTrips(tripCache[dateISO] || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips(selectedDate);
  }, [selectedDate, semesterBounds]);

  const preloadMonth = async (year: number, month: number) => {
    // when we have range cache already, skip extra fetch
    if (!semesterBounds || Object.keys(tripCache).length > 0) return;
    const isCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const lastDay = isCurrentMonth ? todayDate.getDate() : daysInMonth;

    setMonthFetching(true);
    try {
      for (let day = 1; day <= lastDay; day++) {
        const iso = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        if (!isInSemester(iso)) continue;
        if (tripCache[iso] !== undefined) continue;
        try {
          const data = await getTripsByDate(iso);
          const pastOnly = data.filter((t) => isPastOrToday(t.serviceDate));
          cacheTrips(iso, pastOnly);
        } catch {
          cacheTrips(iso, []);
        }
      }
    } finally {
      setMonthFetching(false);
    }
  };

  useEffect(() => {
    preloadMonth(currentMonth.year, currentMonth.month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth.year, currentMonth.month]);

  const computeRangeAndTotal = async (semester: AcademicSemester | null) => {
    if (!semester) {
      setTotalTrips(0);
      return;
    }
    const start = new Date(semester.startDate);
    const rawEnd = new Date(semester.endDate);
    const end = new Date(Math.min(rawEnd.getTime(), todayDate.getTime()));
    if (end < start) {
      setTotalTrips(0);
      return;
    }

    setLoadingTotal(true);
    try {
      // Calculate total from cache or fetch
      let total = 0;
      const cursor = new Date(start);
      while (cursor <= end) {
        const iso = toDateOnly(cursor.toISOString());
        if (tripCache[iso] !== undefined) {
          total += tripCache[iso].length;
        } else {
          try {
            const data = await getTripsByDate(iso);
            const pastOnly = data.filter((t) => isPastOrToday(t.serviceDate));
            cacheTrips(iso, pastOnly);
            total += pastOnly.length;
          } catch {
            cacheTrips(iso, []);
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      setTotalTrips(total);
    } catch (err) {
      console.warn("Failed to load driver trip range", err);
      setTotalTrips(0);
    } finally {
      setLoadingTotal(false);
    }
  };

  // load semesters
  useEffect(() => {
    (async () => {
      const data = await academicCalendarApi.getActiveSemesters();
      setSemesters(data);
      if (data.length > 0) {
        setSelectedSemester(data[0]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSemester) return;
    setTripCache({});
    const clamped = (() => {
      const d = new Date(todayISO);
      if (semesterBounds) {
        if (d < semesterBounds.start) return semesterBounds.start.toISOString().slice(0, 10);
        if (d > semesterBounds.end) return semesterBounds.end.toISOString().slice(0, 10);
      }
      return todayISO;
    })();
    setSelectedDate(clamped);
    computeRangeAndTotal(selectedSemester);
  }, [selectedSemester, todayISO, semesterBounds]);

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) =>
      new Date(a.plannedStartAt).getTime() - new Date(b.plannedStartAt).getTime()
    );
  }, [trips]);

  const renderTripCard = (trip: DriverTripDto, index: number) => (
    <TouchableOpacity
      key={trip.id}
      activeOpacity={0.9}
      onPress={() => router.push(`/(driver-tabs)/trip/${trip.id}` as any)}
      style={{
        flexDirection: "row",
        marginBottom: 12,
      }}
    >
      <View style={{ alignItems: "center", marginRight: 12 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#F9A826",
          }}
        />
        {index < sortedTrips.length - 1 && (
          <View
            style={{
              width: 2,
              height: 32,
              backgroundColor: "#E5E7EB",
              marginTop: 6,
            }}
          />
        )}
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: "#F9FAFB",
          borderRadius: 10,
          padding: 12,
          borderLeftWidth: 3,
          borderLeftColor: "#F9A826",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 14, color: "#111827", marginBottom: 2 }}>
              {toHourMinute(trip.plannedStartAt)} – {toHourMinute(trip.plannedEndAt)}
            </Text>
            <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280" }}>
              Route: {trip.scheduleName}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: statusBg[trip.status] || statusBg.default,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "RobotoSlab-Medium",
                fontSize: 11,
                color: statusColor[trip.status] || statusColor.default,
              }}
            >
              {trip.status}
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280" }}>
            Started: {trip.startTime ? toHourMinute(trip.startTime) : "Not Yet"}
          </Text>
        </View>
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280" }}>
            Ended: {trip.endTime ? toHourMinute(trip.endTime) : "Not Yet"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="flag" size={12} color="#F9A826" />
          <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280" }}>
            {trip.completedStops}/{trip.totalStops} stops
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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

          {/* Circle 3 */}
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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255, 255, 255, 0.8)", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 20, color: "#111827" }}>Trip History</Text>
            <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#374151", marginTop: 4 }}>
              {formatDateWithWeekday(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedDate(todayISO)}
            style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: "#F9A826" }}
          >
            <Text style={{ fontFamily: "RobotoSlab-Bold", color: "#FFFFFF" }}>Today</Text>
          </TouchableOpacity>
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {semesters.length > 0 && (
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              {semesters.map((sem) => {
                const isActive = selectedSemester?.code === sem.code;
                return (
                  <TouchableOpacity
                    key={sem.code}
                    onPress={() => setSelectedSemester(sem)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 18,
                      backgroundColor: isActive ? "#F9A826" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isActive ? "#F9A826" : "#E5E7EB",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "RobotoSlab-Bold",
                        color: isActive ? "#FFFFFF" : "#6B7280",
                      }}
                    >
                      {sem.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#111827" }}>Pick a date</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="stats-chart-outline" size={16} color="#6B7280" />
              {loadingTotal ? (
                <ActivityIndicator size="small" color="#F9A826" />
              ) : (
                <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 14, color: "#374151" }}>Total trips: {totalTrips}</Text>
              )}
            </View>
          </View>

          <Calendar
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            onMonthChange={(month) => setCurrentMonth({ year: month.year, month: month.month })}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: "#F9A826",
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: "#F9A826",
              arrowColor: "#F9A826",
            }}
            style={{ marginTop: 8, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB" }}
          />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {loading && (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#F9A826" />
            </View>
          )}
          {monthFetching && !loading && (
            <View style={{ paddingVertical: 8, alignItems: "center" }}>
              <Text style={{ fontFamily: "RobotoSlab-Regular", color: "#6B7280" }}>Updating calendar…</Text>
            </View>
          )}
          {!loading && error && (
            <View style={{ padding: 16, backgroundColor: "#FEF2F2", borderRadius: 12, borderWidth: 1, borderColor: "#FECACA" }}>
              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 14, color: "#B91C1C" }}>{error}</Text>
            </View>
          )}
          {!loading && !error && trips.length === 0 && (
            <View
              style={{
                marginTop: 8,
                padding: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#F9FAFB",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={{ fontFamily: "RobotoSlab-Bold", color: "#111827" }}>No trips</Text>
              <Text style={{ fontFamily: "RobotoSlab-Regular", color: "#6B7280", textAlign: "center" }}>
                No trips on this date.
              </Text>
            </View>
          )}

          {!loading && !error && trips.length > 0 && (
            <View style={{ paddingBottom: 200 }}>
              {sortedTrips.map((trip, index) => renderTripCard(trip, index))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Decoration */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: -90, height: 320 }} pointerEvents="none">
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Right Side Circles */}
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: "#FDE370",
              bottom: -10,
              right: -120,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: "#FDE370",
              bottom: 20,
              right: 20,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: "#FDE370",
              bottom: 20,
              right: 180,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: "#FDE370",
              bottom: -10,
              right: 330,
            }}
          />

          {/* Left Side Circles */}
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: "#FCCF08",
              bottom: -80,
              left: -120,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: "#FCCF08",
              bottom: -70,
              left: 20,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: "#FCCF08",
              bottom: -70,
              left: 180,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: "#FCCF08",
              bottom: -90,
              left: 330,
            }}
          />
        </View>
      </View>
    </View>
  );
}
