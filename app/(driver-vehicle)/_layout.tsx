import { Stack } from 'expo-router';

export default function DriverVehicleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFD700',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 18,
        },
        contentStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Vehicle',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="students"
        options={{
          title: 'Students',
          presentation: 'card'
        }}
      />
    </Stack>
  );
}
