import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/lib/auth/auth.api';
import { childrenApi } from '@/lib/parent/children.api';
import { apiService } from '@/lib/api';
import { API_CONFIG } from '@/constants/ApiConfig';
import type { Child } from '@/lib/parent/children.type';

interface StudentBriefDto {
  id: string;
  firstName: string;
  lastName: string;
}

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

export default function StudentSelectionScreen() {
  const [students, setStudents] = useState<StudentBriefDto[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [parentEmail, setParentEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        // Get students by parent ID
        const childrenData = await childrenApi.getChildrenByParent(userInfo.userId);
        
        // Convert to StudentBriefDto format
        const studentsData: StudentBriefDto[] = childrenData.map((child: Child) => ({
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
        }));

        if (studentsData.length === 0) {
          setError('No students found for your account. Please contact the school.');
        } else {
          setStudents(studentsData);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(
          err.response?.data?.message || err.message || 'Failed to load student data. Please try again.'
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

  const handleContinue = () => {
    if (selectedStudents.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one student to continue.');
      return;
    }

    // Store selected students and parent email for next screen
    AsyncStorage.setItem('selectedStudents', JSON.stringify(selectedStudents));
    AsyncStorage.setItem('parentEmail', parentEmail);

    // Navigate to map screen
    router.push('/service-registration/map');
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FDC700" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#000000' }}>Loading students...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <LinearGradient
        colors={['#FEFCE8', '#FFF085']}
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
            Select Students
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
              Select Students for Registration
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 8 }}>
              Email: <Text style={{ fontFamily: 'RobotoSlab-Bold', color: '#D08700' }}>{parentEmail}</Text>
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
              Please select the students you want to register for transportation service
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

          {/* Students List */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 18,
                color: '#000000',
                marginBottom: 15,
                textAlign: 'center',
              }}>
              Student List ({students.length})
            </Text>

            {students.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666666', fontSize: 16 }}>No students found</Text>
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
                        justifyContent: 'space-between',
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
                          <Text style={{ fontSize: 12, color: '#666666', marginTop: 4 }}>
                            ID: {student.id}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          backgroundColor: isSelected ? '#FDC700' : '#F5F5F5',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                        }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: isSelected ? '#FFFFFF' : '#666666',
                            fontFamily: 'RobotoSlab-Medium',
                          }}>
                          {isSelected ? 'Selected' : 'Not Selected'}
                        </Text>
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
                student(s)
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={selectedStudents.length === 0}
              style={{
                backgroundColor: selectedStudents.length === 0 ? '#CCCCCC' : '#FDC700',
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
                  color: selectedStudents.length === 0 ? '#666666' : '#000000',
                }}>
                {selectedStudents.length === 0
                  ? 'Select at least 1 student'
                  : `Continue with ${selectedStudents.length} student(s)`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
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
              <Text style={{ fontSize: 14, color: '#1565C0' }}>
                • Tap on each student to select/deselect
              </Text>
              <Text style={{ fontSize: 14, color: '#1565C0' }}>
                • You can select one or multiple students
              </Text>
              <Text style={{ fontSize: 14, color: '#1565C0' }}>
                • Must select at least 1 student to continue
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}


