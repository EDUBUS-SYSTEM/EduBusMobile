import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useChildrenList } from "@/hooks/useChildren";
import { authApi } from "@/lib/auth/auth.api";
import { studentAbsenceRequestApi } from "@/lib/parent/studentAbsenceRequest.api";
import type { StudentAbsenceRequestResponse } from "@/lib/parent/studentAbsenceRequest.type";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStatusStyle, formatDateLabel } from "./application-comments.utils";

const MIN_REASON_LENGTH = 5;

export default function ApplicationCommentsScreen() {
  const router = useRouter();
  const {
    children,
    loading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren,
  } = useChildrenList();
  const [parentId, setParentId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [requests, setRequests] = useState<StudentAbsenceRequestResponse[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const usesInlinePicker = isIOS || isWeb;
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const scrollContentStyle = useMemo<ViewStyle>(
    () => ({
      padding: 20,
      paddingBottom: 32,
      ...(isWeb ? { alignItems: "center" } : {}),
    }),
    [isWeb],
  );
  const responsiveCardStyle = useMemo<ViewStyle>(
    () =>
      isWeb
        ? {
            alignSelf: "stretch",
            maxWidth: 900,
          }
        : {},
    [isWeb],
  );
  const pointerStyle = isWeb ? ({ cursor: "pointer" } as ViewStyle) : undefined;

  const changeStartByDays = useCallback(
    (days: number) => {
      setStartDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + days);

        const normalizedNext = new Date(next);
        normalizedNext.setHours(0, 0, 0, 0);
        if (normalizedNext < today) {
          return prev;
        }

        if (endDate < next) {
          setEndDate(next);
        }

        return next;
      });
    },
    [endDate, today],
  );

  const changeEndByDays = useCallback(
    (days: number) => {
      setEndDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + days);

        if (next < startDate) {
          return prev;
        }

        return next;
      });
    },
    [startDate],
  );

  const handleStartDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === "dismissed") {
        if (usesInlinePicker) setShowStartPicker(false);
        return;
      }

      if (date) {
        setStartDate(date);
        if (endDate < date) {
          setEndDate(date);
        }
      }

      if (usesInlinePicker) setShowStartPicker(false);
    },
    [endDate, usesInlinePicker],
  );

  const handleEndDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === "dismissed") {
        if (usesInlinePicker) setShowEndPicker(false);
        return;
      }

      if (date) {
        setEndDate(date);
      }

      if (usesInlinePicker) setShowEndPicker(false);
    },
    [usesInlinePicker],
  );

  const openStartDatePicker = () => {
    if (usesInlinePicker) {
      setShowStartPicker(true);
      return;
    }

    DateTimePickerAndroid.open({
      value: startDate,
      mode: "date",
      display: "calendar",
      minimumDate: today,
      onChange: handleStartDateChange,
    });
  };

  const openEndDatePicker = () => {
    if (usesInlinePicker) {
      setShowEndPicker(true);
      return;
    }

    DateTimePickerAndroid.open({
      value: endDate,
      mode: "date",
      display: "calendar",
      minimumDate: startDate,
      onChange: handleEndDateChange,
    });
  };

  useEffect(() => {
    const loadParentId = async () => {
      try {
        const info = await authApi.getUserInfo();
        if (info.userId) {
          setParentId(info.userId);
        } else {
          Alert.alert(
            "Unable to load account",
            "Cannot identify the parent account. Please sign in again.",
          );
        }
      } catch (error) {
        console.error("Failed to load parent info", error);
        Alert.alert(
          "Unable to load account",
          "Không thể tải thông tin phụ huynh. Vui lòng thử lại.",
        );
      }
    };

    loadParentId();
  }, []);

  useEffect(() => {
    if (children.length > 0 && !selectedStudentId) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  const loadRequests = useCallback(async () => {
    if (!parentId) return;

    try {
      const data = await studentAbsenceRequestApi.getByParent(parentId);
      setRequests(data);
    } catch (error: any) {
      console.error("Failed to load absence requests", error);
    }
  }, [parentId]);

  useEffect(() => {
    if (parentId) {
      void loadRequests();
    }
  }, [parentId, loadRequests]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [requests],
  );

  const latestHistoryStatusStyle = useMemo(() => {
    const latest = sortedRequests[0];
    if (!latest) {
      return {
        label: "No requests",
        color: "#475569",
        background: "#E2E8F0",
      };
    }

    return getStatusStyle(latest.status);
  }, [sortedRequests]);

  const validateForm = () => {
    if (!selectedStudentId) {
      Alert.alert("No student selected", "Please choose a student first.");
      return false;
    }

    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);

    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);

    if (normalizedStart < todayCheck) {
      Alert.alert(
        "Invalid start date",
        "Start date must be today or later.",
      );
      return false;
    }

    if (endDate < startDate) {
      Alert.alert(
        "Invalid date range",
        "End date must be the same as or after the start date.",
      );
      return false;
    }

    if (reason.trim().length < MIN_REASON_LENGTH) {
      Alert.alert(
        "Reason is too short",
        `Please enter at least ${MIN_REASON_LENGTH} characters.`,
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!parentId) {
      Alert.alert(
        "Missing parent info",
        "Unable to identify the requester. Please sign in again.",
      );
      return;
    }

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await studentAbsenceRequestApi.create({
        studentId: selectedStudentId!,
        parentId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: reason.trim(),
        notes: notes.trim() ? notes.trim() : undefined,
      });

      Alert.alert("Request submitted", "We will review it as soon as possible.");
      setReason("");
      setNotes("");
      setStartDate(new Date());
      setEndDate(new Date());
      await loadRequests();
    } catch (error: any) {
      console.error("Failed to submit absence request", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to submit the request. Please try again.";
      Alert.alert("Submission failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        refetchChildren ? refetchChildren() : Promise.resolve(),
        loadRequests(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStudentSelector = () => {
    let content: JSX.Element;

    if (childrenError) {
      content = (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#F59E0B",
            backgroundColor: "#FEF3C7",
            borderRadius: 14,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "RobotoSlab-Regular",
              color: "#92400E",
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            Unable to load students. Pull to refresh and try again.
          </Text>
          <TouchableOpacity onPress={refetchChildren}>
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                color: "#92400E",
                fontSize: 13,
              }}
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else if (childrenLoading) {
      content = (
        <View
          style={{
            padding: 20,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color="#01CBCA" />
        </View>
      );
    } else if (children.length === 0) {
      content = (
        <View
          style={{
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            backgroundColor: "#F8FAFC",
          }}
        >
          <Text
            style={{
              fontFamily: "RobotoSlab-Bold",
              fontSize: 14,
              color: "#122434",
              marginBottom: 4,
            }}
          >
            No students available
          </Text>
          <Text
            style={{
              fontFamily: "RobotoSlab-Regular",
              fontSize: 13,
              color: "#4B6775",
            }}
          >
            This parent account has not been linked to any student yet.
          </Text>
        </View>
      );
    } else {
      content = (
        <View style={{ gap: 10 }}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => setSelectedStudentId(child.id)}
              style={{
                padding: 14,
                borderRadius: 18,
                borderWidth: selectedStudentId === child.id ? 2 : 1,
                borderColor:
                  selectedStudentId === child.id ? "#01CBCA" : "#E2E8F0",
                backgroundColor:
                  selectedStudentId === child.id ? "#E8FFFE" : "#FBFDFF",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Bold",
                    fontSize: 14,
                    color: "#122434",
                  }}
                >
                  {child.firstName} {child.lastName}
                </Text>
                {child.className ? (
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Regular",
                      fontSize: 12,
                      color: "#4B6775",
                    }}
                  >
                    {child.className}
                  </Text>
                ) : null}
              </View>
              {selectedStudentId === child.id && (
                <Ionicons name="checkmark-circle" size={20} color="#01CBCA" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <View style={{ marginTop: 18 }}>
        <Text
          style={{
            fontFamily: "RobotoSlab-Bold",
            fontSize: 13,
            color: "#607587",
            marginBottom: 6,
          }}
        >
          Select a student
        </Text>
        {content}
      </View>
    );
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6FCFF" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={scrollContentStyle}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View
          style={[
            {
              backgroundColor: "#E0F7FA",
              borderRadius: 28,
              padding: 20,
              marginBottom: 20,
            },
            responsiveCardStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: "RobotoSlab-Bold",
              fontSize: 18,
              color: "#013440",
              marginBottom: 8,
            }}
          >
            Transportation absence request
          </Text>
          <Text
            style={{
              fontFamily: "RobotoSlab-Regular",
              fontSize: 13,
              color: "#4B6775",
              lineHeight: 18,
            }}
          >
            Send an official bus absence request. The school will respond after
            reviewing the student schedule.
          </Text>
        </View>

        <View
          style={[
            {
              backgroundColor: "#FFFFFF",
              borderRadius: 28,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 4,
              marginBottom: 24,
            },
            responsiveCardStyle,
          ]}
        >
          <View
            style={{
              flexDirection: isWeb ? "row" : "column",
              alignItems: isWeb ? "center" : "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="document-text-outline" size={24} color="#01CBCA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Bold",
                    fontSize: 16,
                    color: "#042D3E",
                  }}
                >
                  Create a new request
                </Text>
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Regular",
                    fontSize: 12,
                    color: "#6B7C93",
                  }}
                >
                  Choose the student, absence window, and reason
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/application-comments-history")}
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  alignSelf: isWeb ? "auto" : "stretch",
                  justifyContent: "space-between",
                  gap: 10,
                  backgroundColor: "#F8FAFC",
                  borderRadius: 999,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                },
                pointerStyle,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="time-outline" size={16} color="#0F172A" />
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Bold",
                    fontSize: 12,
                    color: "#0F172A",
                  }}
                >
                  View history
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: latestHistoryStatusStyle.background,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Bold",
                    fontSize: 11,
                    color: latestHistoryStatusStyle.color,
                  }}
                >
                  {latestHistoryStatusStyle.label}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {renderStudentSelector()}

          <View style={{ marginTop: 18 }}>
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 13,
                color: "#607587",
                marginBottom: 6,
              }}
            >
              Absence period
            </Text>

            <View style={{ gap: 14 }}>
              <View>
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Regular",
                    fontSize: 12,
                    color: "#607587",
                    marginBottom: 6,
                  }}
                >
                  Start date
                </Text>
                <TouchableOpacity
                  onPress={openStartDatePicker}
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      borderRadius: 18,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                    pointerStyle,
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="calendar-outline" size={18} color="#01CBCA" />
                    <Text
                      style={{
                        fontFamily: "RobotoSlab-Bold",
                        fontSize: 14,
                        color: "#122434",
                        marginLeft: 10,
                      }}
                    >
                      {formatDateLabel(startDate)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#4B6775" />
                </TouchableOpacity>
                {usesInlinePicker && showStartPicker && (
                  isWeb ? (
                    <View
                      style={{
                        marginTop: 8,
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        gap: 8,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => changeStartByDays(-1)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                          backgroundColor: "#F8FAFC",
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "RobotoSlab-Bold",
                            fontSize: 12,
                            color: "#0F172A",
                          }}
                        >
                          -1 day
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => changeStartByDays(1)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                          backgroundColor: "#F0FDFA",
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "RobotoSlab-Bold",
                            fontSize: 12,
                            color: "#0F172A",
                          }}
                        >
                          +1 day
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowStartPicker(false)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          backgroundColor: "#01CBCA",
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "RobotoSlab-Bold",
                            fontSize: 12,
                            color: "#FFFFFF",
                          }}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      minimumDate={today}
                      onChange={handleStartDateChange}
                    />
                  )
                )}
              </View>

              <View>
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Regular",
                    fontSize: 12,
                    color: "#607587",
                    marginBottom: 6,
                  }}
                >
                  End date
                </Text>
                <TouchableOpacity
                  onPress={openEndDatePicker}
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      borderRadius: 18,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                    pointerStyle,
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="calendar-outline" size={18} color="#01CBCA" />
                    <Text
                      style={{
                        fontFamily: "RobotoSlab-Bold",
                        fontSize: 14,
                        color: "#122434",
                        marginLeft: 10,
                      }}
                    >
                      {formatDateLabel(endDate)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#4B6775" />
                </TouchableOpacity>
                {usesInlinePicker && showEndPicker && (
                  isWeb ? (
                    <View
                      style={{
                        marginTop: 8,
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        gap: 8,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => changeEndByDays(-1)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                          backgroundColor: "#F8FAFC",
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "RobotoSlab-Bold",
                            fontSize: 12,
                            color: "#0F172A",
                          }}
                        >
                          -1 day
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => changeEndByDays(1)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                          backgroundColor: "#F0FDFA",
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "RobotoSlab-Bold",
                            fontSize: 12,
                            color: "#0F172A",
                          }}
                        >
                          +1 day
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowEndPicker(false)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          backgroundColor: "#01CBCA",
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "RobotoSlab-Bold",
                            fontSize: 12,
                            color: "#FFFFFF",
                          }}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="default"
                      minimumDate={startDate}
                      onChange={handleEndDateChange}
                    />
                  )
                )}
              </View>
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 13,
                color: "#607587",
                marginBottom: 6,
              }}
            >
              Main reason *
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Example: high fever, staying home for two days."
              placeholderTextColor="#94A3B8"
              multiline
              style={{
                minHeight: 100,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 18,
                padding: 14,
                textAlignVertical: "top",
                fontFamily: "RobotoSlab-Regular",
                fontSize: 14,
                color: "#122434",
              }}
            />
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 12,
                color: "#94A3B8",
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {reason.length} characters
            </Text>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 13,
                color: "#607587",
                marginBottom: 6,
              }}
            >
              Additional notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Extra information for teachers or fleet operations..."
              placeholderTextColor="#94A3B8"
              multiline
              style={{
                minHeight: 70,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 18,
                padding: 14,
                textAlignVertical: "top",
                fontFamily: "RobotoSlab-Regular",
                fontSize: 14,
                color: "#122434",
              }}
            />
          </View>

          <View
            style={{
              marginTop: 16,
              borderRadius: 18,
              backgroundColor: "#F0FDFA",
              padding: 14,
              borderWidth: 1,
              borderColor: "#99F6E4",
            }}
          >
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 13,
                color: "#047857",
                marginBottom: 4,
              }}
            >
              Reminder
            </Text>
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 12,
                color: "#0F766E",
                lineHeight: 18,
              }}
            >
              Only submit when the student has bus rides during the selected
              period. The system will check for schedule conflicts automatically.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !selectedStudentId}
            style={[
              {
                marginTop: 22,
                backgroundColor: submitting || !selectedStudentId ? "#94A3B8" : "#01CBCA",
                borderRadius: 20,
                paddingVertical: 14,
                alignItems: "center",
                opacity: submitting || !selectedStudentId ? 0.7 : 1,
              },
              pointerStyle,
            ]}
          >
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              {submitting ? "Submitting..." : "Submit request"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
