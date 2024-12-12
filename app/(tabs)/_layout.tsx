import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none'
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Habits',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Stats',
        }}
      />
    </Tabs>
  );
}
