import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { leaveApi } from '@/lib/driver/leave.api';
import { CreateLeaveRequest, LeaveType, getLeaveTypeName, getLeaveTypeIcon } from '@/lib/driver/leave.type';

export default function LeaveRequestFormScreen() {
  const [leaveType, setLeaveType] = useState<LeaveType | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [autoReplacementEnabled, setAutoReplacementEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Show leave type picker modal
  const [showLeaveTypePicker, setShowLeaveTypePicker] = useState(false);

  const leaveTypes = [
    { type: LeaveType.Annual, label: getLeaveTypeName(LeaveType.Annual), icon: getLeaveTypeIcon(LeaveType.Annual) },
    { type: LeaveType.Sick, label: getLeaveTypeName(LeaveType.Sick), icon: getLeaveTypeIcon(LeaveType.Sick) },
    { type: LeaveType.Personal, label: getLeaveTypeName(LeaveType.Personal), icon: getLeaveTypeIcon(LeaveType.Personal) },
    { type: LeaveType.Emergency, label: getLeaveTypeName(LeaveType.Emergency), icon: getLeaveTypeIcon(LeaveType.Emergency) },
    { type: LeaveType.Training, label: getLeaveTypeName(LeaveType.Training), icon: getLeaveTypeIcon(LeaveType.Training) },
    { type: LeaveType.Other, label: getLeaveTypeName(LeaveType.Other), icon: getLeaveTypeIcon(LeaveType.Other) }
  ];

  const validateForm = (): string | null => {
    if (!leaveType) {
      return 'Please select a leave type';
    }
    if (!reason.trim()) {
      return 'Please provide a reason for your leave';
    }
    if (reason.length > 500) {
      return 'Reason cannot exceed 500 characters';
    }
    if (endDate < startDate) {
      return 'End date must be after or equal to start date';
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const request: CreateLeaveRequest = {
        leaveType: leaveType!,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: reason.trim(),
        autoReplacementEnabled,
        additionalInformation: additionalInfo.trim() || undefined
      };

      await leaveApi.createLeaveRequest(request);
      
      Alert.alert(
        'Success',
        'Your leave request has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(driver-leave)?refresh=true')
          }
        ]
      );
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      
      // Extract error message and status code
      const statusCode = error?.response?.status;
      const errorData = error?.response?.data;
      const errorMessage = errorData?.message || error?.message || 'Failed to submit leave request. Please try again.';
      const errorType = errorData?.errorType;
      
      // Handle different error types
      if (statusCode === 409 && errorType === 'OverlappingLeaveRequest') {
        // Show detailed error for overlapping leave requests
        Alert.alert(
          'Leave Request Conflict',
          errorMessage,
          [
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else if (statusCode === 400 && errorType === 'ValidationError') {
        // Show validation error
        Alert.alert(
          'Validation Error',
          errorMessage
        );
      } else {
        // Show generic error for other cases
        Alert.alert(
          'Error',
          errorMessage
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
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
            New Leave Request
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Leave Type */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 16,
            color: '#000000',
            marginBottom: 8
          }}>
            Leave Type *
          </Text>
          <TouchableOpacity
            onPress={() => setShowLeaveTypePicker(!showLeaveTypePicker)}
            style={{
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: leaveType ? '#01CBCA' : '#E0E0E0',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {leaveType ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={getLeaveTypeIcon(leaveType) as any} size={20} color="#01CBCA" />
                <Text style={{
                  fontFamily: 'RobotoSlab-Medium',
                  fontSize: 15,
                  color: '#000000',
                  marginLeft: 10
                }}>
                  {getLeaveTypeName(leaveType)}
                </Text>
              </View>
            ) : (
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 15,
                color: '#999'
              }}>
                Select leave type
              </Text>
            )}
            <Ionicons
              name={showLeaveTypePicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          {/* Leave Type Options */}
          {showLeaveTypePicker && (
            <View style={{
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#E0E0E0'
            }}>
              {leaveTypes.map((item, index) => (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => {
                    setLeaveType(item.type);
                    setShowLeaveTypePicker(false);
                  }}
                  style={{
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: index < leaveTypes.length - 1 ? 1 : 0,
                    borderBottomColor: '#E0E0E0'
                  }}
                >
                  <Ionicons name={item.icon as any} size={20} color="#01CBCA" />
                  <Text style={{
                    fontFamily: 'RobotoSlab-Medium',
                    fontSize: 15,
                    color: '#000000',
                    marginLeft: 12,
                    flex: 1
                  }}>
                    {item.label}
                  </Text>
                  {leaveType === item.type && (
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Start Date */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 16,
            color: '#000000',
            marginBottom: 8
          }}>
            Start Date *
          </Text>
          <TouchableOpacity
            onPress={() => setShowStartDatePicker(true)}
            style={{
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E0E0E0',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={20} color="#01CBCA" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 15,
                color: '#000000',
                marginLeft: 10
              }}>
                {formatDate(startDate)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                  if (endDate < selectedDate) {
                    setEndDate(selectedDate);
                  }
                }
              }}
            />
          )}
        </View>

        {/* End Date */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 16,
            color: '#000000',
            marginBottom: 8
          }}>
            End Date *
          </Text>
          <TouchableOpacity
            onPress={() => setShowEndDatePicker(true)}
            style={{
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E0E0E0',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={20} color="#01CBCA" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 15,
                color: '#000000',
                marginLeft: 10
              }}>
                {formatDate(endDate)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Reason */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 16,
              color: '#000000'
            }}>
              Reason *
            </Text>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 12,
              color: reason.length > 500 ? '#F44336' : '#666'
            }}>
              {reason.length}/500
            </Text>
          </View>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Please provide a reason for your leave..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={500}
            style={{
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: reason.length > 500 ? '#F44336' : '#E0E0E0',
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 15,
              color: '#000000',
              minHeight: 100,
              textAlignVertical: 'top'
            }}
          />
        </View>

        {/* Auto Replacement */}
        <View style={{
          backgroundColor: '#E0F7FA',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 16,
              color: '#000000',
              marginBottom: 4
            }}>
              Auto-replacement
            </Text>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 12,
              color: '#666'
            }}>
              System will suggest a replacement driver automatically
            </Text>
          </View>
          <Switch
            value={autoReplacementEnabled}
            onValueChange={setAutoReplacementEnabled}
            trackColor={{ false: '#E0E0E0', true: '#01CBCA' }}
            thumbColor={autoReplacementEnabled ? '#FFFFFF' : '#F8F9FA'}
          />
        </View>

        {/* Additional Information */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 16,
            color: '#000000',
            marginBottom: 8
          }}>
            Additional Information (Optional)
          </Text>
          <TextInput
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            placeholder="Any additional details..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            maxLength={1000}
            style={{
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E0E0E0',
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 15,
              color: '#000000',
              minHeight: 80,
              textAlignVertical: 'top'
            }}
          />
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 40 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isSubmitting}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#01CBCA'
            }}
          >
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 16,
              color: '#01CBCA'
            }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              flex: 1,
              backgroundColor: isSubmitting ? '#CCCCCC' : '#01CBCA',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 16,
                  color: '#FFFFFF',
                  marginLeft: 8
                }}>
                  Submitting...
                </Text>
              </>
            ) : (
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 16,
                color: '#FFFFFF'
              }}>
                Submit Request
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

