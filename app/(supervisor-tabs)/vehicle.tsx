import {
  DriverVehicleStatus,
  DriverVehicleStatusLabels,
  VehicleStatus,
  VehicleStatusLabels,
  type VehicleData
} from '@/lib/driverVehicle/driverVehicle.types';
import { getMySupervisorVehicle } from '@/lib/supervisor/supervisorVehicle.api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function SupervisorVehicleScreen() {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadVehicleData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await getMySupervisorVehicle();

      if (response.success && response.data) {
        setVehicleData(response.data);
      } else {
        // Don't show alert on initial load if no vehicle, just show empty state
        if (showRefreshIndicator) {
          Alert.alert('No Vehicle Assigned', response.message || 'You have no vehicle assigned.');
        }
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      Alert.alert('Error', 'Failed to load vehicle data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatAssignmentDate = (date?: string | null) => {
    if (!date) return '--';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '--';
    }
  };

  useEffect(() => {
    loadVehicleData();
  }, []);

  const onRefresh = () => {
    loadVehicleData(true);
  };

  // Convert VehicleStatus enum (from API) to display text
  const getVehicleStatusText = (status: VehicleStatus): string => {
    return VehicleStatusLabels[status] || 'Unknown';
  };

  // Convert DriverVehicleStatus enum (from API) to display text
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAssignmentStatusText = (status: DriverVehicleStatus): string => {
    return DriverVehicleStatusLabels[status] || 'Unknown';
  };

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.Active:
        return '#4CAF50';
      case VehicleStatus.Maintenance:
        return '#FF9800';
      case VehicleStatus.Inactive:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.Active:
        return 'checkmark-circle';
      case VehicleStatus.Maintenance:
        return 'construct';
      case VehicleStatus.Inactive:
        return 'close-circle';
      default:
        return 'help-circle';
    }
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
          Loading vehicle information...
        </Text>
      </View>
    );
  }

  if (!vehicleData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Ionicons name="car-outline" size={64} color="#999" />
        <Text style={{
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 18,
          color: '#333',
          marginTop: 16,
          textAlign: 'center'
        }}>
          No Vehicle Assigned
        </Text>
        <Text style={{
          fontFamily: 'RobotoSlab-Regular',
          fontSize: 14,
          color: '#666',
          marginTop: 8,
          textAlign: 'center'
        }}>
          You don&apos;t have a vehicle assigned yet. Please contact your administrator.
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: '#01CBCA',
            borderRadius: 8
          }}
        >
          <Text style={{ color: '#FFF', fontFamily: 'RobotoSlab-Bold' }}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}>
        {/* Top Row - Back Button and Title */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 20,
              color: '#000000',
              marginBottom: 2
            }}>
              Vehicle
            </Text>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 14,
              color: 'rgba(0, 0, 0, 0.7)'
            }}>
              Supervisor Vehicle View
            </Text>
          </View>
        </View>

        {/* Vehicle Info Card */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: '#FFD700',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16
          }}>
            <Ionicons name="car" size={36} color="#000000" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 24,
              color: '#000000',
              marginBottom: 4
            }}>
              {vehicleData.licensePlate}
            </Text>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 18,
              color: 'rgba(0, 0, 0, 0.7)'
            }}>
              {vehicleData.capacity}-Seater Bus
            </Text>
          </View>
        </View>
      </LinearGradient>

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


        {/* Assignment Period */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 18,
            color: '#000000',
            marginBottom: 16
          }}>
            Assignment Period
          </Text>
          <View style={{
            backgroundColor: '#FFF9E6',
            borderRadius: 16,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#FFD700'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FFD700',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons name="calendar-outline" size={20} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 4
                }}>
                  Start Date
                </Text>
                <Text style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 16,
                  color: '#000000'
                }}>
                  {formatAssignmentDate(vehicleData.assignmentStartTime)}
                </Text>
              </View>
            </View>

            {vehicleData.assignmentEndTime && (
              <>
                <View style={{
                  height: 1,
                  backgroundColor: '#FFE082',
                  marginVertical: 12
                }} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#FFE082',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Ionicons name="calendar-outline" size={20} color="#000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily: 'RobotoSlab-Regular',
                      fontSize: 12,
                      color: '#666',
                      marginBottom: 4
                    }}>
                      End Date
                    </Text>
                    <Text style={{
                      fontFamily: 'RobotoSlab-Bold',
                      fontSize: 16,
                      color: '#000000'
                    }}>
                      {formatAssignmentDate(vehicleData.assignmentEndTime)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons - Adapted for Supervisor */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 18,
            color: '#000000',
            marginBottom: 16
          }}>
            Features
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <TouchableOpacity
              onPress={() => Alert.alert('Info', 'Student list is available in Trip Details')}
              style={{
                flex: 1,
                backgroundColor: '#E3F2FD',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                minWidth: '30%'
              }}
            >
              <Ionicons name="people" size={24} color="#2196F3" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#2196F3',
                marginTop: 8,
                textAlign: 'center'
              }}>
                Students
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Info', 'Statistics feature coming soon')}
              style={{
                flex: 1,
                backgroundColor: '#E8F5E8',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                minWidth: '30%'
              }}
            >
              <Ionicons name="bar-chart" size={24} color="#4CAF50" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#4CAF50',
                marginTop: 8,
                textAlign: 'center'
              }}>
                Statistics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Info', 'Route feature coming soon')}
              style={{
                flex: 1,
                backgroundColor: '#FCE4EC',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                minWidth: '30%'
              }}
            >
              <Ionicons name="map" size={24} color="#E91E63" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#E91E63',
                marginTop: 8,
                textAlign: 'center'
              }}>
                Route
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Info', 'Maintenance feature coming soon')}
              style={{
                flex: 1,
                backgroundColor: '#FFF3E0',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                minWidth: '30%'
              }}
            >
              <Ionicons name="construct" size={24} color="#FF9800" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#FF9800',
                marginTop: 8,
                textAlign: 'center'
              }}>
                Maintenance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(supervisor-tabs)/trip/trip-schedule' as any)}
              style={{
                flex: 1,
                backgroundColor: '#F3E5F5',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                minWidth: '30%'
              }}
            >
              <Ionicons name="calendar" size={24} color="#9C27B0" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#9C27B0',
                marginTop: 8,
                textAlign: 'center'
              }}>
                Schedule
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 18,
            color: '#000000',
            marginBottom: 16
          }}>
            Vehicle Details
          </Text>

          {/* License Plate Card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderLeftWidth: 4,
            borderLeftColor: '#2196F3'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#E3F2FD',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons name="card-outline" size={24} color="#2196F3" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 4
                }}>
                  License Plate
                </Text>
                <Text style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 18,
                  color: '#000000',
                  letterSpacing: 1
                }}>
                  {vehicleData.licensePlate}
                </Text>
              </View>
            </View>
          </View>

          {/* Capacity Card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderLeftWidth: 4,
            borderLeftColor: '#4CAF50'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#E8F5E8',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons name="people-outline" size={24} color="#4CAF50" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 4
                }}>
                  Seating Capacity
                </Text>
                <Text style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 18,
                  color: '#000000'
                }}>
                  {vehicleData.capacity} seats
                </Text>
              </View>
            </View>
          </View>

          {/* Status Card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: vehicleData.statusNote ? 12 : 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderLeftWidth: 4,
            borderLeftColor: getStatusColor(vehicleData.status)
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: `${getStatusColor(vehicleData.status)}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons
                  name={getStatusIcon(vehicleData.status)}
                  size={24}
                  color={getStatusColor(vehicleData.status)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 4
                }}>
                  Vehicle Status
                </Text>
                <Text style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 18,
                  color: getStatusColor(vehicleData.status)
                }}>
                  {getVehicleStatusText(vehicleData.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Status Note Card (if exists) */}
          {vehicleData.statusNote && (
            <View style={{
              backgroundColor: '#FFF3E0',
              borderRadius: 16,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#FF9800'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#FFE0B2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="information-circle-outline" size={24} color="#FF9800" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'RobotoSlab-Regular',
                    fontSize: 12,
                    color: '#666',
                    marginBottom: 4
                  }}>
                    Status Note
                  </Text>
                  <Text style={{
                    fontFamily: 'RobotoSlab-Medium',
                    fontSize: 14,
                    color: '#000000',
                    lineHeight: 20
                  }}>
                    {vehicleData.statusNote}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
