import { useChildrenList } from "@/hooks/useChildren";
import { authApi } from "@/lib/auth/auth.api";
import { studentAbsenceRequestApi } from "@/lib/parent/studentAbsenceRequest.api";
import type {
  AbsenceRequestStatus,
  PaginationInfo,
  StudentAbsenceRequestQueryParams,
  StudentAbsenceRequestResponse,
  StudentAbsenceRequestSortOption,
} from "@/lib/parent/studentAbsenceRequest.type";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatDateLabel,
  formatRangeLabel,
  formatSubmittedAt,
  getStatusStyle,
} from "./utils";

type FilterStatus = "All" | AbsenceRequestStatus;

const STATUS_FILTERS: FilterStatus[] = ["All", "Pending", "Approved", "Rejected"];
const PAGE_SIZE = 10;

export default function AbsenceReportScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const {
    children,
    loading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren,
  } = useChildrenList();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Absence Report",
      headerShown: true,
      headerStyle: { backgroundColor: "#FFD700" },
      headerTintColor: "#013440",
      headerTitleStyle: {
        fontFamily: "RobotoSlab-Bold",
        color: "#013440",
      },
    });
  }, [navigation]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [requests, setRequests] = useState<StudentAbsenceRequestResponse[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [sortOption, setSortOption] =
    useState<StudentAbsenceRequestSortOption>("Newest");
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isWeb = Platform.OS === "web";
  const usesInlinePicker = Platform.OS === "ios";
  const hasActiveFilters =
    statusFilter !== "All" || startDateFilter !== null || endDateFilter !== null;
  const scrollContentStyle = useMemo<ViewStyle>(
    () => ({
      paddingTop: 4,
      paddingHorizontal: 20,
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
  const statusControlContainerStyle = useMemo<ViewStyle>(
    () =>
      isWeb
        ? {
            width: 200,
            alignSelf: "flex-start",
          }
        : {
            width: "50%",
            minWidth: 150,
            alignSelf: "flex-start",
          },
    [isWeb],
  );
  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  useEffect(() => {
    const loadParentId = async () => {
      try {
        const info = await authApi.getUserInfo();
        if (info.userId) {
          setParentId(info.userId);
        } else {
          setRequestsError(
            "Cannot identify the parent account. Please sign in again.",
          );
        }
      } catch (error) {
        console.error("Failed to load parent info", error);
        setRequestsError("Unable to load parent information.");
      }
    };

    loadParentId();
  }, []);

  const studentLookup = useMemo(() => {
    const map = new Map<string, (typeof children)[number]>();
    for (const child of children) {
      map.set(child.id, child);
    }
    return map;
  }, [children]);

  const loadRequests = useCallback(async () => {
    if (!parentId) return;

    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const params: StudentAbsenceRequestQueryParams = {
        page: currentPage,
        perPage: PAGE_SIZE,
        sort: sortOption,
        status: statusFilter === "All" ? undefined : statusFilter,
        startDate: startDateFilter?.toISOString(),
        endDate: endDateFilter?.toISOString(),
      };
      const response = await studentAbsenceRequestApi.getByParent(params);
      setRequests(response.data ?? []);
      setPaginationInfo(response.pagination ?? null);
      if (response.pagination?.currentPage) {
        setCurrentPage(response.pagination.currentPage);
      }
    } catch (error: any) {
      console.error("Failed to load absence requests", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to load absence requests.";
      setRequestsError(message);
    } finally {
      setRequestsLoading(false);
    }
  }, [
    parentId,
    currentPage,
    sortOption,
    statusFilter,
    startDateFilter,
    endDateFilter,
  ]);

  useEffect(() => {
    if (parentId) {
      void loadRequests();
    }
  }, [parentId, loadRequests]);

  // Refresh data when screen comes into focus (e.g., when returning from create screen)
  useFocusEffect(
    useCallback(() => {
      if (parentId) {
        void loadRequests();
      }
    }, [parentId, loadRequests])
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortOption, startDateFilter, endDateFilter]);

  useEffect(() => {
    setShowStatusDropdown(false);
  }, [statusFilter]);
  useEffect(() => {
    if (!showFilters) {
      setShowStatusDropdown(false);
    }
  }, [showFilters]);

  const handleStartDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === "dismissed") {
        if (usesInlinePicker) setShowStartPicker(false);
        return;
      }

      if (date) {
        setStartDateFilter(date);
        if (endDateFilter && date > endDateFilter) {
          setEndDateFilter(date);
        }
      }

      if (usesInlinePicker) setShowStartPicker(false);
    },
    [endDateFilter, usesInlinePicker],
  );

  const handleEndDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === "dismissed") {
        if (usesInlinePicker) setShowEndPicker(false);
        return;
      }

      if (date) {
        setEndDateFilter(date);
        if (startDateFilter && date < startDateFilter) {
          setStartDateFilter(date);
        }
      }

      if (usesInlinePicker) setShowEndPicker(false);
    },
    [startDateFilter, usesInlinePicker],
  );

  const openStartDatePicker = () => {
    if (usesInlinePicker) {
      setShowStartPicker(true);
      return;
    }

    DateTimePickerAndroid.open({
      value: startDateFilter ?? new Date(),
      mode: "date",
      display: "calendar",
      maximumDate: endDateFilter ?? undefined,
      onChange: handleStartDateChange,
    });
  };

  const openEndDatePicker = () => {
    if (usesInlinePicker) {
      setShowEndPicker(true);
      return;
    }

    DateTimePickerAndroid.open({
      value: endDateFilter ?? startDateFilter ?? new Date(),
      mode: "date",
      display: "calendar",
      minimumDate: startDateFilter ?? undefined,
      onChange: handleEndDateChange,
    });
  };

  const clearDateFilters = () => {
    setStartDateFilter(null);
    setEndDateFilter(null);
  };

  const resetFilters = () => {
    setStatusFilter("All");
    setSortOption("Newest");
    clearDateFilters();
  };

  const toggleSortOrder = () => {
    setSortOption((prev) => (prev === "Newest" ? "Oldest" : "Newest"));
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadRequests(), refetchChildren()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadRequests, refetchChildren]);

  const renderContent = () => {
    if (requestsLoading && requests.length === 0) {
      return (
        <View
          style={[
            {
              paddingVertical: 40,
              alignItems: "center",
              justifyContent: "center",
            },
            responsiveCardStyle,
          ]}
        >
          <ActivityIndicator color="#01CBCA" />
          <Text
            style={{
              fontFamily: "RobotoSlab-Regular",
              fontSize: 13,
              color: "#4B6775",
              marginTop: 12,
            }}
          >
            Loading reports...
          </Text>
        </View>
      );
    }

    if (requestsError) {
      return (
        <View
          style={[
            {
              borderWidth: 1,
              borderColor: "#FCA5A5",
              backgroundColor: "#FEF2F2",
              borderRadius: 18,
              padding: 16,
              gap: 8,
            },
            responsiveCardStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: "RobotoSlab-Bold",
              fontSize: 14,
              color: "#B91C1C",
            }}
          >
            Unable to load reports
          </Text>
          <Text
            style={{
              fontFamily: "RobotoSlab-Regular",
              fontSize: 13,
              color: "#991B1B",
            }}
          >
            {requestsError}
          </Text>
          <TouchableOpacity onPress={loadRequests} style={pointerStyle}>
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 13,
                color: "#B91C1C",
              }}
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (requests.length === 0 && !requestsLoading) {
      return (
        <View
          style={[
            {
              padding: 24,
              borderRadius: 24,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.07,
              shadowRadius: 8,
              elevation: 3,
            },
            responsiveCardStyle,
          ]}
        >
          <Ionicons name="document-text-outline" size={32} color="#94A3B8" />
          <Text
            style={{
              fontFamily: "RobotoSlab-Bold",
              fontSize: 15,
              color: "#122434",
              marginTop: 12,
            }}
          >
            No reports yet
          </Text>
          <Text
            style={{
              fontFamily: "RobotoSlab-Regular",
              fontSize: 13,
              color: "#4B6775",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Submit an absence report to see its status here.
          </Text>
        </View>
      );
    }

    const renderPaginationControls = () => {
      if (!paginationInfo) return null;

      return (
        <View
          style={{
            marginTop: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "#E2E8F0",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            disabled={!paginationInfo.hasPreviousPage || requestsLoading}
            onPress={() =>
              setCurrentPage((prev) => Math.max(1, prev - 1))
            }
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#CBD5F5",
              backgroundColor: paginationInfo.hasPreviousPage
                ? "#FFFFFF"
                : "#F1F5F9",
              opacity: paginationInfo.hasPreviousPage ? 1 : 0.6,
            }}
          >
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 13,
                color: "#1E293B",
              }}
            >
              Previous
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: "RobotoSlab-Bold",
              fontSize: 13,
              color: "#122434",
            }}
          >
            Page {paginationInfo.currentPage} / {paginationInfo.totalPages}
          </Text>
          <TouchableOpacity
            disabled={!paginationInfo.hasNextPage || requestsLoading}
            onPress={() =>
              setCurrentPage((prev) =>
                paginationInfo.hasNextPage ? prev + 1 : prev,
              )
            }
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#CBD5F5",
              backgroundColor: paginationInfo.hasNextPage
                ? "#FFFFFF"
                : "#F1F5F9",
              opacity: paginationInfo.hasNextPage ? 1 : 0.6,
            }}
          >
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 13,
                color: "#1E293B",
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={[{ gap: 14 }, responsiveCardStyle]}>
        {requests.map((request) => {
          const student = studentLookup.get(request.studentId);
          const status = getStatusStyle(request.status);

          return (
            <View
              key={request.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 18,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.07,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Bold",
                      fontSize: 15,
                      color: "#001E2B",
                    }}
                  >
                    {formatRangeLabel(request.startDate, request.endDate)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Bold",
                      fontSize: 13,
                      color: "#122434",
                      marginTop: 2,
                    }}
                  >
                    {student
                      ? `${student.firstName} ${student.lastName}`
                      : "Unknown student"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Regular",
                      fontSize: 12,
                      color: "#6B7C93",
                      marginTop: 2,
                    }}
                  >
                    Submitted at {formatSubmittedAt(request.createdAt)}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 999,
                    backgroundColor: status.background,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Bold",
                      fontSize: 12,
                      color: status.color,
                    }}
                  >
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 8 }}>
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Bold",
                    fontSize: 12,
                    color: "#607587",
                    marginBottom: 4,
                  }}
                >
                  Parent reason
                </Text>
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Regular",
                    fontSize: 13,
                    color: "#122434",
                    lineHeight: 18,
                  }}
                >
                  {request.reason}
                </Text>
              </View>

              {request.notes ? (
                <View style={{ marginBottom: 8 }}>
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Bold",
                      fontSize: 12,
                      color: "#607587",
                      marginBottom: 4,
                    }}
                  >
                    Additional notes
                  </Text>
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Regular",
                      fontSize: 13,
                      color: "#122434",
                      lineHeight: 18,
                    }}
                  >
                    {request.notes}
                  </Text>
                </View>
              ) : null}

              {request.reviewedAt ? (
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Regular",
                    fontSize: 12,
                    color: "#4B6775",
                    marginTop: 4,
                  }}
                >
                  Updated {formatSubmittedAt(request.reviewedAt)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6FCFF" }}>
      <TouchableOpacity
        onPress={toggleFilters}
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: "#FFD700",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
            position: "absolute",
            top: 8,
            right: 20,
            zIndex: 10,
          },
          pointerStyle,
        ]}
      >
        <Ionicons
          name="funnel-outline"
          size={22}
            color="#013440"
        />
      </TouchableOpacity>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={scrollContentStyle}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={[{ marginBottom: 2, minHeight: 20 }, responsiveCardStyle]}>
          {childrenError ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#FCA5A5",
                backgroundColor: "#FEF2F2",
                borderRadius: 12,
                padding: 12,
                gap: 4,
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 13,
                  color: "#991B1B",
                }}
              >
                Unable to load students
              </Text>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Regular",
                  fontSize: 12,
                  color: "#B91C1C",
                }}
              >
                {childrenError}
              </Text>
            </View>
          ) : null}
        </View>

        {showFilters ? (
          <View
            style={[
              {
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 16,
                gap: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
                marginBottom: 18,
              },
              responsiveCardStyle,
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 14,
                  color: "#122434",
                }}
              >
                Filters
              </Text>
              {hasActiveFilters ? (
                <TouchableOpacity onPress={resetFilters} style={pointerStyle}>
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Bold",
                      fontSize: 12,
                      color: "#01CBCA",
                    }}
                  >
                    Reset
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 12,
                  color: "#607587",
                }}
              >
                Date range
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#D5DFEB",
                    borderRadius: 14,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F8FAFC",
                  }}
                  onPress={openStartDatePicker}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="calendar-outline" size={16} color="#607587" />
                    <Text
                      style={{
                        fontFamily: "RobotoSlab-Bold",
                        fontSize: 12,
                        color: startDateFilter ? "#122434" : "#94A3B8",
                      }}
                    >
                      {startDateFilter ? formatDateLabel(startDateFilter) : "Start date"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#D5DFEB",
                    borderRadius: 14,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F8FAFC",
                  }}
                  onPress={openEndDatePicker}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="calendar-outline" size={16} color="#607587" />
                    <Text
                      style={{
                        fontFamily: "RobotoSlab-Bold",
                        fontSize: 12,
                        color: endDateFilter ? "#122434" : "#94A3B8",
                      }}
                    >
                      {endDateFilter ? formatDateLabel(endDateFilter) : "End date"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              {usesInlinePicker && showStartPicker ? (
                <DateTimePicker
                  value={startDateFilter ?? new Date()}
                  mode="date"
                  display="inline"
                  maximumDate={endDateFilter ?? undefined}
                  onChange={handleStartDateChange}
                  style={{ alignSelf: "stretch" }}
                />
              ) : null}
              {usesInlinePicker && showEndPicker ? (
                <DateTimePicker
                  value={endDateFilter ?? startDateFilter ?? new Date()}
                  mode="date"
                  display="inline"
                  minimumDate={startDateFilter ?? undefined}
                  onChange={handleEndDateChange}
                  style={{ alignSelf: "stretch" }}
                />
              ) : null}
            </View>

            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 12,
                  color: "#607587",
                }}
              >
                Status
              </Text>
              <View
                style={[
                  { gap: 6, alignSelf: "flex-start" },
                  statusControlContainerStyle,
                ]}
              >
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: "#D5DFEB",
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F8FAFC",
                    width: "100%",
                  }}
                  onPress={() => setShowStatusDropdown((prev) => !prev)}
                  disabled={requestsLoading}
                >
                  <Text
                    style={{
                      fontFamily: "RobotoSlab-Bold",
                      fontSize: 12,
                      color: "#122434",
                    }}
                  >
                    {statusFilter}
                  </Text>
                  <Ionicons
                    name={showStatusDropdown ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#607587"
                  />
                </TouchableOpacity>
                {showStatusDropdown ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#D5DFEB",
                      borderRadius: 14,
                      backgroundColor: "#FFFFFF",
                      overflow: "hidden",
                      width: "100%",
                    }}
                  >
                    {STATUS_FILTERS.map((filter, index) => {
                      const isActive = statusFilter === filter;
                      const isLast = index === STATUS_FILTERS.length - 1;
                      return (
                        <TouchableOpacity
                          key={filter}
                          onPress={() => setStatusFilter(filter)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            backgroundColor: isActive ? "#E8FBFB" : "#FFFFFF",
                            borderBottomWidth: isLast ? 0 : 1,
                            borderBottomColor: "#F1F5F9",
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "RobotoSlab-Bold",
                              fontSize: 12,
                              color: isActive ? "#017B79" : "#4B6775",
                            }}
                          >
                            {filter}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 12,
                  color: "#607587",
                }}
              >
                Sort by date
              </Text>
              <TouchableOpacity
                onPress={toggleSortOrder}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#01CBCA",
                  backgroundColor: "#E8FBFB",
                }}
              >
                <Ionicons
                  name={sortOption === "Newest" ? "arrow-down" : "arrow-up"}
                  size={14}
                  color="#01A9A8"
                />
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Bold",
                    fontSize: 12,
                    color: "#017B79",
                  }}
                >
                  {sortOption === "Newest" ? "Newest first" : "Oldest first"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {renderContent()}
      </ScrollView>
      <TouchableOpacity
        onPress={() => router.push("/application-comments/create")}
        style={[
          {
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#01CBCA",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          },
          pointerStyle,
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}