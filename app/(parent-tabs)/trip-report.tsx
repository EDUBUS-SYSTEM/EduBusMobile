import { SemesterFilter } from "@/components/parent/SemesterFilter";
import { academicCalendarApi, AcademicSemester } from "@/lib/academicCalendar/academicCalendar.api";
import { ParentTripReportResponse, StudentTripStatistics, tripReportApi } from "@/lib/parent/tripReport.api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;

export default function TripReportScreen() {
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<AcademicSemester | null>(null);
  const [report, setReport] = useState<ParentTripReportResponse | null>(null);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const loadSemesters = useCallback(async () => {
    setLoadingSemesters(true);
    setError(null);
    try {
      const calendarSemesters = await academicCalendarApi.getActiveSemesters();
      setSemesters(calendarSemesters);
      if (calendarSemesters.length > 0) {
        setSelectedSemester((prev) => prev ?? calendarSemesters[0]);
      }
    } catch {
      setError("Unable to load semesters.");
    } finally {
      setLoadingSemesters(false);
    }
  }, []);

  const loadReport = useCallback(
    async (semesterId: string) => {
      setLoadingReport(true);
      setError(null);
      setDebugInfo(null);
      try {
        const response = await tripReportApi.getTripReport(semesterId);
        setReport(response);
      } catch (err: any) {
        const status = err?.response?.status;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load report.";
        const raw = err?.response?.data;
        console.warn("Trip report error", { status, message, semesterId, raw });
        setReport(null);
        setError(status ? `Unable to load report (status ${status})` : "Unable to load report.");
        setDebugInfo(
          JSON.stringify(
            {
              status,
              message,
              semesterId,
              raw,
            },
            null,
            2
          )
        );
      } finally {
        setLoadingReport(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  useEffect(() => {
    if (selectedSemester?.code) {
      loadReport(selectedSemester.code);
    }
  }, [selectedSemester, loadReport]);

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${value.toLocaleString("en-US")} VND`;
    }
  };

  const attendanceSummary = useMemo(() => {
    if (!report?.studentStatistics?.length) {
      return { present: 0, total: 0, rate: 0 };
    }
    const present = report.studentStatistics.reduce((sum, s) => sum + s.presentCount, 0);
    const total = report.studentStatistics.reduce((sum, s) => sum + s.totalAttendanceRecords, 0);
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, total, rate };
  }, [report]);

  const statusDataset = useMemo(() => {
    const values = [
      { label: "Completed", value: report?.completedTrips ?? 0, color: "#01CBCA" },
      { label: "Scheduled", value: report?.scheduledTrips ?? 0, color: "#7C3AED" },
      { label: "Cancelled", value: report?.cancelledTrips ?? 0, color: "#EF4444" },
    ];
    const max = Math.max(...values.map((v) => v.value), 1);
    return { values, max };
  }, [report]);

  const overviewCards = useMemo(
    () => [
      { label: "Students", value: report?.totalStudentsRegistered ?? 0, color: "#01CBCA" },
      { label: "Trips", value: report?.totalTrips ?? 0, color: "#7C3AED" },
      { label: "Paid", value: formatCurrency(report?.totalAmountPaid ?? 0), color: "#10B981" },
      { label: "Pending", value: formatCurrency(report?.totalAmountPending ?? 0), color: "#F59E0B" },
    ],
    [report]
  );

  const renderProgressRing = (rate: number) => {
    const radius = 48;
    const stroke = 10;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const strokeDashoffset = circumference - (rate / 100) * circumference;
    return (
      <View style={{ width: radius * 2, height: radius * 2, alignItems: "center", justifyContent: "center" }}>
        <Svg width={radius * 2} height={radius * 2}>
          <Circle stroke="#E5E7EB" fill="none" cx={radius} cy={radius} r={normalizedRadius} strokeWidth={stroke} />
          <Circle
            stroke="#01CBCA"
            fill="none"
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={{ position: "absolute", fontFamily: "RobotoSlab-Bold", fontSize: 18, color: "#111827" }}>{`${rate}%`}</Text>
      </View>
    );
  };

  const renderStatusBars = () => {
    const barWidth = (screenWidth - 80) / statusDataset.values.length;
    const chartHeight = 160;
    return (
      <Svg width={screenWidth - 48} height={chartHeight}>
        {statusDataset.values.map((item, index) => {
          const height = (item.value / statusDataset.max) * (chartHeight - 40);
          const x = 24 + index * barWidth;
          const y = chartHeight - height - 24;
          return (
            <Rect key={item.label} x={x} y={y} width={barWidth - 24} height={height} rx={10} fill={item.color} />
          );
        })}
      </Svg>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <LinearGradient
        colors={["#FFEA00", "#FFD54F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 32, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 20, color: "#111827" }}>Trip Report</Text>
            <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#374151", marginTop: 4 }}>
              {selectedSemester ? `${selectedSemester.name} • ${selectedSemester.code}` : "Choose a semester"}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: 18,
              padding: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 12, color: "#6B7280" }}>Total Trips</Text>
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 26, color: "#111827", marginTop: 4 }}>
              {report?.totalTrips ?? 0}
            </Text>
            <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              {`${report?.completedTrips ?? 0} completed`}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: 18,
              padding: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontFamily: "RobotoSlab-Medium", fontSize: 12, color: "#6B7280" }}>Attendance</Text>
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 26, color: "#111827", marginTop: 4 }}>
              {`${attendanceSummary.rate}%`}
            </Text>
            <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              {`${attendanceSummary.present}/${attendanceSummary.total} present`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#111827" }}>Semester</Text>
          <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            Choose a semester to view statistics
          </Text>
          <View style={{ marginTop: 12 }}>
            {loadingSemesters ? (
              <ActivityIndicator size="small" color="#01CBCA" />
            ) : semesters.length > 0 ? (
              <SemesterFilter
                semesters={semesters}
                selectedSemester={selectedSemester}
                onSelectSemester={(semester) => setSelectedSemester(semester)}
              />
            ) : (
              <View style={{ padding: 16, backgroundColor: "#F3F4F6", borderRadius: 14 }}>
                <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 14, color: "#6B7280" }}>
                  No semester available.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 8, gap: 12 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {overviewCards.map((card) => (
              <View
                key={card.label}
                style={{
                  width: (screenWidth - 60) / 2,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 3,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: `${card.color}22`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="ellipse" size={16} color={card.color} />
                </View>
                <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280" }}>{card.label}</Text>
                <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 18, color: "#111827" }}>{card.value}</Text>
              </View>
            ))}
          </View>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#111827" }}>Trip status</Text>
              <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280" }}>
                {report?.totalTrips ?? 0} trips
              </Text>
            </View>
            <View style={{ marginTop: 12, alignItems: "center" }}>{renderStatusBars()}</View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
              {statusDataset.values.map((item) => (
                <View key={item.label} style={{ alignItems: "center", flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }} />
                    <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280" }}>{item.label}</Text>
                  </View>
                  <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 14, color: "#111827", marginTop: 4 }}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <View style={{ width: 120, height: 120, alignItems: "center", justifyContent: "center" }}>
              {renderProgressRing(attendanceSummary.rate)}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#111827" }}>Attendance</Text>
              <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 13, color: "#6B7280" }}>
                Presence across all students for this semester.
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#F0FDF4",
                    borderRadius: 12,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: "#BBF7D0",
                  }}
                >
                  <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#047857" }}>Present</Text>
                  <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#065F46" }}>{attendanceSummary.present}</Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FEF2F2",
                    borderRadius: 12,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: "#FECACA",
                  }}
                >
                  <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#B91C1C" }}>Total records</Text>
                  <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#7F1D1D" }}>{attendanceSummary.total}</Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
              gap: 12,
            }}
          >
            <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 16, color: "#111827" }}>Students</Text>
            {loadingReport && (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#01CBCA" />
              </View>
            )}
            {!loadingReport && (!report?.studentStatistics || report.studentStatistics.length === 0) && (
              <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 14, color: "#6B7280" }}>No data available.</Text>
            )}
            {!loadingReport &&
              report?.studentStatistics?.map((student: StudentTripStatistics) => (
                <View
                  key={student.studentId}
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 14,
                    padding: 12,
                    backgroundColor: "#F9FAFB",
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 15, color: "#111827" }}>{student.studentName}</Text>
                    <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                      <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280" }}>
                        {student.grade || "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1, backgroundColor: "#ECFEFF", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#CFFAFE" }}>
                      <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#0F172A" }}>Paid</Text>
                      <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 15, color: "#0F172A", marginTop: 4 }}>
                        {formatCurrency(student.amountPaid)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: "#FFF7ED", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#FED7AA" }}>
                      <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#7C2D12" }}>Pending</Text>
                      <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 15, color: "#7C2D12", marginTop: 4 }}>
                        {formatCurrency(student.amountPending)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1, backgroundColor: "#EEF2FF", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#E0E7FF" }}>
                      <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#312E81" }}>Trips</Text>
                      <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 15, color: "#111827", marginTop: 4 }}>
                        {student.totalTripsForStudent} total
                      </Text>
                      <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                        {student.completedTripsForStudent} done • {student.upcomingTripsForStudent} upcoming
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#BBF7D0" }}>
                      <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#065F46" }}>Attendance</Text>
                      <Text style={{ fontFamily: "RobotoSlab-Bold", fontSize: 15, color: "#065F46", marginTop: 4 }}>
                        {student.attendanceRate.toFixed(1)}%
                      </Text>
                      <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                        {student.presentCount}/{student.totalAttendanceRecords} present
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>

          {error && (
            <View style={{ padding: 14, backgroundColor: "#FEF2F2", borderRadius: 12, borderWidth: 1, borderColor: "#FECACA" }}>
              <Text style={{ fontFamily: "RobotoSlab-Regular", fontSize: 14, color: "#B91C1C" }}>{error}</Text>
              {debugInfo && (
                <Text
                  style={{
                    marginTop: 8,
                    fontFamily: "RobotoSlab-Regular",
                    fontSize: 12,
                    color: "#7F1D1D",
                  }}
                >
                  {debugInfo}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

