import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#666666',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            position: 'absolute',
            borderTopWidth: 0.5,
            borderTopColor: '#E5E5E5',
          },
          default: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0.5,
            borderTopColor: '#E5E5E5',
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="circle.grid.2x2" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar" color={color} />,
        }}
      />
    </Tabs>
  );
}
