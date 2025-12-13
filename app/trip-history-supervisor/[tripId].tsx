import { getSupervisorTripDetail } from "@/lib/supervisor/supervisor.api";
import { SupervisorTripDetailDto } from "@/lib/supervisor/supervisor.types";
import { formatDateWithWeekday, formatTime, toHourMinute } from "@/utils/date.utils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

export const options = { headerShown: false };

type Params = { tripId?: string };

const getStatusColors = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  const statusMap: Record<string, { bg: string; text: string; border: string; gradient: string[] }> = {
    scheduled: {
      bg: "#EFF6FF",
      text: "#1E40AF",
      border: "#3B82F6",
      gradient: ["#3B82F6", "#2563EB"],
    },
    inprogress: {
      bg: "#FEF3C7",
      text: "#92400E",
      border: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
    },
    completed: {
      bg: "#ECFDF5",
      text: "#065F46",
      border: "#22C55E",
      gradient: ["#22C55E", "#16A34A"],
    },
    cancelled: {
      bg: "#FEF2F2",
      text: "#991B1B",
      border: "#EF4444",
      gradient: ["#EF4444", "#DC2626"],
    },
    delayed: {
      bg: "#FFF7ED",
      text: "#9A3412",
      border: "#F97316",
      gradient: ["#F97316", "#EA580C"],
    },
    ontime: {
      bg: "#ECFDF5",
      text: "#065F46",
      border: "#22C55E",
      gradient: ["#22C55E", "#16A34A"],
    },
    early: {
      bg: "#E0F2FE",
      text: "#0C4A6E",
      border: "#0EA5E9",
      gradient: ["#0EA5E9", "#0284C7"],
    },
    late: {
      bg: "#FFF7ED",
      text: "#9A3412",
      border: "#F97316",
      gradient: ["#F97316", "#EA580C"],
    },
  };
  return statusMap[normalizedStatus] || {
    bg: "#F3F4F6",
    text: "#374151",
    border: "#9CA3AF",
    gradient: ["#9CA3AF", "#6B7280"],
  };
};

