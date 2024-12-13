import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/useColorScheme';
import SpaceMonoFont from '../assets/fonts/SpaceMono-Regular.ttf';
import { CustomSplash } from '@/components/CustomSplash';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: SpaceMonoFont,
  });

  useEffect(() => {
    console.log('Splash state:', { loaded, splashAnimationComplete });
  }, [loaded, splashAnimationComplete]);

  if (!loaded || !splashAnimationComplete) {
    return (
      <CustomSplash 
        onAnimationComplete={() => {
          console.log('Animation complete');
          setSplashAnimationComplete(true);
        }} 
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
              animation: 'none'
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
