import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useChildrenList } from "@/hooks/useChildren";
import { authApi } from "@/lib/auth/auth.api";
import { studentAbsenceRequestApi } from "@/lib/parent/studentAbsenceRequest.api";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatDateLabel } from "./utils";

const MIN_REASON_LENGTH = 30;

export default function CreateAbsenceReportScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const router = useRouter();
  const navigation = useNavigation();
  const {
    children,
    loading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren,
  } = useChildrenList();
  const scrollViewRef = useRef<ScrollView>(null);
  const reasonInputRef = useRef<TextInput>(null);
  const reasonInputLayout = useRef({ y: 0, height: 0 });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Absence Report',
      headerShown: true,
    });
  }, [navigation]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [reason, setReason] = useState("");
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
      paddingBottom: screenHeight < 800 ? 150 : 100,
      ...(isWeb ? { alignItems: "center" } : {}),
    }),
    [isWeb, screenHeight],
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

  const calculateDays = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

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
          "Unable to load parent information. Please try again.",
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

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      Alert.alert(
        "Reason is required",
        "Please enter a reason.",
      );
      return false;
    }

    if (trimmedReason.length < MIN_REASON_LENGTH) {
      Alert.alert(
        "Reason is too short",
        `Please enter at least ${MIN_REASON_LENGTH} characters. You have entered ${trimmedReason.length} characters.`,
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
        notes: undefined,
      });

      Alert.alert("Report submitted", "We will review it as soon as possible.");
      setReason("");
      setStartDate(new Date());
      setEndDate(new Date());
      router.back();
    } catch (error: any) {
      console.error("Failed to submit absence report", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to submit the report. Please try again.";
      Alert.alert("Submission failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await (refetchChildren ? refetchChildren() : Promise.resolve());
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
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={scrollContentStyle}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
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
            Absence Report
          </Text>
          <Text
            style={{
              fontFamily: "RobotoSlab-Regular",
              fontSize: 13,
              color: "#4B6775",
              lineHeight: 18,
            }}
          >
            Send an official bus absence report. The school will respond after
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
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
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
                Create a new report
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

          <View style={{ marginTop: 12 }}>
            <View
              style={{
                backgroundColor: "#F0FDFA",
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: "#99F6E4",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="calendar" size={16} color="#047857" />
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 13,
                  color: "#047857",
                  marginLeft: 8,
                }}
              >
                {calculateDays} {calculateDays === 1 ? "day" : "days"}
              </Text>
            </View>
          </View>

          <View 
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              reasonInputLayout.current = { y, height };
            }}
            style={{ marginTop: 18 }}
          >
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
              ref={reasonInputRef}
              value={reason}
              onChangeText={setReason}
              placeholder="Example: high fever, staying home for two days."
              placeholderTextColor="#94A3B8"
              multiline
              onFocus={() => {
                setTimeout(() => {
                  if (scrollViewRef.current && reasonInputLayout.current.y > 0) {
                    // Scroll để input field không bị che bởi keyboard
                    // Điều chỉnh offset dựa trên kích thước màn hình
                    const offset = screenHeight < 800 ? 150 : 200;
                    scrollViewRef.current.scrollTo({
                      y: Math.max(0, reasonInputLayout.current.y - offset),
                      animated: true,
                    });
                  }
                }, 300);
              }}
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
                color: reason.length < MIN_REASON_LENGTH ? "#EF4444" : "#94A3B8",
                textAlign: "right",
                marginTop: 4,
              }}
            >
              Min {MIN_REASON_LENGTH} characters
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
              {submitting ? "Submitting..." : "Submit report"}
            </Text>
          </TouchableOpacity>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

