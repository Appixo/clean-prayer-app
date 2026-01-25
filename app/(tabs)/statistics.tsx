import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, useColorScheme } from 'react-native';
import { useStore } from '../../store/useStore';
import { TrendingUp, Calendar, Target, Share2 } from 'lucide-react-native';
import { calculatePrayerTimes } from '../../lib/prayer';
import { Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const PRAYER_DISPLAY_NAMES: Record<string, string> = {
    fajr: 'Sabah',
    dhuhr: 'Öğle',
    asr: 'İkindi',
    maghrib: 'Akşam',
    isha: 'Yatsı',
};

export default function StatisticsScreen() {
    const { location, calculationMethod, asrMethod, highLatitudeRule, prayerLog, city, theme } = useStore();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const systemColorScheme = useColorScheme();
    const actualColorScheme = theme === 'system' ? (systemColorScheme || 'light') : theme;
    const isDark = actualColorScheme === 'dark';
    const isSmallScreen = screenHeight < 700;

    const stats = useMemo(() => {
        if (!location) return null;

        const today = new Date();
        const last30Days: Date[] = [];
        const last7Days: Date[] = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last30Days.push(date);
            if (i < 7) last7Days.push(date);
        }

        // Calculate stats
        let totalPrayers = 0;
        let totalPossible = 0;
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const prayerCounts: Record<string, number> = {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
        };

        // Check last 30 days
        for (let i = last30Days.length - 1; i >= 0; i--) {
            const date = last30Days[i];
            const dateKey = date.toISOString().split('T')[0];
            let dayPrayed = 0;
            let dayTotal = 0;

            PRAYER_NAMES.forEach((prayer) => {
                const prayerTimes = calculatePrayerTimes(
                    location,
                    calculationMethod,
                    asrMethod,
                    highLatitudeRule,
                    date
                );
                const prayerTime = prayerTimes[prayer] as Date;
                const now = new Date();
                
                if (prayerTime < now) {
                    dayTotal++;
                    totalPossible++;
                    const logKey = `${dateKey}_${prayer}`;
                    if (prayerLog[logKey]) {
                        totalPrayers++;
                        dayPrayed++;
                        prayerCounts[prayer]++;
                    }
                }
            });

            // Streak calculation
            if (dayPrayed === dayTotal && dayTotal > 0) {
                tempStreak++;
                if (i === last30Days.length - 1) {
                    currentStreak = tempStreak;
                }
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                if (i < last30Days.length - 1) {
                    tempStreak = 0;
                }
            }
        }

        const completionRate = totalPossible > 0 ? Math.round((totalPrayers / totalPossible) * 100) : 0;
        const weekStats = {
            total: 0,
            possible: 0,
        };

        last7Days.forEach((date) => {
            const dateKey = date.toISOString().split('T')[0];
            PRAYER_NAMES.forEach((prayer) => {
                const prayerTimes = calculatePrayerTimes(
                    location,
                    calculationMethod,
                    asrMethod,
                    highLatitudeRule,
                    date
                );
                const prayerTime = prayerTimes[prayer] as Date;
                const now = new Date();
                
                if (prayerTime < now) {
                    weekStats.possible++;
                    const logKey = `${dateKey}_${prayer}`;
                    if (prayerLog[logKey]) {
                        weekStats.total++;
                    }
                }
            });
        });

        return {
            totalPrayers,
            totalPossible,
            completionRate,
            currentStreak,
            longestStreak,
            prayerCounts,
            weekStats,
        };
    }, [location, calculationMethod, asrMethod, highLatitudeRule, prayerLog]);

    const handleShare = async () => {
        if (!stats) return;
        
        const message = `📊 Namaz İstatistiklerim\n\n` +
            `✅ Toplam: ${stats.totalPrayers}/${stats.totalPossible} (${stats.completionRate}%)\n` +
            `🔥 Mevcut Seri: ${stats.currentStreak} gün\n` +
            `⭐ En Uzun Seri: ${stats.longestStreak} gün\n` +
            `📅 Bu Hafta: ${stats.weekStats.total}/${stats.weekStats.possible}\n\n` +
            `📍 ${city || 'Konum'}`;

        try {
            await Share.share({ message });
        } catch (error) {
            console.error('Share failed', error);
        }
    };

    if (!location) {
        return (
            <View className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center p-8">
                <Text className="text-slate-800 dark:text-slate-200 font-bold text-lg mb-2">Konum Gerekli</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center">
                    İstatistikleri görmek için lütfen bir konum seçin.
                </Text>
            </View>
        );
    }

    if (!stats) {
        return (
            <View className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center">
                <Text className="text-slate-500 dark:text-slate-400">Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <View 
                style={{ 
                    flex: 1, 
                    paddingHorizontal: 16,
                    paddingTop: 4, // Minimal top padding since header is shown
                    paddingBottom: Math.max(insets.bottom, 20),
                    justifyContent: 'space-between'
                }}
            >
                {/* Header - Compact */}
                <View style={{ paddingTop: 0, paddingBottom: 4 }}>
                    <Text 
                        className="font-black text-blue-900 dark:text-blue-300"
                        style={{ fontSize: isSmallScreen ? 20 : 24, marginBottom: 2 }}
                    >
                        İstatistikler
                    </Text>
                    <Text 
                        className="text-slate-500 dark:text-slate-400"
                        style={{ fontSize: isSmallScreen ? 11 : 12 }}
                    >
                        Son 30 günün özeti
                    </Text>
                </View>

                {/* Overall Stats - Compact */}
                <View 
                    className="bg-white dark:bg-slate-800 rounded-[24px] border border-blue-50 dark:border-slate-700 shadow-sm"
                    style={{ 
                        padding: isSmallScreen ? 12 : 16,
                        marginBottom: 8
                    }}
                >
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                            <TrendingUp size={isSmallScreen ? 18 : 20} color="#2563EB" />
                            <Text 
                                className="text-slate-800 dark:text-slate-200 font-bold ml-2"
                                style={{ fontSize: isSmallScreen ? 14 : 16 }}
                            >
                                Genel
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleShare} className="p-1">
                            <Share2 size={isSmallScreen ? 16 : 18} color="#2563EB" />
                        </TouchableOpacity>
                    </View>
                    
                    <View className="mb-3">
                        <Text 
                            className="text-slate-500 dark:text-slate-400 mb-1"
                            style={{ fontSize: isSmallScreen ? 11 : 12 }}
                        >
                            Tamamlanma Oranı
                        </Text>
                        <View className="flex-row items-center">
                            <View 
                                className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mr-2"
                                style={{ height: isSmallScreen ? 6 : 8 }}
                            >
                                <View 
                                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                                    style={{ width: `${stats.completionRate}%` }}
                                />
                            </View>
                            <Text 
                                className="text-blue-600 dark:text-blue-400 font-black"
                                style={{ fontSize: isSmallScreen ? 14 : 16 }}
                            >
                                {stats.completionRate}%
                            </Text>
                        </View>
                        <Text 
                            className="text-slate-400 dark:text-slate-500 mt-1"
                            style={{ fontSize: isSmallScreen ? 10 : 11 }}
                        >
                            {stats.totalPrayers} / {stats.totalPossible} namaz
                        </Text>
                    </View>

                    <View className="flex-row gap-2">
                        <View 
                            className="flex-1 bg-blue-50 dark:bg-blue-900/30 rounded-2xl"
                            style={{ padding: isSmallScreen ? 10 : 12 }}
                        >
                            <Text 
                                className="text-slate-500 dark:text-slate-400 mb-1"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                Mevcut Seri
                            </Text>
                            <Text 
                                className="text-blue-600 dark:text-blue-400 font-black"
                                style={{ fontSize: isSmallScreen ? 20 : 24 }}
                            >
                                {stats.currentStreak}
                            </Text>
                            <Text 
                                className="text-slate-400 dark:text-slate-500"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                gün
                            </Text>
                        </View>
                        <View 
                            className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl"
                            style={{ padding: isSmallScreen ? 10 : 12 }}
                        >
                            <Text 
                                className="text-slate-500 dark:text-slate-400 mb-1"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                En Uzun Seri
                            </Text>
                            <Text 
                                className="text-emerald-600 dark:text-emerald-400 font-black"
                                style={{ fontSize: isSmallScreen ? 20 : 24 }}
                            >
                                {stats.longestStreak}
                            </Text>
                            <Text 
                                className="text-slate-400 dark:text-slate-500"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                gün
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Weekly Stats - Compact */}
                <View 
                    className="bg-white dark:bg-slate-800 rounded-[24px] border border-blue-50 dark:border-slate-700 shadow-sm"
                    style={{ 
                        padding: isSmallScreen ? 12 : 16,
                        marginBottom: 8
                    }}
                >
                    <View className="flex-row items-center mb-2">
                        <Calendar size={isSmallScreen ? 16 : 18} color="#10b981" />
                        <Text 
                            className="text-slate-800 dark:text-slate-200 font-bold ml-2"
                            style={{ fontSize: isSmallScreen ? 14 : 16 }}
                        >
                            Bu Hafta
                        </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                        <Text 
                            className="text-slate-600 dark:text-slate-400"
                            style={{ fontSize: isSmallScreen ? 12 : 13 }}
                        >
                            Tamamlanan
                        </Text>
                        <Text 
                            className="text-emerald-600 dark:text-emerald-400 font-black"
                            style={{ fontSize: isSmallScreen ? 18 : 20 }}
                        >
                            {stats.weekStats.total} / {stats.weekStats.possible}
                        </Text>
                    </View>
                </View>

                {/* Prayer Breakdown - Compact, Flexible */}
                <View 
                    className="bg-white dark:bg-slate-800 rounded-[24px] border border-blue-50 dark:border-slate-700 shadow-sm"
                    style={{ 
                        padding: isSmallScreen ? 12 : 16,
                        flex: 1,
                        minHeight: 0
                    }}
                >
                    <View className="flex-row items-center mb-3">
                        <Target size={isSmallScreen ? 16 : 18} color="#f59e0b" />
                        <Text 
                            className="text-slate-800 dark:text-slate-200 font-bold ml-2"
                            style={{ fontSize: isSmallScreen ? 14 : 16 }}
                        >
                            Vakit Bazında
                        </Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'space-around' }}>
                        {PRAYER_NAMES.map((prayer, index) => {
                            const count = stats.prayerCounts[prayer];
                            const maxPossible = 30; // Last 30 days
                            const percentage = Math.round((count / maxPossible) * 100);
                            return (
                                <View key={prayer} style={{ marginBottom: isSmallScreen ? 4 : 6 }}>
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text 
                                            className="text-slate-700 dark:text-slate-300 font-medium"
                                            style={{ fontSize: isSmallScreen ? 11 : 12 }}
                                        >
                                            {PRAYER_DISPLAY_NAMES[prayer]}
                                        </Text>
                                        <Text 
                                            className="text-blue-600 dark:text-blue-400 font-bold"
                                            style={{ fontSize: isSmallScreen ? 12 : 13 }}
                                        >
                                            {count}
                                        </Text>
                                    </View>
                                    <View 
                                        className="bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"
                                        style={{ height: isSmallScreen ? 4 : 5 }}
                                    >
                                        <View 
                                            className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View>
    );
}
