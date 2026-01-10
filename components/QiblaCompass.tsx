import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform, Image, StyleSheet, Dimensions } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    cancelAnimation
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import geomagnetism from 'geomagnetism';
import { KAABA_COORDINATES } from '../constants/methods';
import { t } from '../lib/i18n';
import type { Coordinates } from '../types';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;

interface QiblaCompassProps {
    location: Coordinates;
}

// Low-pass filter alpha (0-1). Lower = smoother but more lag.
const ALPHA = 0.15;

export function QiblaCompass({ location }: QiblaCompassProps) {
    const [subscription, setSubscription] = useState<any>(null);
    const [declination, setDeclination] = useState(0);
    const [qiblaAngle, setQiblaAngle] = useState(0);
    const [isCalibrated, setIsCalibrated] = useState(false); // Basic check

    // Shared Values for Reanimated
    const rotation = useSharedValue(0);

    // Smooth filter state
    const smoothingVectors = useRef({ x: 0, y: 1 }); // Start North

    useEffect(() => {
        // 1. Calculate Qibla Angle (True North)
        const angle = calculateQiblaAngle(location);
        setQiblaAngle(angle);

        // 2. Calculate Magnetic Declination
        try {
            // geomagnetism library usage might vary by version, verify if possible.
            // Assuming standard API: model.point([lat, lon]) -> { decl: number }
            const model = geomagnetism.model();
            const info = model.point([location.latitude, location.longitude]);
            setDeclination(info.decl || 0);
        } catch (e) {
            console.warn('Geomagnetism error', e);
            setDeclination(0);
        }
    }, [location]);

    useEffect(() => {
        _subscribe();
        return () => _unsubscribe();
    }, []);

    const _subscribe = () => {
        if (Platform.OS === 'web') return;

        Magnetometer.setUpdateInterval(40); // 25fps

        const sub = Magnetometer.addListener((data) => {
            // Calculate Raw Magnetic Heading
            let heading = 0;
            if (data) {
                let { x, y } = data;
                // Adjust for screen orientation if needed, but assuming portrait for MVP
                heading = -Math.atan2(y, x) * (180 / Math.PI);
            }

            // Normalize 0-360
            if (heading < 0) heading += 360;

            // Apply Low-Pass Filter on vectors to handle 360-0 wrap
            const rad = heading * (Math.PI / 180);
            const x = Math.cos(rad);
            const y = Math.sin(rad);

            smoothingVectors.current.x = smoothingVectors.current.x * (1 - ALPHA) + x * ALPHA;
            smoothingVectors.current.y = smoothingVectors.current.y * (1 - ALPHA) + y * ALPHA;

            const smoothRad = Math.atan2(smoothingVectors.current.y, smoothingVectors.current.x);
            let smoothHeading = smoothRad * (180 / Math.PI);
            if (smoothHeading < 0) smoothHeading += 360;

            // Convert to True North: True = Magnetic + Declination
            // Note: If Declination is positive (East), we add it.
            let trueHeading = smoothHeading + declination;

            // Update Shared Value
            // We want to rotate the Compass Dial so that North points to... North?
            // Usually mobile compasses rotate the "Dial" against the phone's top.
            // If phone points North (0 deg), Dial should be 0.
            // If phone points East (90 deg), Dial should rotate -90 deg so 'N' is on left.
            // So, rotation = -trueHeading

            rotation.value = -trueHeading;
        });

        setSubscription(sub);
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    const animatedDialStyle = useAnimatedStyle(() => {
        // Determine shortest path for rotation to avoid spinning 360
        // But since we stream continuous values, standard rotation is usually fine given the LPF 
        // However, wrap around 0/360 can cause spin. 
        // For a simple compass dial, continuous rotation is tricky.
        // We'll stick to direct mapping for now as LPF handles vectors.
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    return (
        <View className="flex-1 items-center justify-center bg-gray-900">
            <View className="relative items-center justify-center" style={{ width: COMPASS_SIZE, height: COMPASS_SIZE }}>

                {/* Dial (Rotates to keep N pointing North) */}
                <Animated.View style={[styles.dial, animatedDialStyle]}>
                    {/* Compass Background Image or SVG */}
                    <View style={styles.compassFace}>
                        <Text style={[styles.cardinal, styles.north]}>N</Text>
                        <Text style={[styles.cardinal, styles.east]}>E</Text>
                        <Text style={[styles.cardinal, styles.south]}>S</Text>
                        <Text style={[styles.cardinal, styles.west]}>W</Text>

                        {/* Ticks */}
                        {[...Array(12)].map((_, i) => (
                            <View key={i} style={[styles.tick, { transform: [{ rotate: `${i * 30}deg` }] }]} />
                        ))}

                        {/* Qibla Marker on the Dial */}
                        <View style={[styles.qiblaMarkerContainer, { transform: [{ rotate: `${qiblaAngle}deg` }] }]}>
                            <View style={styles.qiblaLine} />
                            <View style={styles.kaabaIcon}>
                                <Text style={{ fontSize: 24 }}>🕋</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Fixed Pointer (Phone Heading) - Optional, usually a line at top */}
                <View style={styles.fixedPointer} />

            </View>

            <View className="mt-10 items-center">
                <Text className="text-white text-3xl font-bold">{Math.round(-rotation.value > 0 ? 360 - rotation.value : -rotation.value)}°</Text>
                <Text className="text-gray-400 text-base">Qibla: {qiblaAngle}°</Text>
                <Text className="text-gray-500 text-xs mt-2">Declination: {declination.toFixed(1)}°</Text>
                {Platform.OS === 'web' && <Text className="text-yellow-500 mt-4">Compass not supported on Web</Text>}
            </View>
        </View>
    );
}

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
    angle = (angle + 360) % 360;

    return Math.round(angle);
}

const styles = StyleSheet.create({
    dial: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    compassFace: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
        borderWidth: 4,
        borderColor: '#374151',
        backgroundColor: '#1f2937',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardinal: {
        position: 'absolute',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#9ca3af',
    },
    north: { top: 10, color: '#ef4444' },
    south: { bottom: 10 },
    east: { right: 15 },
    west: { left: 15 },
    tick: {
        position: 'absolute',
        width: 2,
        top: 5,
        left: '50%',
        marginLeft: -1,
        height: 10,
        backgroundColor: '#4b5563',
    },
    qiblaMarkerContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        zIndex: 10,
    },
    qiblaLine: {
        width: 2,
        height: '50%',
        backgroundColor: 'gold',
    },
    kaabaIcon: {
        position: 'absolute',
        top: 40,
    },
    fixedPointer: {
        position: 'absolute',
        top: -20,
        width: 4,
        height: 30,
        backgroundColor: 'white',
        zIndex: 20,
        borderRadius: 2,
    }
});
