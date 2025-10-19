import React from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import the vehicle component directly
import VehicleOverviewScreen from '../(driver-vehicle)/index';

export default function VehicleScreen() {
  return <VehicleOverviewScreen />;
}
