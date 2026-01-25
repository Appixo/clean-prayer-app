import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, Dimensions, Image, useColorScheme } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing,
    interpolateColor,
    useAnimatedReaction,
    runOnJS,
    type SharedValue
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { getRhumbLineBearing } from 'geolib';
import { MapPin, X, Info } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { logger } from '../lib/logger';
import { CustomAlert } from './CustomAlert';

interface PremiumQiblaCompassProps {
    location: { latitude: number; longitude: number; city: string | null };
}

const KAABA_COORDS = { latitude: 21.422487, longitude: 39.826206 };
const { width, height } = Dimensions.get('window');
// Responsive compass size - smaller on phones, larger on tablets
const COMPASS_SIZE = Math.min(width * 0.8, height * 0.5, 400);

// Sub-component to handle text updates without re-rendering the whole compass or triggering warnings
const CompassDegreeText = ({ rotation, style }: { rotation: SharedValue<number>, style: any }) => {
    const [text, setText] = useState("0°");

    useAnimatedReaction(
        () => {
            const val = rotation.value;
            // Calculate degrees 0-360
            const degrees = Math.round(-val % 360 + (val > 0 ? 0 : 360));
            return degrees;
        },
        (degrees, prev) => {
            if (degrees !== prev) {
                runOnJS(setText)(`${degrees}°`);
            }
        },
        [rotation]
    );

    return (
        <Animated.Text style={style}>
            {text}
        </Animated.Text>
    );
};

