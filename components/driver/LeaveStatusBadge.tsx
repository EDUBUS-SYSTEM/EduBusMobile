import React from 'react';
import { View, Text } from 'react-native';
import { LeaveStatus, getLeaveStatusName, getLeaveStatusColor } from '@/lib/driver/leave.type';

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
  size?: 'small' | 'medium' | 'large';
}

export default function LeaveStatusBadge({ status, size = 'medium' }: LeaveStatusBadgeProps) {
  const statusColor = getLeaveStatusColor(status);
  const statusName = getLeaveStatusName(status);
  
  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 11
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 13
    },
    large: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 15
    }
  };
  
  const currentSize = sizeStyles[size];
  
  return (
    <View style={{
      backgroundColor: `${statusColor}15`, // 15 is 8.5% opacity in hex
      borderRadius: 20,
      paddingHorizontal: currentSize.paddingHorizontal,
      paddingVertical: currentSize.paddingVertical,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center'
    }}>
      {/* Status Dot */}
      <View style={{
        width: size === 'small' ? 6 : size === 'medium' ? 8 : 10,
        height: size === 'small' ? 6 : size === 'medium' ? 8 : 10,
        borderRadius: 5,
        backgroundColor: statusColor,
        marginRight: 6
      }} />
      
      {/* Status Text */}
      <Text style={{
        color: statusColor,
        fontFamily: 'RobotoSlab-Bold',
        fontSize: currentSize.fontSize,
        textTransform: 'uppercase'
      }}>
        {statusName}
      </Text>
    </View>
  );
}

