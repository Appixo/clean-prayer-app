import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    AppState,
    type AppStateStatus,
    ImageBackground,
    ActivityIndicator,
    StyleSheet,
    Platform,
    Share
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import { ChevronDown, VolumeX, Share2, Square, CheckSquare } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrayerCard } from '../../components/PrayerCard';
import { CountdownTimer } from '../../components/CountdownTimer';
import { HijriDate } from '../../components/HijriDate';
import { CustomAlert } from '../../components/CustomAlert';
import { calculatePrayerTimes, formatPrayerTime, getTimeUntilNext, getNextPrayer } from '../../lib/prayer';
import { t } from '../../lib/i18n';
import { useStore } from '../../store/useStore';
import { logger } from '../../lib/logger';
import { stopAdhan, refreshAllNotifications, updatePersistentNotification } from '../../lib/notifications';

import type { PrayerTimes, PrayerTimeData } from '../../types';

export default function HomeScreen() {
    const navigation = useNavigation();
    const {
        location,
        calculationMethod, asrMethod, highLatitudeRule,
        timeFormat,
        viewLevel,
        isAdhanPlaying,
        city: storeCity,
        savedLocations,
        prayerLog,
        togglePrayerPerformed
    } = useStore();

    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [realNextInfo, setRealNextInfo] = useState<{ nextPrayer: string | null; timeUntil: number | null }>({ nextPrayer: null, timeUntil: null });
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ visible: false, title: '', buttons: [] });

    // Update header to show location and Diyanet branding
    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: () => (
                <View className="items-center">
                    <Text className="text-[10px] uppercase tracking-widest text-blue-700 font-bold">Türkiye</Text>
                    <Text className="text-lg font-extrabold text-blue-900">{storeCity?.toUpperCase() || 'İSTANBUL'}</Text>
                </View>
            ),
            headerStyle: {
                backgroundColor: '#f8fafc',
                elevation: 0,
                shadowOpacity: 0,
            },
        });
    }, [navigation, storeCity]);

    // Load Prayer Times for the selected date
    const loadPrayerTimes = useCallback(async (targetDate?: Date) => {
        if (!location) return;

        const dateToCalculate = targetDate || selectedDate;

        try {
            setLoading(true);
            const calculatedTimes = calculatePrayerTimes(
                location,
                calculationMethod,
                asrMethod,
                highLatitudeRule,
                dateToCalculate
            );

            setPrayerTimes(calculatedTimes);
            setSelectedDate(dateToCalculate);
            updatePersistentNotification();
        } catch (error) {
            logger.error('Error in loadPrayerTimes', error);
        } finally {
            setLoading(false);
        }
    }, [location, calculationMethod, asrMethod, highLatitudeRule]);

    // Initial load
    useEffect(() => {
        if (location) {
            loadPrayerTimes(selectedDate);
        }
    }, [location, calculationMethod, asrMethod, highLatitudeRule, selectedDate]);

    // Separate Effect for REAL Countdown (Always based on NOW)
    useEffect(() => {
        if (!location) return;

        const updateRealNextPrayer = () => {
            const now = new Date();
            // Calculate times for TODAY to determine next prayer relative to NOW
            const todayTimes = calculatePrayerTimes(
                location,
                calculationMethod,
                asrMethod,
                highLatitudeRule,
                now
            );

            const { nextPrayer, timeUntilNext: timeUntil } = getNextPrayer(todayTimes, now);
            setRealNextInfo({ nextPrayer, timeUntil });
        };

        updateRealNextPrayer();
        const timer = setInterval(updateRealNextPrayer, 1000);
        return () => clearInterval(timer);
    }, [location, calculationMethod, asrMethod, highLatitudeRule]);

    // Daily Verse (Mocked for Turkish focus)
    const dailyVerse = {
        text: "Hakkı bâtılla karıştırıp da bile bile hakkı gizlemeyin.",
        source: "Bakara: 42"
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `"${dailyVerse.text}" - ${dailyVerse.source} \n\nNamaz Vakitleri uygulamasından gönderildi.`
            });
        } catch (error) {
            // ignore
        }
    };

    const handleToggleLog = (date: Date, prayer: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const dateKey = date.toISOString().split('T')[0];
        togglePrayerPerformed(dateKey, prayer);
    };

    if (loading && !prayerTimes) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!prayerTimes) return null;

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const dateKey = selectedDate.toISOString().split('T')[0];

    const prayers: PrayerTimeData[] = [
        { name: 'fajr', displayName: 'İmsak', time: prayerTimes.fajr, formattedTime: formatPrayerTime(prayerTimes.fajr), isNext: isToday && realNextInfo.nextPrayer === 'fajr' },
        { name: 'sunrise', displayName: 'Güneş', time: prayerTimes.sunrise, formattedTime: formatPrayerTime(prayerTimes.sunrise), isNext: isToday && realNextInfo.nextPrayer === 'sunrise' },
        { name: 'dhuhr', displayName: selectedDate.getDay() === 5 ? 'Cuma' : 'Öğle', time: prayerTimes.dhuhr, formattedTime: formatPrayerTime(prayerTimes.dhuhr), isNext: isToday && realNextInfo.nextPrayer === 'dhuhr' },
        { name: 'asr', displayName: 'İkindi', time: prayerTimes.asr, formattedTime: formatPrayerTime(prayerTimes.asr), isNext: isToday && realNextInfo.nextPrayer === 'asr' },
        { name: 'maghrib', displayName: 'Akşam', time: prayerTimes.maghrib, formattedTime: formatPrayerTime(prayerTimes.maghrib), isNext: isToday && realNextInfo.nextPrayer === 'maghrib' },
        { name: 'isha', displayName: 'Yatsı', time: prayerTimes.isha, formattedTime: formatPrayerTime(prayerTimes.isha), isNext: isToday && realNextInfo.nextPrayer === 'isha' },
    ];

    return (
        <View className="flex-1 bg-slate-50">
            <ScrollView
                className="flex-1"
                contentContainerClassName="p-4 pt-2"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={() => loadPrayerTimes(new Date())} colors={['#2563EB']} />
                }
            >
                {/* Level 2 & 3: Date Selector & Hijri */}
                {viewLevel >= 2 && (
                    <View className="mb-4 bg-white/80 p-4 rounded-3xl border border-blue-100 shadow-sm">
                        <HijriDate
                            date={selectedDate}
                            onDateChange={(d) => {
                                setSelectedDate(d);
                                loadPrayerTimes(d);
                            }}
                        />
                    </View>
                )}

                {/* Prayer Times Table (Premium Look) */}
                <View className="bg-white rounded-[40px] p-6 shadow-sm border border-blue-50 mb-6">
                    {prayers.map((prayer, index) => {
                        const isCompleted = prayerLog[`${dateKey}_${prayer.name}`];
                        return (
                            <TouchableOpacity
                                key={prayer.name}
                                onPress={() => handleToggleLog(selectedDate, prayer.name)}
                                className={`flex-row justify-between items-center py-3 ${index !== prayers.length - 1 ? 'border-b border-blue-50' : ''}`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View>
                                        {isCompleted ? (
                                            <CheckSquare size={20} color="#2563EB" />
                                        ) : (
                                            <Square size={20} color="#cbd5e1" />
                                        )}
                                    </View>
                                    <Text className={`text-lg ${prayer.isNext ? 'font-bold text-blue-700' : isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                                        {prayer.displayName}
                                    </Text>
                                </View>
                                <Text className={`text-xl ${prayer.isNext ? 'font-black text-blue-800' : isCompleted ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                                    {prayer.formattedTime}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}

                    {/* Next Prayer Countdown (Integrated into list) */}
                    {isToday && (
                        <View className="mt-4 pt-4 border-t border-blue-100 items-center">
                            <Text className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">
                                {t(realNextInfo.nextPrayer || 'fajr')} vaktine kalan süre
                            </Text>
                            <Text className="text-4xl font-black text-blue-900 tracking-tighter">
                                {formatDuration(realNextInfo.timeUntil || 0)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Level 2 & 3: Günün Ayeti */}
                {viewLevel >= 2 && (
                    <View className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-blue-800 font-bold text-sm tracking-tight">Günün Ayeti</Text>
                            <TouchableOpacity onPress={handleShare}>
                                <Share2 size={18} color="#1d4ed8" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-slate-700 italic leading-relaxed text-base italic">
                            "{dailyVerse.text}"
                        </Text>
                        <Text className="text-right mt-2 text-blue-700 font-bold text-xs">- ({dailyVerse.source})</Text>
                    </View>
                )}

                {/* View Level Disclaimer */}
                <View className="mt-8 items-center opacity-40">
                    <Text className="text-[10px] text-slate-500 font-bold uppercase">Diyanet İşleri Başkanlığı ile uyumludur</Text>
                </View>
            </ScrollView>

            {/* Adhan Playing Overlay */}
            {isAdhanPlaying && (
                <View className="absolute bottom-10 left-10 right-10 bg-red-600 p-5 rounded-full flex-row items-center justify-center shadow-2xl">
                    <TouchableOpacity onPress={() => stopAdhan()} className="flex-row items-center">
                        <VolumeX size={24} color="white" />
                        <Text className="text-white font-bold ml-2 text-lg">EZANI SUSTUR</Text>
                    </TouchableOpacity>
                </View>
            )}

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onDismiss={() => setAlertConfig(p => ({ ...p, visible: false }))}
                buttons={alertConfig.buttons}
            />
        </View>
    );
}

function formatDuration(ms: number) {
    if (ms <= 0) return "00:00:00";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
