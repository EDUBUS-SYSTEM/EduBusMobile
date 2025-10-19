import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { leaveApi } from '@/lib/driver/leave.api';
import {
  LeaveRequestResponse,
  LeaveStatus,
  getLeaveTypeName,
  getLeaveTypeIcon,
  formatDateRange,
  calculateDaysBetween,
  formatDateTime
} from '@/lib/driver/leave.type';
import LeaveStatusBadge from '@/components/driver/LeaveStatusBadge';

export default function LeaveRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaveRequest();
  }, [id]);

  const loadLeaveRequest = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const request = await leaveApi.getLeaveRequestById(id);
      setLeaveRequest(request);
    } catch (error) {
      console.error('Error loading leave request:', error);
      Alert.alert('Error', 'Failed to load leave request details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !leaveRequest) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#01CBCA" />
        <Text style={{
          fontFamily: 'RobotoSlab-Medium',
          fontSize: 14,
          color: '#666',
          marginTop: 16
        }}>
          Loading details...
        </Text>
      </View>
    );
  }

  const dayCount = calculateDaysBetween(leaveRequest.startDate, leaveRequest.endDate);

  // Info Row Component
  const InfoRow = ({ icon, label, value, isLast = false }: { icon: string; label: string; value: string | React.ReactNode; isLast?: boolean }) => (
    <>
      <View style={{ flexDirection: 'row', paddingVertical: 16 }}>
        <View style={{ width: 40, alignItems: 'center' }}>
          <Ionicons name={icon as any} size={24} color="#01CBCA" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Medium',
            fontSize: 12,
            color: '#666',
            marginBottom: 4
          }}>
            {label}
          </Text>
          {typeof value === 'string' ? (
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 16,
              color: '#000000'
            }}>
              {value}
            </Text>
          ) : value}
        </View>
      </View>
      {!isLast && (
        <View style={{ 
          height: 1, 
          backgroundColor: '#E0E0E0', 
          marginLeft: 52 
        }} />
      )}
    </>
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
            Leave Request Details
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Status Badge */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <LeaveStatusBadge status={leaveRequest.status} size="large" />
        </View>

        {/* Main Information Card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#F0F0F0'
        }}>
          <InfoRow
            icon={getLeaveTypeIcon(leaveRequest.leaveType)}
            label="Leave Type"
            value={getLeaveTypeName(leaveRequest.leaveType)}
          />

          <InfoRow
            icon="calendar-outline"
            label="Period"
            value={
              <View>
                <Text style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 16,
                  color: '#000000',
                  marginBottom: 8
                }}>
                  {formatDateRange(leaveRequest.startDate, leaveRequest.endDate)}
                </Text>
                <View style={{
                  backgroundColor: '#E0F7FA',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  alignSelf: 'flex-start'
                }}>
                  <Text style={{
                    fontFamily: 'RobotoSlab-Bold',
                    fontSize: 13,
                    color: '#01CBCA'
                  }}>
                    {dayCount} {dayCount === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>
            }
          />

          <InfoRow
            icon="document-text-outline"
            label="Reason"
            value={
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 15,
                color: '#000000',
                lineHeight: 22
              }}>
                {leaveRequest.reason}
              </Text>
            }
          />

          <InfoRow
            icon="time-outline"
            label="Requested At"
            value={formatDateTime(leaveRequest.requestedAt)}
            isLast={!(leaveRequest.status === LeaveStatus.Approved || leaveRequest.status === LeaveStatus.Rejected)}
          />

          {/* Approval/Rejection Details */}
          {(leaveRequest.status === LeaveStatus.Approved || leaveRequest.status === LeaveStatus.Rejected) && (
            <>
              {leaveRequest.approvedAt && (
                <InfoRow
                  icon="checkmark-circle-outline"
                  label={leaveRequest.status === LeaveStatus.Approved ? 'Approved At' : 'Rejected At'}
                  value={formatDateTime(leaveRequest.approvedAt)}
                />
              )}

              {leaveRequest.approvalNote && (
                <InfoRow
                  icon="chatbox-ellipses-outline"
                  label="Admin Note"
                  value={
                    <Text style={{
                      fontFamily: 'RobotoSlab-Regular',
                      fontSize: 15,
                      color: '#000000',
                      lineHeight: 22
                    }}>
                      {leaveRequest.approvalNote}
                    </Text>
                  }
                  isLast={!(leaveRequest.status === LeaveStatus.Approved && leaveRequest.suggestedReplacementDriverName)}
                />
              )}

              {leaveRequest.status === LeaveStatus.Approved && leaveRequest.suggestedReplacementDriverName && (
                <InfoRow
                  icon="person-outline"
                  label="Replacement Driver"
                  value={leaveRequest.suggestedReplacementDriverName}
                  isLast
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

