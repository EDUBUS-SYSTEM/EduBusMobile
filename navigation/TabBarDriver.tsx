import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabBarDriver() {
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
        name="dashboard"
        options={{
          title: 'Dashboard',
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
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="map" 
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="person" 
              size={24} 
              color={focused ? '#01CBCA' : color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
