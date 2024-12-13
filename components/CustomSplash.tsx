import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { ThemedText } from './ThemedText';

interface CustomSplashProps {
  onAnimationComplete?: () => void;
}

export function CustomSplash({ onAnimationComplete }: CustomSplashProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.sequence([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(1000),
      // Fade out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start(() => {
      onAnimationComplete?.();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ThemedText style={styles.title}>minihabits.</ThemedText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 40,
    paddingVertical: 8,
  },
}); 