import { API_CONFIG } from '@/constants/ApiConfig';
import { apiService } from '@/lib/api';
import { authApi } from '@/lib/auth/auth.api';
import { childrenApi } from '@/lib/parent/children.api';
import type { Child } from '@/lib/parent/children.type';
import {
  pickupPointApi,
  REUSE_PICKUP_POINT_STORAGE_KEY,
  type ParentRegistrationEligibilityDto,
  type ParentRegistrationSemesterDto,
  type ReusePickupPointPayload,
  type StudentBriefDto,
  type StudentCurrentPickupPointDto,
} from '@/lib/parent/pickupPoint.api';
import { formatDate } from '@/utils/date.utils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

function isWithinRegistrationWindow(semester?: ParentRegistrationSemesterDto | null) {
  if (!semester?.registrationStartDate || !semester?.registrationEndDate) {
    return false;
  }

  const start = new Date(semester.registrationStartDate);
  const end = new Date(semester.registrationEndDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const now = new Date();
  return now >= start && now <= end;
}

function getCommonPickupPoint(selectedDetails: StudentBriefDto[]): StudentCurrentPickupPointDto | null {
  if (selectedDetails.length === 0) {
    return null;
  }

  const firstPickup = selectedDetails[0].currentPickupPoint;
  if (
    !firstPickup ||
    typeof firstPickup.latitude !== 'number' ||
    typeof firstPickup.longitude !== 'number'
  ) {
    return null;
  }

  const areAllSharingSamePickup = selectedDetails.every((student) => {
    const pickup = student.currentPickupPoint;
    return (
      pickup &&
      typeof pickup.latitude === 'number' &&
      typeof pickup.longitude === 'number' &&
      pickup.pickupPointId === firstPickup.pickupPointId
    );
  });

  return areAllSharingSamePickup ? firstPickup : null;
}

export default function StudentSelectionScreen() {
  const [students, setStudents] = useState<StudentBriefDto[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [parentEmail, setParentEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibilityInfo, setEligibilityInfo] = useState<ParentRegistrationEligibilityDto | null>(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [blockedCount, setBlockedCount] = useState(0);
  const [isRegistrationWindowActive, setIsRegistrationWindowActive] = useState(true);
  const registrationWindowLabel =
    eligibilityInfo?.semester?.registrationStartDate && eligibilityInfo?.semester?.registrationEndDate
      ? `${formatDate(eligibilityInfo.semester.registrationStartDate)} - ${formatDate(eligibilityInfo.semester.registrationEndDate)}`
      : '';
  const registrationClosedMessage =
    'Registration for the upcoming semester is not open yet. Please return to the home screen.';

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get user info
        const userInfo = await authApi.getUserInfo();
        if (!userInfo.userId) {
          setError('Unable to get user information. Please login again.');
          setLoading(false);
          return;
        }

        // Get parent email from JWT token first (faster, no API call needed)
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          setError('Session expired. Please login again.');
          setLoading(false);
          return;
        }

        const payload: any = decodeJwtPayload(token);
        
        // Try to get email from JWT token claims
        // JWT includes ClaimTypes.Email which maps to different claim names
        let email = payload?.email || 
                   payload?.Email ||
                   payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
                   payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email'] ||
                   '';

        // If email not in JWT, try to get from API
        if (!email) {
          const userId: string | undefined =
            payload?.nameid ||
            payload?.sub ||
            payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
          
          if (userId) {
            try {
              // Use correct endpoint: /api/UserAccount/{userId}
              const userProfile = await apiService.get<any>(`${API_CONFIG.ENDPOINTS.USER.PROFILE}/${userId}`);
              email = userProfile?.Email || userProfile?.email || '';
            } catch (apiError: any) {
              console.warn('Could not get email from API, trying JWT token:', apiError);
              // Continue - will show error if email still empty
            }
          }
        }
        
        if (!email) {
          setError('Unable to get email address. Please login again or contact support.');
          setLoading(false);
          return;
        }

        setParentEmail(email);

        // Get children by parent ID
        const childrenData = await childrenApi.getChildrenByParent(userInfo.userId);
        
        // Convert to StudentBriefDto format
        const studentsData: StudentBriefDto[] = childrenData.map((child: Child) => ({
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          hasCurrentPickupPoint: false,
          currentPickupPoint: null,
        }));

        if (studentsData.length === 0) {
          setError('No children found for your account. Please contact the school.');
          setStudents([]);
          return;
        }

        let filteredStudents: StudentBriefDto[] = studentsData;
        let message = '';
        let hiddenCount = 0;

        try {
          const eligibilityResponse = await pickupPointApi.getRegistrationEligibility();
          setEligibilityInfo(eligibilityResponse);
          const windowActive = isWithinRegistrationWindow(eligibilityResponse.semester);
          setIsRegistrationWindowActive(windowActive);

          if (!windowActive) {
            filteredStudents = [];
            hiddenCount = 0;
            message = registrationClosedMessage;
          } else if (eligibilityResponse.eligibleStudents && eligibilityResponse.eligibleStudents.length >= 0) {
            filteredStudents =
              eligibilityResponse.eligibleStudents.length > 0 ? eligibilityResponse.eligibleStudents : [];
            hiddenCount = eligibilityResponse.blockedStudents?.length || 0;
            message = eligibilityResponse.message || '';
          }
        } catch (eligibilityError) {
          console.warn('Could not load registration eligibility:', eligibilityError);
          setIsRegistrationWindowActive(false);
          filteredStudents = [];
          hiddenCount = 0;
          if (!message) {
            message = registrationClosedMessage;
          }
        }

        setBlockedCount(hiddenCount);
        if (message) {
          setInfoMessage(message);
        } else {
          setInfoMessage('');
        }

        if (filteredStudents.length === 0 && hiddenCount > 0 && !message) {
          setInfoMessage('All of your children have already been registered for the upcoming semester.');
        }

        setStudents(filteredStudents);
        setSelectedStudents((prev) => prev.filter((id) => filteredStudents.some((student) => student.id === id)));
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(
          err.response?.data?.message || err.message || 'Failed to load children data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
    if (error) setError('');
  };

  const continueToMap = async (studentIds: string[], reusePayload?: ReusePickupPointPayload) => {
    try {
      await AsyncStorage.setItem('selectedStudents', JSON.stringify(studentIds));
      await AsyncStorage.setItem('parentEmail', parentEmail);

      if (reusePayload) {
        await AsyncStorage.setItem(
          REUSE_PICKUP_POINT_STORAGE_KEY,
          JSON.stringify(reusePayload)
        );
      } else {
        await AsyncStorage.removeItem(REUSE_PICKUP_POINT_STORAGE_KEY);
      }

      router.push('/service-registration/map');
    } catch (storageError) {
      console.error('Error persisting selection:', storageError);
      Alert.alert('Error', 'Unable to save the registration information. Please try again.');
    }
  };

  const handleContinue = async () => {
    if (students.length === 0) {
      Alert.alert('No eligible children', 'All of your children have already been registered for the upcoming semester.');
      return;
    }
    if (selectedStudents.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one child to continue.');
      return;
    }

    if (!parentEmail) {
      Alert.alert('Error', 'Parent email not found. Please sign in again.');
      return;
    }

    const selectedIdsSnapshot = [...selectedStudents];
    const selectedDetails = students.filter((student) => selectedIdsSnapshot.includes(student.id));
    const reuseCandidate = getCommonPickupPoint(selectedDetails);

    if (!reuseCandidate) {
      await continueToMap(selectedIdsSnapshot);
      return;
    }

    const reusePayload: ReusePickupPointPayload = {
      latitude: reuseCandidate.latitude as number,
      longitude: reuseCandidate.longitude as number,
      addressText:
        reuseCandidate.description?.trim() || reuseCandidate.location?.trim() || 'Current pickup point',
      pickupPointId: reuseCandidate.pickupPointId,
      studentIds: selectedIdsSnapshot,
    };

    Alert.alert(
      'Reuse current pickup point?',
      'We found an existing pickup point for the selected children. Do you want to reuse this location for the new registration?',
      [
        {
          text: 'Choose a new location',
          style: 'cancel',
          onPress: () => {
            void continueToMap(selectedIdsSnapshot);
          },
        },
        {
          text: 'Reuse current location',
          onPress: () => {
            void continueToMap(selectedIdsSnapshot, reusePayload);
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.replace('/(parent-tabs)/home');
  };
  const isContinueDisabled = !isRegistrationWindowActive || selectedStudents.length === 0 || students.length === 0;
  const continueButtonLabel = !isRegistrationWindowActive
    ? 'Registration not open'
    : students.length === 0
    ? 'No eligible children'
    : selectedStudents.length === 0
    ? 'Select at least 1 child'
    : `Continue with ${selectedStudents.length} children`;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FDC700" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#000000' }}>Loading children...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={handleGoBack} style={{ padding: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'RobotoSlab-Bold', fontSize: 20, color: '#000000' }}>
              Service Registration
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: '#FEFCE8',
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
          }}>
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 22,
                color: '#000000',
                marginBottom: 10,
                textAlign: 'center',
              }}>
              Select Children for Registration
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 8 }}>
              Email: <Text style={{ fontFamily: 'RobotoSlab-Bold', color: '#D08700' }}>{parentEmail}</Text>
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
              Please select the children you want to register for transportation service
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={{
                backgroundColor: '#FFEBEE',
                borderColor: '#EF5350',
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
              }}>
              <Text style={{ color: '#C62828', fontSize: 14, textAlign: 'center' }}>{error}</Text>
            </View>
          )}

          {/* Info Message */}
          {infoMessage ? (
            <View
              style={{
                backgroundColor: '#E8F5E9',
                borderColor: '#66BB6A',
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
              }}>
              <Text style={{ color: '#2E7D32', fontSize: 14, textAlign: 'center' }}>{infoMessage}</Text>
            </View>
          ) : null}

          {/* Children List */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 18,
                color: '#000000',
                marginBottom: 15,
                textAlign: 'center',
              }}>
              Your Children ({students.length})
            </Text>

            {blockedCount > 0 && students.length > 0 && (
              <View
                style={{
                  backgroundColor: '#FFF3E0',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#FFB74D',
                }}>
                <Text style={{ color: '#E65100', fontSize: 13, textAlign: 'center' }}>
                  {blockedCount} children are hidden because they are already registered for the upcoming semester.
                </Text>
              </View>
            )}

            {students.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center', gap: 16 }}>
                <Text style={{ color: '#666666', fontSize: 16, textAlign: 'center' }}>
                  {infoMessage || 'No eligible children available for registration at this time.'}
                </Text>
                <TouchableOpacity
                  onPress={handleGoHome}
                  style={{
                    backgroundColor: '#FDC700',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 20,
                  }}>
                  <Text style={{ fontFamily: 'RobotoSlab-Bold', color: '#000000' }}>Go back to Home</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {students.map((student, index) => {
                  const isSelected = selectedStudents.includes(student.id);
                  return (
                    <TouchableOpacity
                      key={student.id}
                      onPress={() => handleStudentToggle(student.id)}
                      style={{
                        backgroundColor: isSelected ? '#FEFCE8' : '#FFFFFF',
                        borderRadius: 15,
                        padding: 16,
                        borderWidth: 2,
                        borderColor: isSelected ? '#FDC700' : '#E0E0E0',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: isSelected ? '#FDC700' : '#BDBDBD',
                            backgroundColor: isSelected ? '#FDC700' : '#FFFFFF',
                            marginRight: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: 'RobotoSlab-Bold',
                              fontSize: 16,
                              color: '#000000',
                            }}>
                            {student.firstName} {student.lastName}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Selection Summary */}
          {selectedStudents.length > 0 && (
            <View
              style={{
                backgroundColor: '#FEFCE8',
                borderRadius: 15,
                padding: 16,
                borderWidth: 1,
                borderColor: '#FDC700',
                marginBottom: 20,
              }}>
              <Text
                style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 16,
                  color: '#000000',
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                Selection Summary
              </Text>
              <Text style={{ fontSize: 14, color: '#000000', textAlign: 'center' }}>
                You have selected{' '}
                <Text style={{ fontFamily: 'RobotoSlab-Bold', color: '#D08700' }}>
                  {selectedStudents.length}
                </Text>{' '}
                children
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            {students.length === 0 && (
              <Text style={{ textAlign: 'center', color: '#666666', fontSize: 13 }}>
                {isRegistrationWindowActive
                  ? 'Registration will reopen once the school enables the next semester.'
                  : registrationClosedMessage}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                void handleContinue();
              }}
              disabled={isContinueDisabled}
              style={{
                backgroundColor: isContinueDisabled ? '#CCCCCC' : '#FDC700',
                borderRadius: 15,
                padding: 16,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
              <Text
                style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 16,
                  color: isContinueDisabled ? '#666666' : '#000000',
                }}>
                {continueButtonLabel}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          {isRegistrationWindowActive && (
            <View
              style={{
                backgroundColor: '#E3F2FD',
                borderRadius: 15,
                padding: 16,
                marginTop: 20,
              }}>
              <Text
                style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 16,
                  color: '#1565C0',
                  textAlign: 'center',
                  marginBottom: 12,
                }}>
                💡 Instructions
              </Text>
              <View style={{ gap: 8 }}>
                {eligibilityInfo?.semester && (
                  <Text style={{ fontSize: 14, color: '#1565C0' }}>
                    Upcoming semester: {eligibilityInfo.semester.name} ({eligibilityInfo.semester.academicYear})
                  </Text>
                )}
                {registrationWindowLabel ? (
                  <Text style={{ fontSize: 14, color: '#1565C0' }}>
                    Registration window: {registrationWindowLabel}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 14, color: '#1565C0' }}>
                  • Tap on each child to select/deselect
                </Text>
                <Text style={{ fontSize: 14, color: '#1565C0' }}>
                  • You can select one or multiple children
                </Text>
                <Text style={{ fontSize: 14, color: '#1565C0' }}>
                  • Must select at least 1 child to continue
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}


