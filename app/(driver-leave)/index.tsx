import LeaveRequestCard from '@/components/driver/LeaveRequestCard';
import { leaveApi } from '@/lib/driver/leave.api';
import { LeaveRequestResponse, LeaveStatus, PaginationInfo } from '@/lib/driver/leave.type';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type TabFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function LeaveRequestsScreen() {
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const getStatusFromTab = (tab: TabFilter): number | undefined => {
    switch (tab) {
      case 'pending':
        return LeaveStatus.Pending;
      case 'approved':
        return LeaveStatus.Approved;
      case 'rejected':
        return LeaveStatus.Rejected;
      case 'all':
      default:
        return undefined;
    }
  };

  const loadLeaveRequests = async (showRefreshIndicator = false, page = 1) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const statusFilter = getStatusFromTab(activeTab);
      const response = await leaveApi.getMyLeaveRequests(
        undefined,
        undefined,
        statusFilter,
        page,
        20
      );

      if (page === 1) {
        setLeaveRequests(response.data);
      } else {
        setLeaveRequests(prev => [...prev, ...response.data]);
      }

      setPagination(response.pagination);
      setPendingCount(response.pendingLeavesCount);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      Alert.alert(
        'Error',
        'Failed to load leave requests. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleTabChange = (tab: TabFilter) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  const loadMoreRequests = () => {
    if (pagination?.hasNextPage && !isLoadingMore && !isLoading) {
      loadLeaveRequests(false, currentPage + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setCurrentPage(1);
    loadLeaveRequests(true, 1);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
    loadLeaveRequests(false, 1);
  }, [activeTab]);

  useEffect(() => {
    if (refresh === 'true') {
      setCurrentPage(1);
      loadLeaveRequests(true, 1);
    }
  }, [refresh]);

  const getCounts = () => {
    return {
      all: pagination?.totalItems || leaveRequests.length,
      pending: pendingCount,
      approved: 0,
      rejected: 0
    };
  };

  const counts = getCounts();

  const TabButton = ({ label, count, filter }: { label: string; count: number; filter: TabFilter }) => (
    <TouchableOpacity
      onPress={() => handleTabChange(filter)}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: activeTab === filter ? '#01CBCA' : '#E0F7FA',
        borderRadius: 20,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center'
      }}
      activeOpacity={0.7}
    >
      <Text style={{
        fontFamily: 'RobotoSlab-Bold',
        fontSize: 14,
        color: activeTab === filter ? '#FFFFFF' : '#01CBCA'
      }}>
        {label}
      </Text>
      {count > 0 && (
        <View style={{
          backgroundColor: activeTab === filter ? '#FFFFFF' : '#01CBCA',
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 6,
          paddingHorizontal: 6
        }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 11,
            color: activeTab === filter ? '#01CBCA' : '#FFFFFF'
          }}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 15
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 24,
            color: '#000000',
            flex: 1
          }}>
            Leave Requests
          </Text>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={{ paddingVertical: 15, paddingHorizontal: 20 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <TabButton label="All" count={counts.all} filter="all" />
          <TabButton label="Pending" count={counts.pending} filter="pending" />
          <TabButton label="Approved" count={counts.approved} filter="approved" />
          <TabButton label="Rejected" count={counts.rejected} filter="rejected" />
        </ScrollView>
      </View>

      {/* Leave Requests List */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#01CBCA"
            colors={['#01CBCA']}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMoreRequests();
          }
        }}
        scrollEventThrottle={400}
      >
        {isLoading ? (
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 60
          }}>
            <ActivityIndicator size="large" color="#01CBCA" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 14,
              color: '#666',
              marginTop: 16
            }}>
              Loading leave requests...
            </Text>
          </View>
        ) : leaveRequests.length === 0 ? (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 80,
            paddingHorizontal: 40
          }}>
            <Ionicons name="calendar-outline" size={80} color="#E0F7FA" />
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 18,
              color: '#000000',
              marginTop: 20,
              textAlign: 'center'
            }}>
              No {activeTab !== 'all' ? activeTab : ''} leave requests
            </Text>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 14,
              color: '#666',
              marginTop: 8,
              textAlign: 'center'
            }}>
              {activeTab === 'all'
                ? "Tap '+' button to create your first request"
                : `You don't have any ${activeTab} leave requests`}
            </Text>
          </View>
        ) : (
          <>
            {leaveRequests.map((request) => (
              <LeaveRequestCard
                key={request.id}
                leaveRequest={request}
                onPress={() => router.push({
                  pathname: '/(driver-leave)/[id]',
                  params: { id: request.id }
                })}
              />
            ))}

            {/* Load More Indicator */}
            {isLoadingMore && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#01CBCA" />
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 12,
                  color: '#666',
                  marginTop: 8
                }}>
                  Loading more...
                </Text>
              </View>
            )}

            {/* Pagination Info */}
            {pagination && !isLoadingMore && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 12,
                  color: '#999'
                }}>
                  {pagination.hasNextPage
                    ? `Showing ${leaveRequests.length} of ${pagination.totalItems} • Scroll for more`
                    : `Showing all ${pagination.totalItems} requests`}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push('/(driver-leave)/new')}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#01CBCA',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

