import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform, Animated, Easing } from 'react-native';
import { Compass } from 'lucide-react-native';
import { Magnetometer } from 'expo-sensors';
import type { Coordinates } from '../types';
import { KAABA_COORDINATES } from '../constants/methods';
import { t } from '../lib/i18n';

interface QiblaIndicatorProps {
  coordinates: Coordinates;
}

/**
 * Calculates the Qibla direction (angle from North) in degrees
 */
function calculateQiblaAngle(coordinates: Coordinates): number {
  const lat1 = (coordinates.latitude * Math.PI) / 180;
  const lon1 = (coordinates.longitude * Math.PI) / 180;
  const lat2 = (KAABA_COORDINATES.latitude * Math.PI) / 180;
  const lon2 = (KAABA_COORDINATES.longitude * Math.PI) / 180;

  const dLon = lon2 - lon1;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let angle = (Math.atan2(y, x) * 180) / Math.PI;
  angle = (angle + 360) % 360; // Normalize to 0-360

  return Math.round(angle);
}

/**
 * Converts angle to cardinal direction
 */
function angleToDirection(angle: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(angle / 22.5) % 16;
  return directions[index];
}

export function QiblaIndicator({ coordinates }: QiblaIndicatorProps) {
  const qiblaAngle = calculateQiblaAngle(coordinates);
  const direction = angleToDirection(qiblaAngle);

  const [magnetometer, setMagnetometer] = useState(0);
  const [isCompassAvailable, setIsCompassAvailable] = useState(false);

  // Use standard Animated API
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Manual rotation for Web Dev
  const handleManualRotate = (dir: 'left' | 'right') => {
    setMagnetometer((prev) => {
      const delta = dir === 'left' ? -15 : 15;
      let newHeading = prev + delta;
      if (newHeading < 0) newHeading += 360;
      if (newHeading >= 360) newHeading -= 360;
      return newHeading;
    });
  };

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setupCompass = async () => {
      if (Platform.OS === 'web') return;

      const available = await Magnetometer.isAvailableAsync();
      setIsCompassAvailable(available);

      if (available) {
        Magnetometer.setUpdateInterval(100);
        subscription = Magnetometer.addListener((data) => {
          let { x, y } = data;
          let heading = Math.atan2(y, x) * (180 / Math.PI);

          heading = heading - 90;
          if (heading < 0) heading += 360;

          setMagnetometer(heading);
        });
      }
    };

    setupCompass();

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    // Target Rotation = Qibla Angle - Device Heading
    let targetRotation = qiblaAngle - magnetometer;

    // Animate to new rotation
    Animated.timing(rotateAnim, {
      toValue: targetRotation,
      duration: 100,
      useNativeDriver: Platform.OS !== 'web',
      easing: Easing.linear,
    }).start();
  }, [magnetometer, qiblaAngle]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = {
    transform: [{ rotate: rotateInterpolate }],
  };

  // Enable animation on web for testing manual controls
  const isNativeCompass = (Platform.OS !== 'web' && isCompassAvailable) || Platform.OS === 'web';
  // But for the Text label "Web: Static...", we might want to keep it if manual controls aren't used? 
  // Let's just treat web as "Mock Native" now.

  return (
    <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
      <View className="flex-row items-center justify-center mb-2">
        <View className="relative items-center justify-center">
          <Animated.View style={isNativeCompass ? animatedStyle : { transform: [{ rotate: `${qiblaAngle}deg` }] }}>
            <Compass size={48} color="#3b82f6" />
          </Animated.View>
        </View>

        <View className="ml-4">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-semibold">
            {t('qiblaDirection')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-2xl font-bold">
            {qiblaAngle}° {direction}
          </Text>
        </View>
      </View>

      <Text className="text-gray-500 dark:text-gray-500 text-center text-xs mt-1">
        {isNativeCompass
          ? t('alignPhone')
          : t('webStaticAngle')}
      </Text>

      {/* Web Development Controls */}
      {Platform.OS === 'web' && (
        <View className="flex-row justify-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Text
            onPress={() => handleManualRotate('left')}
            className="text-blue-500 px-3 py-1 bg-blue-50 dark:bg-blue-900 rounded mr-2 overflow-hidden text-xs font-bold"
          >
            ← Turn Left
          </Text>
          <Text
            onPress={() => handleManualRotate('right')}
            className="text-blue-500 px-3 py-1 bg-blue-50 dark:bg-blue-900 rounded ml-2 overflow-hidden text-xs font-bold"
          >
            Turn Right →
          </Text>
        </View>
      )}
    </View>
  );
}
