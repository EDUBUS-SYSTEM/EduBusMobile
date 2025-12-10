import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RelocationRequest } from '@/lib/parent/relocationRequest.type';

interface Props {
  request: RelocationRequest;
  onPress: () => void;
}

export function RelocationRequestCard({ request, onPress }: Props) {
  const statusColor = getStatusColor(request.requestStatus);
  const statusIcon = getStatusIcon(request.requestStatus);

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="location" size={20} color="#01CBCA" />
        <Text style={styles.studentName}>{request.studentName}</Text>
      </View>

      <Text style={styles.reason}>Reason: {formatReason(request.reason)}</Text>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {statusIcon} {request.requestStatus}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(request.submittedAt)}</Text>
      </View>

      {request.additionalPaymentRequired > 0 && (
        <Text style={styles.payment}>
          Additional: {formatCurrency(request.additionalPaymentRequired)} VND
        </Text>
      )}

      {request.refundAmount > 0 && (
        <Text style={styles.refund}>
          Refund: {formatCurrency(request.refundAmount)} VND
        </Text>
      )}
    </TouchableOpacity>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Pending':
    case 'UnderReview':
      return '#FFF9C4';
    case 'Approved':
    case 'Implemented':
      return '#C8E6C9';
    case 'Rejected':
    case 'Cancelled':
      return '#FFCDD2';
    case 'AwaitingPayment':
      return '#BBDEFB';
    default:
      return '#E0E0E0';
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'Pending':
    case 'UnderReview':
      return '🟡';
    case 'Approved':
    case 'Implemented':
      return '✅';
    case 'Rejected':
    case 'Cancelled':
      return '❌';
    case 'AwaitingPayment':
      return '💳';
    default:
      return '⚪';
  }
}

function formatReason(reason: string): string {
  return reason.replace(/([A-Z])/g, ' $1').trim();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US');
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E0F7FA',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  reason: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#000',
  },
  date: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#999',
  },
  payment: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#F44336',
  },
  refund: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#4CAF50',
  },
});