export function PremiumQiblaCompass({ location: userLocation }: PremiumQiblaCompassProps) {
    const [subscription, setSubscription] = useState<any>(null);
    const [magnetometerAvailability, setMagnetometerAvailability] = useState<boolean | null>(null);
    const [qiblaBearing, setQiblaBearing] = useState(0);
    const [isAligned, setIsAligned] = useState(false);
    const [calibModalVisible, setCalibModalVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ visible: false, title: '', buttons: [] });

    // Animated Values
    const rotation = useSharedValue(0);
    const alignedColor = useSharedValue(0); // 0 = Blue, 1 = Emerald

    // Calculate Qibla Bearing on mount or location change
    useEffect(() => {
        if (userLocation) {
            const bearing = getRhumbLineBearing(
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                KAABA_COORDS
            );
            setQiblaBearing(bearing);
        }
    }, [userLocation]);

    // Sensor Setup
    useEffect(() => {
        const setupCompass = async () => {
            const isAvailable = await Magnetometer.isAvailableAsync();
            setMagnetometerAvailability(isAvailable);

            if (!isAvailable) {
                setAlertConfig({
                    visible: true,
                    title: "Senör Hatası",
                    message: "Cihazınızda pusula sensörü bulunamadı.",
                    buttons: [{ text: "Tamam" }]
                });
                return;
            }

            // Low latency for smooth UI
            Magnetometer.setUpdateInterval(50);

            const sub = Magnetometer.addListener((data) => {
                const { x, y } = data;
                let angle = Math.atan2(y, x) * (180 / Math.PI);
                angle = angle - 90; // Rotate 90 degrees to align with 0=North
                if (angle < 0) angle += 360; // Normalize 0-360

                // Use location heading if available for True North correction (approximate logic here due to complex declination APIs)
                // For now we assume magnetic north ~ true north or rely on user calibration.
                // In a pro app, we'd use declination tables.

                // Damping / Low Pass Filter implemented via Reanimated withSpring/Timing below
                // We pass the raw angle to the shared value, but handle the 360->0 wrap-around

                // Smart Rotation logic to prevent spinning 360 degrees when crossing North
                let newRotation = -angle; // Compass rotates opposite to phone
                const currentRot = rotation.value;

                // Normalize difference to -180 to 180
                let diff = newRotation - currentRot;
                while (diff <= -180) diff += 360;
                while (diff > 180) diff -= 360;

                rotation.value = withSpring(currentRot + diff, {
                    damping: 20,
                    stiffness: 90,
                });

                // Alignment Check (Qibla Bearing relative to North)
                // Compass rotates so North matches 0.
                // Qibla is at `qiblaBearing`.
                // The phone is pointing at `angle` (Magnetic North).
                // We are aligned if Phone Heading (angle) == Qibla Bearing.

                const bearingDiff = Math.abs(angle - qiblaBearing);
                const isAlignedNow = bearingDiff < 3 || Math.abs(bearingDiff - 360) < 3;

                if (isAlignedNow && !isAligned) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setIsAligned(true);
                    alignedColor.value = withTiming(1, { duration: 300 });
                } else if (!isAlignedNow && isAligned) {
                    setIsAligned(false);
                    alignedColor.value = withTiming(0, { duration: 300 });
                }
            });

            setSubscription(sub);
        };

        setupCompass();

        return () => {
            subscription?.remove();
        };
    }, [qiblaBearing, isAligned]); // Re-bind if qibla changes? No, listener captures state closures carefully or uses refs. 
    // Actually listener uses qiblaBearing from closure. If it changes, we might need to update ref or dep.
    // Better to use ref for qiblaBearing inside listener or re-sub. 
    // Given user location rarely changes instantly, lets leave it simple or add qiblaBearing to dep array which remounts listener.

    const animatedCompassStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const animatedBorderColors = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            alignedColor.value,
            [0, 1],
            ['#2563EB', '#10b981'] // Blue-600 -> Emerald-500 (when aligned)
        );
        return { borderColor: borderColor, borderWidth: isAligned ? 4 : 2 };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            alignedColor.value,
            [0, 1],
            ['#2563EB', '#10b981'] // Blue-600 -> Emerald-500
        );
        return { color };
    });

    const animatedBackgroundStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            alignedColor.value,
            [0, 1],
            ['transparent', 'transparent'] // Keep transparent, let parent handle background
        );
        return { backgroundColor };
    });

    const openMap = () => {
        // Apple Maps / Google Maps URL scheme
        // Shows direction from current location to Kaaba
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${KAABA_COORDS.latitude},${KAABA_COORDS.longitude}`;
        const label = 'Kabe (Kıble)';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `geo:${latLng}?q=${latLng}(${label})`
        });

        if (url) Linking.openURL(url);
    };

    return (
        <View className="items-center justify-center flex-1">

            {/* Compass Container */}
            <Animated.View
                style={[{ width: COMPASS_SIZE, height: COMPASS_SIZE, borderRadius: COMPASS_SIZE / 2 }, animatedBorderColors]}
                className="items-center justify-center bg-white dark:bg-slate-800 shadow-2xl mb-8"
            >
                <Animated.View style={[styles.compass, animatedCompassStyle]}>
                    <Svg height={COMPASS_SIZE * 0.9} width={COMPASS_SIZE * 0.9} viewBox="0 0 100 100">
                        {/* Dial Ticks */}
                        <G rotation="0" origin="50, 50">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Line
                                    key={i}
                                    x1="50"
                                    y1="5"
                                    x2="50"
                                    y2={i % 3 === 0 ? "15" : "10"}
                                    stroke={i === 0 ? "#2563EB" : "#94a3b8"} // North is Blue
                                    strokeWidth={i % 3 === 0 ? "2" : "1"}
                                    transform={`rotate(${i * 30} 50 50)`}
                                />
                            ))}
                        </G>

                        {/* Qibla Indicator (Fixed relative to the compass card) */}
                        {/* Wait! The compass card rotates so 'North' is always up? No. */}
                        {/* Usually phone compass UI: The Dial rotates so that North on dial points to True North. 
                    The Phone frame is fixed. 
                    If we rotate the dial by `rotation` value:
                    When phone points North (0), rotation is 0. 'N' is at top.
                    When phone points East (90), rotation is -90. 'N' moves to Left.
                */}

                        {/* We need to place Qibla Indicator on the Dial at `qiblaBearing` degrees. 
                    It will automatically rotate with the dial.
                */}
                        <G rotation={qiblaBearing} origin="50, 50">
                            <Line x1="50" y1="50" x2="50" y2="10" stroke="#2563EB" strokeWidth="3" strokeDasharray="4 2" />
                            <Circle cx="50" cy="10" r="4" fill="#2563EB" />
                        </G>
                    </Svg>

                    {/* Center Pivot */}
                    <View className="absolute w-4 h-4 bg-blue-600 dark:bg-blue-500 rounded-full z-10" style={{ shadowColor: '#2563EB', shadowOpacity: 0.8, shadowRadius: 8 }} />

                    {/* North Label */}
                    <Text className="absolute top-8 text-blue-600 dark:text-blue-400 font-bold text-lg">N</Text>
                </Animated.View>

                {/* Top "Read Line" (Fixed Marker on Phone) */}
                <View className="absolute top-0 w-1 h-6 bg-blue-600 dark:bg-blue-500 rounded-full z-20 shadow-lg" style={{ shadowColor: '#2563EB', shadowOpacity: 0.8 }} />
            </Animated.View>

            {/* Info Panel */}
            <View className="items-center mb-6">
                <CompassDegreeText rotation={rotation} style={[styles.degreeText, animatedTextStyle]} />
                <Text className="text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mt-2">
                    {isAligned ? "KIBLE YÖNÜNDESİNİZ" : "YÖN ARANIYOR"}
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-[10px] mt-1 font-medium">
                    Kıble Açısı: {Math.round(qiblaBearing)}°
                </Text>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-4">
                <TouchableOpacity
                    onPress={openMap}
                    className="flex-row items-center bg-blue-50 dark:bg-blue-900/30 px-6 py-3 rounded-2xl border border-blue-200 dark:border-blue-700"
                >
                    <MapPin size={18} color="#2563EB" className="mr-2" />
                    <Text className="text-blue-700 dark:text-blue-400 font-bold">Haritada Gör</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setCalibModalVisible(true)}
                    className="flex-row items-center bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600"
                >
                    <Info size={18} color="#64748b" />
                </TouchableOpacity>
            </View>

            {/* Calibration Modal */}
            <Modal visible={calibModalVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/90 items-center justify-center p-8">
                    <View className="bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 p-8 rounded-[32px] items-center w-full" style={{ paddingBottom: 32 }}>
                        <Text className="text-2xl font-black text-blue-900 dark:text-blue-300 mb-4">Kalibrasyon</Text>
                        <Text className="text-slate-700 dark:text-slate-300 text-center mb-8 leading-relaxed">
                            Pusula doğruluğunu artırmak için telefonunuzu elinizde tutarak havada "8" (sekiz) çizin.
                        </Text>
                        {/* Visual placeholder for Figure 8 */}
                        <View className="w-32 h-16 border-4 border-blue-200 dark:border-blue-700 rounded-full mb-8 transform rotate-12" />

                        <TouchableOpacity
                            onPress={() => setCalibModalVisible(false)}
                            className="bg-blue-600 dark:bg-blue-500 w-full py-4 rounded-2xl items-center"
                        >
                            <Text className="text-white font-bold text-lg">Tamam</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
                buttons={alertConfig.buttons}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    compass: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    degreeText: {
        fontSize: 48,
        fontWeight: '900',
    }
});
