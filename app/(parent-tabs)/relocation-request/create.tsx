import LocationPicker from '@/components/parent/LocationPicker';
import { useChildrenList } from '@/hooks/useChildren';
import { relocationRequestApi } from '@/lib/parent/relocationRequest.api';
import type { CreateRelocationRequestDto, RelocationReason, RefundCalculationResult } from '@/lib/parent/relocationRequest.type';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Step = 1 | 2 | 3 | 4;

interface StudentForSelection {
  id: string;
  firstName: string;
  lastName: string;
}

export default function CreateRelocationRequestScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Use the children hook
  const { children: apiChildren, loading: childrenLoading } = useChildrenList();
  const students: StudentForSelection[] = apiChildren.map(child => ({
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
  }));

  // Form data
  const [selectedStudent, setSelectedStudent] = useState<StudentForSelection | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [newLatitude, setNewLatitude] = useState(0);
  const [newLongitude, setNewLongitude] = useState(0);
  const [newDistanceKm, setNewDistanceKm] = useState(0);
  const [reason, setReason] = useState<RelocationReason>('FamilyRelocation');
  const [description, setDescription] = useState('');
  const [urgentRequest, setUrgentRequest] = useState(false);
  const [requestedEffectiveDate, setRequestedEffectiveDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refundPreview, setRefundPreview] = useState<RefundCalculationResult | null>(null);

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!selectedStudent) {
        Alert.alert('Required', 'Please select a student');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!newAddress || newDistanceKm === 0) {
        Alert.alert('Required', 'Please enter new location details');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!reason || !description.trim()) {
        Alert.alert('Required', 'Please fill in all required fields');
        return;
      }
      // Load refund preview
      await loadRefundPreview();
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    } else {
      router.back();
    }
  };

  const loadRefundPreview = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      const preview = await relocationRequestApi.calculateRefund(
        selectedStudent.id,
        newDistanceKm
      );
      setRefundPreview(preview);
    } catch (error: any) {
      console.error('Failed to load refund preview:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);

      // Extract error message from backend response
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to calculate refund preview. Please try again.';

      console.error('Displaying error to user:', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent) return;

    const requestData: CreateRelocationRequestDto = {
      studentId: selectedStudent.id,
      newPickupPointAddress: newAddress,
      newLatitude,
      newLongitude,
      newDistanceKm,
      reason,
      description,
      evidenceUrls: [],
      urgentRequest,
      requestedEffectiveDate: requestedEffectiveDate.toISOString(),
    };

    try {
      setLoading(true);
      await relocationRequestApi.createRequest(requestData);
      Alert.alert(
        'Success',
        'Your relocation request has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/relocation-requests' as any),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create request:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Relocation Request</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.stepText}>Step {currentStep} of 4</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {currentStep === 1 && (
          <Step1SelectStudent
            students={students}
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
            loading={childrenLoading}
          />
        )}

        {currentStep === 2 && (
          <Step2NewLocation
            newAddress={newAddress}
            setNewAddress={setNewAddress}
            newDistanceKm={newDistanceKm}
            setNewDistanceKm={setNewDistanceKm}
            setNewLatitude={setNewLatitude}
            setNewLongitude={setNewLongitude}
          />
        )}

        {currentStep === 3 && (
          <Step3ReasonDetails
            reason={reason}
            setReason={setReason}
            description={description}
            setDescription={setDescription}
            urgentRequest={urgentRequest}
            setUrgentRequest={setUrgentRequest}
            requestedEffectiveDate={requestedEffectiveDate}
            setRequestedEffectiveDate={setRequestedEffectiveDate}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
          />
        )}

        {currentStep === 4 && (
          <Step4ReviewSubmit
            selectedStudent={selectedStudent}
            newAddress={newAddress}
            newDistanceKm={newDistanceKm}
            reason={reason}
            description={description}
            urgentRequest={urgentRequest}
            requestedEffectiveDate={requestedEffectiveDate}
            refundPreview={refundPreview}
            loading={loading}
          />
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        {currentStep < 4 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={loading}>
            <Text style={styles.nextBtnText}>Next Step →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Step 1: Select Student
function Step1SelectStudent({
  students,
  selectedStudent,
  onSelectStudent,
  loading,
}: {
  students: StudentForSelection[];
  selectedStudent: StudentForSelection | null;
  onSelectStudent: (student: StudentForSelection) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#01CBCA" />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.stepTitle}>Which student needs relocation?</Text>
      {students.map((student) => (
        <TouchableOpacity
          key={student.id}
          style={[
            styles.studentCard,
            selectedStudent?.id === student.id && styles.studentCardSelected,
          ]}
          onPress={() => onSelectStudent(student)}
        >
          <View style={styles.studentInfo}>
            <Ionicons
              name={selectedStudent?.id === student.id ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color="#01CBCA"
            />
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>
                {student.firstName} {student.lastName}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Step 2: New Location
function Step2NewLocation({
  newAddress,
  setNewAddress,
  newDistanceKm,
  setNewDistanceKm,
  setNewLatitude,
  setNewLongitude,
}: {
  newAddress: string;
  setNewAddress: (value: string) => void;
  newDistanceKm: number;
  setNewDistanceKm: (value: number) => void;
  setNewLatitude: (value: number) => void;
  setNewLongitude: (value: number) => void;
}) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  return (
    <View>
      <Text style={styles.stepTitle}>Select New Location</Text>

      {newAddress ? (
        <View style={styles.selectedLocationCard}>
          <View style={styles.selectedLocationHeader}>
            <Ionicons name="location" size={24} color="#01CBCA" />
            <Text style={styles.selectedLocationTitle}>Selected Location</Text>
          </View>

          <Text style={styles.selectedLocationAddress}>{newAddress}</Text>

          <View style={styles.selectedLocationMeta}>
            <Ionicons name="navigate" size={16} color="#666" />
            <Text style={styles.selectedLocationDistance}>
              {newDistanceKm.toFixed(2)} km from school
            </Text>
          </View>

          <TouchableOpacity
            style={styles.changeLocationButton}
            onPress={() => setShowLocationPicker(true)}
          >
            <Ionicons name="pencil" size={16} color="#01CBCA" />
            <Text style={styles.changeLocationText}>Change Location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.selectLocationButton}
          onPress={() => setShowLocationPicker(true)}
        >
          <Ionicons name="map" size={24} color="#FFF" />
          <Text style={styles.selectLocationText}>Select Location on Map</Text>
        </TouchableOpacity>
      )}

      {showLocationPicker && (
        <LocationPicker
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSelected={(data) => {
            setNewAddress(data.address);
            setNewLatitude(data.latitude);
            setNewLongitude(data.longitude);
            setNewDistanceKm(data.distanceKm);
          }}
        />
      )}
    </View>
  );
}

// Step 3: Reason & Details
function Step3ReasonDetails({
  reason,
  setReason,
  description,
  setDescription,
  urgentRequest,
  setUrgentRequest,
  requestedEffectiveDate,
  setRequestedEffectiveDate,
  showDatePicker,
  setShowDatePicker,
}: {
  reason: RelocationReason;
  setReason: (value: RelocationReason) => void;
  description: string;
  setDescription: (value: string) => void;
  urgentRequest: boolean;
  setUrgentRequest: (value: boolean) => void;
  requestedEffectiveDate: Date;
  setRequestedEffectiveDate: (value: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (value: boolean) => void;
}) {
  const reasons: { value: RelocationReason; label: string }[] = [
    { value: 'FamilyRelocation', label: 'Family Relocation' },
    { value: 'Medical', label: 'Medical' },
    { value: 'Safety', label: 'Safety' },
    { value: 'FamilyEmergency', label: 'Family Emergency' },
    { value: 'ServiceQuality', label: 'Service Quality' },
    { value: 'Financial', label: 'Financial' },
    { value: 'Convenience', label: 'Convenience' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <View>
      <Text style={styles.stepTitle}>Reason & Details</Text>

      <Text style={styles.label}>Reason for relocation *</Text>
      <View style={styles.pickerContainer}>
        {reasons.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[
              styles.reasonChip,
              reason === r.value && styles.reasonChipSelected,
            ]}
            onPress={() => setReason(r.value)}
          >
            <Text
              style={[
                styles.reasonChipText,
                reason === r.value && styles.reasonChipTextSelected,
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Please explain your reason for relocation..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setUrgentRequest(!urgentRequest)}
      >
        <Ionicons
          name={urgentRequest ? 'checkbox' : 'square-outline'}
          size={24}
          color="#01CBCA"
        />
        <Text style={styles.checkboxLabel}>This is urgent</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Requested effective date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar" size={20} color="#01CBCA" />
        <Text style={styles.dateButtonText}>
          {requestedEffectiveDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={requestedEffectiveDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) setRequestedEffectiveDate(date);
          }}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

// Step 4: Review & Submit
function Step4ReviewSubmit({
  selectedStudent,
  newAddress,
  newDistanceKm,
  reason,
  description,
  urgentRequest,
  requestedEffectiveDate,
  refundPreview,
  loading,
}: {
  selectedStudent: StudentForSelection | null;
  newAddress: string;
  newDistanceKm: number;
  reason: string;
  description: string;
  urgentRequest: boolean;
  requestedEffectiveDate: Date;
  refundPreview: RefundCalculationResult | null;
  loading: boolean;
}) {
  if (loading || !refundPreview) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#01CBCA" />
        <Text style={styles.loadingText}>Calculating financial impact...</Text>
      </View>
    );
  }

  const isRefund = refundPreview.netRefund > 0;
  const isAdditional = refundPreview.additionalPaymentRequired > 0;

  return (
    <View>
      <Text style={styles.stepTitle}>Review & Submit</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>💰 Financial Impact</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Original Payment:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(refundPreview.originalPayment)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Days Remaining:</Text>
          <Text style={styles.summaryValue}>
            {refundPreview.daysRemaining} / {refundPreview.totalSchoolDays} days
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Value Remaining:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(refundPreview.valueRemaining)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>New Location Cost:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(refundPreview.newLocationCost)}</Text>
        </View>

        {refundPreview.processingFee > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Processing Fee:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(refundPreview.processingFee)}</Text>
          </View>
        )}

        <View style={[styles.divider, styles.thickDivider]} />

        {isRefund && (
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Refund Amount:</Text>
            <Text style={[styles.totalValue, styles.refundText]}>
              {formatCurrency(refundPreview.netRefund)}
            </Text>
          </View>
        )}

        {isAdditional && (
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Additional Payment:</Text>
            <Text style={[styles.totalValue, styles.additionalText]}>
              {formatCurrency(refundPreview.additionalPaymentRequired)}
            </Text>
          </View>
        )}
      </View>

      {isAdditional && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            You will need to pay an additional {formatCurrency(refundPreview.additionalPaymentRequired)} VND
          </Text>
        </View>
      )}

      {isRefund && (
        <View style={styles.infoBox}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            You will receive a refund of {formatCurrency(refundPreview.netRefund)} VND
          </Text>
        </View>
      )}
    </View>
  );
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  stepText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#01CBCA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#000',
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  studentCard: {
    backgroundColor: '#E0F7FA',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  studentCardSelected: {
    borderColor: '#01CBCA',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000',
  },
  label: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  reasonChipSelected: {
    backgroundColor: '#01CBCA',
    borderColor: '#01CBCA',
  },
  reasonChipText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#666',
  },
  reasonChipTextSelected: {
    color: '#FFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkboxLabel: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dateButtonText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#E0F7FA',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#000',
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
  totalLabel: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 15,
    color: '#000',
  },
  totalValue: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 15,
    color: '#000',
  },
  refundText: {
    color: '#4CAF50',
  },
  additionalText: {
    color: '#F44336',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  backBtnText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#666',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#01CBCA',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  nextBtnText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#FFF',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitBtnText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#FFF',
  },
  selectedLocationCard: {
    backgroundColor: '#E0F7FA',
    borderRadius: 15,
    padding: 16,
    marginTop: 8,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedLocationTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  selectedLocationAddress: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  selectedLocationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedLocationDistance: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#01CBCA',
  },
  changeLocationText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#01CBCA',
    marginLeft: 6,
  },
  selectLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#01CBCA',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  selectLocationText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#FFF',
    marginLeft: 8,
  },
});
