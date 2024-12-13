import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ animation: 'none' }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HabitDetailsScreen"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
