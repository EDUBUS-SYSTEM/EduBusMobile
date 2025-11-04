import { Stack } from 'expo-router';

export default function ServiceRegistrationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="student-selection" />
      <Stack.Screen name="map" />
    </Stack>
  );
}


