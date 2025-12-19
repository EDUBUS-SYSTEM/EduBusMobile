import { StudentAvatar } from '@/components/StudentAvatar';
import { getMyVehicleStudents } from '@/lib/driverVehicle/driverVehicle.api';
import type { VehicleStudentInfo, VehicleStudentsData } from '@/lib/driverVehicle/driverVehicle.types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function VehicleStudentsScreen() {
  const [vehicleData, setVehicleData] = useState<VehicleStudentsData | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<VehicleStudentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStudents = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await getMyVehicleStudents();

      if (response.success && response.data) {
        setVehicleData(response.data);
      } else {
        Alert.alert('No Students', response.message || 'No students found on your vehicle.');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, vehicleData]);

  const filterStudents = () => {
    if (!vehicleData) {
      setFilteredStudents([]);
      return;
    }

    let filtered = vehicleData.students;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.gradeLevel && student.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredStudents(filtered);
  };

  const onRefresh = () => {
    loadStudents(true);
  };


  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#01CBCA" />
        <Text style={{
          fontFamily: 'RobotoSlab-Medium',
          fontSize: 14,
          color: '#666',
          marginTop: 16
        }}>
          Loading students...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#01CBCA']}
            tintColor="#01CBCA"
          />
        }
      >
        {/* Search */}
        <View style={{ marginBottom: 20 }}>
          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16
          }}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 12,
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 14,
                color: '#000000'
              }}
              placeholder="Search students..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>


        {filteredStudents.length === 0 ? (
          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 12,
            padding: 40,
            alignItems: 'center'
          }}>
            <Ionicons name="people-outline" size={48} color="#999" />
            <Text style={{
              fontFamily: 'RobotoSlab-Medium',
              fontSize: 16,
              color: '#666',
              marginTop: 16,
              textAlign: 'center'
            }}>
              No students found
            </Text>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 14,
              color: '#999',
              marginTop: 8,
              textAlign: 'center'
            }}>
              {searchQuery ? 'Try adjusting your search' : 'No students assigned to this vehicle'}
            </Text>
          </View>
        ) : (
          filteredStudents.map((student, index) => (
            <View
              key={student.studentId}
              style={{
                backgroundColor: '#E3F2FD',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#BBDEFB',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
              }}
            >
              {/* Student Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                  <StudentAvatar
                    studentId={student.studentId}
                    studentName={`${student.firstName} ${student.lastName}`}
                    size={60}
                    showBorder={false}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily: 'RobotoSlab-Bold',
                      fontSize: 18,
                      color: '#000000',
                      marginBottom: 4
                    }}>
                      {student.firstName} {student.lastName}
                    </Text>
                    {student.gradeLevel && (
                      <View style={{
                        backgroundColor: '#4CAF5020',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        alignSelf: 'flex-start'
                      }}>
                        <Text style={{
                          fontFamily: 'RobotoSlab-Medium',
                          fontSize: 12,
                          color: '#4CAF50'
                        }}>
                          {student.gradeLevel}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{
                  backgroundColor: '#01CBCA',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{
                    fontFamily: 'RobotoSlab-Bold',
                    fontSize: 16,
                    color: '#FFFFFF'
                  }}>
                    {student.pickupSequenceOrder}
                  </Text>
                </View>
              </View>

              {/* Pickup Location */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="location" size={18} color="#01CBCA" />
                  <Text style={{
                    fontFamily: 'RobotoSlab-Medium',
                    fontSize: 14,
                    color: '#01CBCA',
                    marginLeft: 8
                  }}>
                    Pickup Location
                  </Text>
                </View>
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 14,
                  color: '#000000',
                  marginLeft: 26,
                  lineHeight: 20
                }}>
                  {student.pickupPointAddress}
                </Text>
              </View>

              {/* Parent Contact */}
              {student.parentName && (
                <View style={{
                  backgroundColor: '#F8F9FA',
                  borderRadius: 10,
                  padding: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: '#01CBCA'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="person" size={16} color="#666" />
                    <Text style={{
                      fontFamily: 'RobotoSlab-Medium',
                      fontSize: 12,
                      color: '#666',
                      marginLeft: 8
                    }}>
                      Parent Contact
                    </Text>
                  </View>
                  <Text style={{
                    fontFamily: 'RobotoSlab-Medium',
                    fontSize: 14,
                    color: '#000000',
                    marginBottom: 4
                  }}>
                    {student.parentName}
                  </Text>
                  {student.parentPhone && (
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="call" size={14} color="#01CBCA" />
                      <Text style={{
                        fontFamily: 'RobotoSlab-Regular',
                        fontSize: 14,
                        color: '#01CBCA',
                        marginLeft: 6
                      }}>
                        {student.parentPhone}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
