import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useChildrenList } from "@/hooks/useChildren";
import { authApi } from "@/lib/auth/auth.api";
import { studentAbsenceRequestApi } from "@/lib/parent/studentAbsenceRequest.api";
import type { StudentAbsenceRequestResponse } from "@/lib/parent/studentAbsenceRequest.type";
import {
  getStatusStyle,
  formatRangeLabel,
  formatSubmittedAt,
} from "./utils";

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
      title: 'Absence Report',
      headerShown: true,
    });
  }, [navigation]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [requests, setRequests] = useState<StudentAbsenceRequestResponse[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isWeb = Platform.OS === "web";
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
      const response = await studentAbsenceRequestApi.getByParent();
      setRequests(response.data ?? []);
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
  }, [parentId]);

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

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [requests],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadRequests(), refetchChildren()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadRequests, refetchChildren]);

  const renderContent = () => {
    if (requestsLoading && sortedRequests.length === 0) {
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

    if (sortedRequests.length === 0 && !requestsLoading) {
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

    return (
      <View style={[{ gap: 14 }, responsiveCardStyle]}>
        {sortedRequests.map((request) => {
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={scrollContentStyle}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={[{ gap: 12, marginBottom: 16 }, responsiveCardStyle]}>
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 18,
                color: "#001E2B",
              }}
            >
              Absence Report
            </Text>
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 12,
                color: "#6B7C93",
              }}
            >
              Check the processing status of each absence report.
            </Text>
          </View>

          {childrenError ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#FCA5A5",
                backgroundColor: "#FEF2F2",
                borderRadius: 12,
                padding: 12,
                gap: 4,
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
