import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabBarDriver() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: '#687076',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFF3E0',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'RobotoSlab-Medium',
        },
      }}>
      <Tabs.Screen
        name="route"
        options={{
          title: 'Route',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="map" 
              size={24} 
              color={focused ? '#FF9800' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="passengers"
        options={{
          title: 'Passengers',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="people" 
              size={24} 
              color={focused ? '#FF9800' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'Status',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color={focused ? '#FF9800' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="person" 
              size={24} 
              color={focused ? '#FF9800' : color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
