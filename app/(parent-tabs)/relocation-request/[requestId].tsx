import { relocationRequestApi } from '@/lib/parent/relocationRequest.api';
import type { RelocationRequest } from '@/lib/parent/relocationRequest.type';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RelocationRequestDetailScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [request, setRequest] = useState<RelocationRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const data = await relocationRequestApi.getRequestById(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Failed to load request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#01CBCA" />
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Request not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.requestStatus) }]}>
            <Text style={styles.statusText}>{request.requestStatus}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Submitted on {formatDate(request.submittedAt)}
          </Text>
        </View>

        {/* Student Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📚 Student Information</Text>
          <InfoRow label="Student" value={request.studentName} />
          <InfoRow label="Semester" value={`${request.semesterName} (${request.academicYear})`} />
          <InfoRow label="School Days" value={`${request.totalSchoolDays} days`} />
        </View>

        {/* Location Change Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Location Change</Text>
          <View style={styles.locationSection}>
            <Text style={styles.locationLabel}>Old Location:</Text>
            <Text style={styles.locationText}>{request.oldPickupPointAddress}</Text>
            <Text style={styles.distanceText}>{request.oldDistanceKm.toFixed(1)} km from school</Text>
          </View>
          <View style={styles.arrow}>
            <Ionicons name="arrow-down" size={24} color="#01CBCA" />
          </View>
          <View style={styles.locationSection}>
            <Text style={styles.locationLabel}>New Location:</Text>
            <Text style={styles.locationText}>{request.newPickupPointAddress}</Text>
            <Text style={styles.distanceText}>{request.newDistanceKm.toFixed(1)} km from school</Text>
          </View>
        </View>

        {/* Financial Impact Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Financial Impact</Text>
          <InfoRow label="Original Payment" value={formatCurrency(request.originalPaymentAmount)} />
          <InfoRow label="Days Serviced" value={`${request.daysServiced} days`} />
          <InfoRow label="Days Remaining" value={`${request.daysRemaining} days`} />
          <InfoRow label="Value Remaining" value={formatCurrency(request.valueRemaining)} />
          <View style={styles.divider} />
          <InfoRow label="New Location Cost" value={formatCurrency(request.newLocationCost)} />
          {request.processingFee > 0 && (
            <InfoRow label="Processing Fee" value={formatCurrency(request.processingFee)} />
          )}
          <View style={[styles.divider, styles.thickDivider]} />
          {request.refundAmount > 0 && (
            <InfoRow
              label="Refund Amount"
              value={formatCurrency(request.refundAmount)}
              valueStyle={styles.refundText}
            />
          )}
          {request.additionalPaymentRequired > 0 && (
            <InfoRow
              label="Additional Payment"
              value={formatCurrency(request.additionalPaymentRequired)}
              valueStyle={styles.paymentText}
            />
          )}
        </View>

        {/* Request Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Request Details</Text>
          <InfoRow label="Reason" value={formatReason(request.reason)} />
          <View style={styles.descriptionSection}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </View>
          {request.urgentRequest && (
            <View style={styles.urgentBadge}>
              <Ionicons name="warning" size={16} color="#F44336" />
              <Text style={styles.urgentText}>Urgent Request</Text>
            </View>
          )}
          <InfoRow label="Requested Effective Date" value={formatDate(request.requestedEffectiveDate)} />
        </View>

        {/* AI Recommendation Card */}
        {request.aiRecommendation && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🤖 AI Recommendation</Text>
            <View style={[styles.recommendationBadge, { backgroundColor: getRecommendationColor(request.aiRecommendation.recommendation) }]}>
              <Text style={styles.recommendationText}>{request.aiRecommendation.recommendation}</Text>
            </View>
            <InfoRow label="Confidence" value={request.aiRecommendation.confidence} />
            <InfoRow label="Score" value={`${request.aiRecommendation.score}/100`} />
            <Text style={styles.summaryText}>{request.aiRecommendation.summary}</Text>
            {request.aiRecommendation.reasons.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>Reasons:</Text>
                {request.aiRecommendation.reasons.map((reason, index) => (
                  <Text key={index} style={styles.listItem}>• {reason}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Admin Response Card */}
        {request.reviewedAt && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👨‍💼 Admin Response</Text>
            <InfoRow label="Reviewed At" value={formatDate(request.reviewedAt)} />
            {request.adminNotes && (
              <View style={styles.descriptionSection}>
                <Text style={styles.infoLabel}>Admin Notes:</Text>
                <Text style={styles.descriptionText}>{request.adminNotes}</Text>
              </View>
            )}
            {request.rejectionReason && (
              <View style={styles.descriptionSection}>
                <Text style={styles.infoLabel}>Rejection Reason:</Text>
                <Text style={[styles.descriptionText, styles.rejectionText]}>{request.rejectionReason}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
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

function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case 'APPROVE':
      return '#C8E6C9';
    case 'REJECT':
      return '#FFCDD2';
    case 'REVIEW':
      return '#FFF9C4';
    default:
      return '#E0E0E0';
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
  return `${amount.toLocaleString('en-US')} VND`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFF9C4',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 16,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#E0F7FA',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  locationSection: {
    marginBottom: 8,
  },
  locationLabel: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  locationText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#333',
  },
  distanceText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#CCC',
    marginVertical: 8,
  },
  thickDivider: {
    height: 2,
    backgroundColor: '#999',
  },
  refundText: {
    color: '#4CAF50',
    fontFamily: 'RobotoSlab-Bold',
  },
  paymentText: {
    color: '#F44336',
    fontFamily: 'RobotoSlab-Bold',
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  urgentText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
  },
  recommendationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  recommendationText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#000',
  },
  summaryText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontStyle: 'italic',
  },
  listSection: {
    marginTop: 12,
  },
  listTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  listItem: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    marginBottom: 2,
  },
  rejectionText: {
    color: '#F44336',
  },
});
