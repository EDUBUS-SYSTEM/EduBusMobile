import { Stack } from 'expo-router';

export default function LeaveLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Leave Requests'
        }} 
      />
      <Stack.Screen 
        name="new" 
        options={{ 
          title: 'New Request',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Request Details'
        }} 
      />
    </Stack>
  );
}