export default function SupervisorTripDetailScreen() {
  const { tripId } = useLocalSearchParams<Params>();
  const [trip, setTrip] = useState<SupervisorTripDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getSupervisorTripDetail(tripId as string);
        if (mounted) setTrip(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load trip");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tripId]);

  const getAttendanceStats = () => {
    if (!trip) return { total: 0, present: 0, absent: 0 };
    let total = 0;
    let present = 0;
    let absent = 0;

    trip.stops.forEach((stop) => {
      stop.attendance?.forEach((a) => {
        total++;
        const state = a.state?.toLowerCase() || "";
        if (state === "present" || state === "boarded" || state === "alighted") {
          present++;
        } else if (state === "absent") {
          absent++;
        }
      });
    });

    return { total, present, absent };
  };

  const renderTripInfo = () => {
    if (!trip) return null;
    const statusColors = getStatusColors(trip.status || "N/A");
    const stats = getAttendanceStats();

    return (
      <View style={{ gap: 12 }}>
        {/* Main Trip Info Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            borderLeftWidth: 3,
            borderLeftColor: statusColors.border,
          }}
        >
          {/* Header with Route Name and Status */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: statusColors.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="map" size={20} color={statusColors.border} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#0F172A", marginBottom: 2 }}>
                    {trip.routeName}
                  </Text>
                  <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 11, color: "#6B7280" }}>
                    {formatDateWithWeekday(trip.serviceDate)}
                  </Text>
                </View>
              </View>
            </View>
            <LinearGradient
              colors={statusColors.gradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 11, color: "#FFFFFF" }}>
                {trip.status || "N/A"}
              </Text>
            </LinearGradient>
          </View>

          {/* Time Information */}
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 10,
              padding: 10,
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#EFF6FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="time-outline" size={16} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 10, color: "#6B7280", marginBottom: 2 }}>
                  Planned Time
                </Text>
                <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 13, color: "#111827" }}>
                  {toHourMinute(trip.plannedStartAt)} - {toHourMinute(trip.plannedEndAt)}
                </Text>
              </View>
            </View>
            {(trip.startTime || trip.endTime) && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#ECFDF5",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 10, color: "#6B7280", marginBottom: 2 }}>
                    Actual Time
                  </Text>
                  <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 13, color: "#111827" }}>
                    {trip.startTime ? toHourMinute(trip.startTime) : "—"} / {trip.endTime ? toHourMinute(trip.endTime) : "—"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Statistics */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: "#F0FDF4", borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 18, color: "#16A34A" }}>{stats.present}</Text>
              <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 10, color: "#6B7280", marginTop: 2 }}>
                Present
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 18, color: "#DC2626" }}>{stats.absent}</Text>
              <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 10, color: "#6B7280", marginTop: 2 }}>
                Absent
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 18, color: "#2563EB" }}>{trip.stops.length}</Text>
              <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 10, color: "#6B7280", marginTop: 2 }}>
                Stops
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle & Driver Info */}
        {(trip.vehicle || trip.driver) && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 14, color: "#0F172A", marginBottom: 12 }}>
              Trip Information
            </Text>
            <View style={{ gap: 10 }}>
              {trip.vehicle && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#FEF3C7",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="car" size={18} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
                      Vehicle
                    </Text>
                    <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 13, color: "#111827" }}>
                      {trip.vehicle.maskedPlate}
                    </Text>
                  </View>
                </View>
              )}
              {trip.driver && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#E0E7FF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="person" size={18} color="#6366F1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
                      Driver
                    </Text>
                    <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 13, color: "#111827" }}>
                      {trip.driver.fullName}
                    </Text>
                    {trip.driver.phone && (
                      <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                        {trip.driver.phone}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAttendance = () => {
    if (!trip) return null;
    return trip.stops.map((stop, index) => {
      const colorScheme = { bg: "#E0F7FA", border: "#01CBCA", icon: "#00B8B8", dot: "#01CBCA" };
      const isLast = index === trip.stops.length - 1;

      return (
        <View key={stop.id} style={{ flexDirection: "row", marginBottom: 14 }}>
          {/* Timeline */}
          <View style={{ alignItems: "center", marginRight: 12, width: 20 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colorScheme.border,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#FFFFFF",
                shadowColor: colorScheme.border,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#FFFFFF",
                }}
              />
            </View>
            {!isLast && (
              <View
                style={{
                  width: 2,
                  flex: 1,
                  backgroundColor: "#E5E7EB",
                  marginTop: 3,
                  minHeight: 30,
                }}
              />
            )}
          </View>

          {/* Stop Card */}
          <View style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: colorScheme.bg,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: colorScheme.border,
                padding: 12,
                shadowColor: colorScheme.border,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Stop Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colorScheme.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="location" size={16} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 14, color: "#0F172A", marginBottom: 2 }}>
                        Stop {stop.sequence}
                      </Text>
                      <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 12, color: "#475569" }} numberOfLines={2}>
                        {stop.name}
                      </Text>
                    </View>
                  </View>

                  {/* Time Info */}
                  <View style={{ marginLeft: 40, gap: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Ionicons name="time-outline" size={12} color={colorScheme.icon} />
                      <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 11, color: "#475569" }}>
                        Planned: {formatTime(stop.plannedArrival)}
                      </Text>
                    </View>
                    {(stop.actualArrival || stop.actualDeparture) && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Ionicons name="checkmark-circle" size={12} color={colorScheme.icon} />
                        <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 11, color: "#475569" }}>
                          Actual: {stop.actualArrival ? formatTime(stop.actualArrival) : "—"} /{" "}
                          {stop.actualDeparture ? formatTime(stop.actualDeparture) : "—"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <LinearGradient
                  colors={[colorScheme.border, colorScheme.icon]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="people" size={12} color="#FFFFFF" />
                    <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 12, color: "#FFFFFF" }}>
                      {stop.attendance?.length ?? 0}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Attendance List */}
              {stop.attendance && stop.attendance.length > 0 && (
                <View style={{ gap: 6, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" }}>
                  {stop.attendance.map((a) => {
                    const getAttendanceColors = (state: string) => {
                      const normalizedState = state?.toLowerCase() || "";
                      const colorMap: Record<string, { bg: string; border: string; text: string; gradient: [string, string] }> = {
                        present: {
                          bg: "#ECFDF5",
                          border: "#22C55E",
                          text: "#16A34A",
                          gradient: ["#22C55E", "#16A34A"],
                        },
                        absent: {
                          bg: "#FEF2F2",
                          border: "#EF4444",
                          text: "#DC2626",
                          gradient: ["#EF4444", "#DC2626"],
                        },
                        late: {
                          bg: "#FEF3C7",
                          border: "#F59E0B",
                          text: "#D97706",
                          gradient: ["#F59E0B", "#D97706"],
                        },
                        excused: {
                          bg: "#E0E7FF",
                          border: "#6366F1",
                          text: "#4F46E5",
                          gradient: ["#6366F1", "#4F46E5"],
                        },
                        pending: {
                          bg: "#F3F4F6",
                          border: "#9CA3AF",
                          text: "#6B7280",
                          gradient: ["#9CA3AF", "#6B7280"],
                        },
                        boarded: {
                          bg: "#EFF6FF",
                          border: "#3B82F6",
                          text: "#2563EB",
                          gradient: ["#3B82F6", "#2563EB"],
                        },
                        alighted: {
                          bg: "#F0FDF4",
                          border: "#22C55E",
                          text: "#16A34A",
                          gradient: ["#22C55E", "#16A34A"],
                        },
                      };
                      return colorMap[normalizedState] || {
                        bg: "#F3F4F6",
                        border: "#9CA3AF",
                        text: "#6B7280",
                        gradient: ["#9CA3AF", "#6B7280"] as [string, string],
                      };
                    };
                    const attendanceColors = getAttendanceColors(a.state);

                    return (
                      <View
                        key={a.studentId}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 10,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: attendanceColors.border,
                          backgroundColor: attendanceColors.bg,
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: attendanceColors.border,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 12, color: "#FFFFFF" }}>
                            {a.studentName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 13, color: "#0F172A", marginBottom: 3 }}>
                            {a.studentName}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <LinearGradient
                              colors={attendanceColors.gradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 5,
                              }}
                            >
                              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 9, color: "#FFFFFF" }}>
                                {a.state || "N/A"}
                              </Text>
                            </LinearGradient>
                            {(a.boardedAt || a.alightedAt) && (
                              <View style={{ flexDirection: "row", gap: 5, marginLeft: 4 }}>
                                {a.boardedAt && (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                                    <Ionicons name="arrow-up-circle" size={10} color={attendanceColors.text} />
                                    <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 9, color: attendanceColors.text }}>
                                      {formatTime(a.boardedAt)}
                                    </Text>
                                  </View>
                                )}
                                {a.alightedAt && (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                                    <Ionicons name="arrow-down-circle" size={10} color={attendanceColors.text} />
                                    <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 9, color: attendanceColors.text }}>
                                      {formatTime(a.alightedAt)}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header with Yellow Gradient */}
      <View
        style={{
          paddingTop: 60,
          paddingBottom: 24,
          paddingHorizontal: 20,
          position: "relative",
          backgroundColor: "transparent",
        }}
      >
        <LinearGradient
          colors={["#FDE370", "#FCCF08"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 22, color: "#111827" }}>Trip Detail</Text>
            <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 13, color: "#374151", marginTop: 2 }}>
              {trip ? formatDateWithWeekday(trip.serviceDate) : "Loading..."}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={{ paddingVertical: 48, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#F9A826" />
            <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 14, color: "#6B7280", marginTop: 12 }}>
              Loading trip details...
            </Text>
          </View>
        )}

        {!loading && error && (
          <View
            style={{
              padding: 20,
              backgroundColor: "#FEF2F2",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#FECACA",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Ionicons name="alert-circle" size={20} color="#B91C1C" />
              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#B91C1C" }}>Error</Text>
            </View>
            <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 14, color: "#991B1B" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && trip && (
          <View style={{ gap: 14 }}>
            {renderTripInfo()}

            {/* Stops & Attendance Section */}
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <View
                  style={{
                    width: 3,
                    height: 20,
                    borderRadius: 2,
                    backgroundColor: "#F9A826",
                  }}
                />
                <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#0F172A" }}>
                  Stops & Attendance
                </Text>
              </View>
              {renderAttendance()}
            </View>
          </View>
        )}
      </ScrollView>

    </View>
  );
}
