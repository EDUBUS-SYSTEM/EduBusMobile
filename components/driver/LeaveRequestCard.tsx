import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LeaveStatusBadge from './LeaveStatusBadge';
import {
  LeaveRequestResponse,
  getLeaveTypeName,
  getLeaveTypeIcon,
  formatDateRange,
  calculateDaysBetween,
  formatDateTime,
  getLeaveStatusColor
} from '@/lib/driver/leave.type';

interface LeaveRequestCardProps {
  leaveRequest: LeaveRequestResponse;
  onPress?: () => void;
}

export default function LeaveRequestCard({ leaveRequest, onPress }: LeaveRequestCardProps) {
  const {
    id,
    leaveType,
    startDate,
    endDate,
    reason,
    status,
    requestedAt
  } = leaveRequest;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/(driver-leave)/[id]',
        params: { id: id }
      });
    }
  };

  const dayCount = calculateDaysBetween(startDate, endDate);
  const statusColor = getLeaveStatusColor(status);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        backgroundColor: '#F8F9FA',
        borderRadius: 15,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}
      activeOpacity={0.7}
    >
      {/* Header: Status Badge and Requested Date */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <LeaveStatusBadge status={status} size="small" />
        <Text style={{ 
          color: '#666', 
          fontSize: 11,
          fontFamily: 'RobotoSlab-Regular'
        }}>
          {formatDateTime(requestedAt)}
        </Text>
      </View>

      {/* Leave Type */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: 8
      }}>
        <Ionicons 
          name={getLeaveTypeIcon(leaveType) as any} 
          size={20} 
          color="#01CBCA" 
        />
        <Text style={{ 
          fontSize: 16,
          fontFamily: 'RobotoSlab-Bold',
          color: '#000000',
          marginLeft: 8
        }}>
          {getLeaveTypeName(leaveType)}
        </Text>
      </View>

      {/* Date Range */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
      }}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={{ 
          color: '#666', 
          fontSize: 14,
          fontFamily: 'RobotoSlab-Medium',
          marginLeft: 6
        }}>
          {formatDateRange(startDate, endDate)}
        </Text>
        <View style={{
          backgroundColor: '#E0F7FA',
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 2,
          marginLeft: 8
        }}>
          <Text style={{
            color: '#01CBCA',
            fontSize: 12,
            fontFamily: 'RobotoSlab-Bold'
          }}>
            {dayCount} {dayCount === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      {/* Reason Preview */}
      <Text 
        style={{ 
          color: '#000', 
          fontSize: 14,
          fontFamily: 'RobotoSlab-Regular',
          marginTop: 4,
          lineHeight: 20
        }}
        numberOfLines={2}
      >
        {reason}
      </Text>

      {/* Arrow Icon */}
      <View style={{
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10
      }}>
        <Ionicons name="chevron-forward" size={20} color="#01CBCA" />
      </View>
    </TouchableOpacity>
  );
}

