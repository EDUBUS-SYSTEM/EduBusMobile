import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SupervisorTripDetailScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'RobotoSlab-Bold',
              fontSize: 20,
              color: '#000000',
            }}>
              Trip Details
            </Text>
            <Text style={{
              fontFamily: 'RobotoSlab-Regular',
              fontSize: 14,
              color: 'rgba(0, 0, 0, 0.7)',
            }}>
              Trip ID: {tripId}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{
          backgroundColor: '#F8F9FA',
          borderRadius: 15,
          padding: 20,
          marginBottom: 20,
        }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 18,
            color: '#000000',
            marginBottom: 16,
          }}>
            Trip Information
          </Text>
          <Text style={{
            fontFamily: 'RobotoSlab-Regular',
            fontSize: 14,
            color: '#666666',
            marginBottom: 8,
          }}>
            This is a placeholder for trip details. Connect to API to display actual trip information.
          </Text>
        </View>

        <View style={{
          backgroundColor: '#E0F7FA',
          borderRadius: 15,
          padding: 20,
          alignItems: 'center',
        }}>
          <Ionicons name="information-circle-outline" size={48} color="#01CBCA" />
          <Text style={{
            fontFamily: 'RobotoSlab-Medium',
            fontSize: 16,
            color: '#000000',
            marginTop: 12,
            textAlign: 'center',
          }}>
            Trip details will be displayed here
          </Text>
          <Text style={{
            fontFamily: 'RobotoSlab-Regular',
            fontSize: 14,
            color: '#666666',
            marginTop: 8,
            textAlign: 'center',
          }}>
            Connect to backend API to fetch trip information
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

