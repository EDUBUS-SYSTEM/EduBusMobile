import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabBarParent() {
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
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="home" 
              size={24} 
              color={focused ? '#01CBCA' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="people" 
              size={24} 
              color={focused ? '#01CBCA' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="children-list"
        options={{
          title: 'Children List',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="people-circle" 
              size={24} 
              color={focused ? '#01CBCA' : color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="wallet" 
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
      <Tabs.Screen
        name="payment-detail"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="student/profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="payment-notification"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="trips/today"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="trip/[tripId]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
