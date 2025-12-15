import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabBarSupervisor() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#01CBCA',
        tabBarInactiveTintColor: '#687076',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFF9C4',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 75,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'RobotoSlab-Medium',
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="speedometer" 
              size={24} 
              color={focused ? '#01CBCA' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trip-schedule"
        options={{
          title: 'Schedule',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="calendar" 
              size={24} 
              color={focused ? '#01CBCA' : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicle"
        options={{
          title: 'Vehicle',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="car" 
              size={24} 
              color={focused ? '#01CBCA' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="person" 
              size={24} 
              color={focused ? '#01CBCA' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          // Keep route accessible but hide from bottom tabs; moved to dashboard quick actions
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          href: null, 
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="trips-today"
        options={{
          href: null, // Hidden; opened via dashboard quick action
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="trip/[tripId]"
        options={{
          href: null, // Hide from tab bar
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

