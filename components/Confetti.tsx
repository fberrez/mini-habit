import React, { useEffect } from 'react';
import { StyleSheet, Animated, Easing, View } from 'react-native';

interface ConfettiPieceProps {
  x: number;
  y: number;
  color: string;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ x, y, color }) => {
  const position = new Animated.ValueXY({ x: 0, y: 0 });
  const opacity = new Animated.Value(1);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(position, {
        toValue: { 
          x: (Math.random() * 100 - 50), 
          y: (Math.random() * 100 - 50) 
        },
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          position: 'absolute',
          left: x - 3,
          top: y - 3,
          backgroundColor: color,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate: `${Math.random() * 360}deg` },
          ],
          opacity,
        },
      ]}
    />
  );
};

interface ConfettiProps {
  count?: number;
  x: number;
  y: number;
}

const Confetti: React.FC<ConfettiProps> = ({ count = 20, x, y }) => {
  const colors = ['#000000', '#666666', '#333333', '#999999'];
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <ConfettiPiece
          key={i}
          x={x}
          y={y}
          color={colors[Math.floor(Math.random() * colors.length)]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  confetti: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default Confetti; 