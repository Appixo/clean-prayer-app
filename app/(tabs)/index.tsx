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
    Share,
    Modal,
    TextInput,
    FlatList,
    useWindowDimensions
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRouter } from 'expo-router';
import { ChevronDown, VolumeX, Share2, Square, CheckSquare, Search, MapPin, X } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { PrayerCard } from '../../components/PrayerCard';
import { CountdownTimer } from '../../components/CountdownTimer';
import { HijriDate } from '../../components/HijriDate';
import { CustomAlert } from '../../components/CustomAlert';
import { NotificationToggle } from '../../components/NotificationToggle';
import { calculatePrayerTimes, formatPrayerTime, getTimeUntilNext, getNextPrayer } from '../../lib/prayer';
import { t } from '../../lib/i18n';
import { useStore } from '../../store/useStore';
import { logger } from '../../lib/logger';
import { stopAdhan, refreshAllNotifications, updatePersistentNotification } from '../../lib/notifications';
import { searchCities, getCityName, getProvinceAndCountry } from '../../lib/location';
import { updateWidgetData } from '../../lib/widget-bridge';

import type { PrayerTimes, PrayerTimeData } from '../../types';

export default function HomeScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const systemColorScheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const isSmallScreen = screenHeight < 700;
    const {
        location,
        calculationMethod, asrMethod, highLatitudeRule,
        timeFormat,
        viewMode,
        isAdhanPlaying,
        city: storeCity,
        savedLocations,
        prayerLog,
        togglePrayerPerformed,
        addSavedLocation,
        selectLocation,
        theme
    } = useStore();

    // Determine actual color scheme - properly use system color scheme when theme is 'system'
    // This ensures the UI updates immediately when switching to 'system' mode
    const actualColorScheme = theme === 'system' ? (systemColorScheme || 'light') : theme;
    const isDark = actualColorScheme === 'dark';

    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [realNextInfo, setRealNextInfo] = useState<{ nextPrayer: string | null; timeUntil: number | null }>({ nextPrayer: null, timeUntil: null });
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Search Modal State
    const [citySearch, setCitySearch] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ visible: false, title: '', buttons: [] });

    // Update header to show location and Diyanet branding, clickable title
    useEffect(() => {
        navigation.setOptions({
            headerShown: false, // Hide standard header - we'll use custom header with manual safe area padding
        });
    }, [navigation]);

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
            
            // Update widget when prayer times are loaded (only for today)
            if (!targetDate || targetDate.toDateString() === new Date().toDateString()) {
                await updateWidgetData();
            }
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

    const searchCity = async (query: string) => {
        if (query.length < 2) return;
        setIsSearching(true);
        try {
            const data = await searchCities(query, 'tr');
            setSearchResults(data);
        } catch (error) {
            logger.error('Search error', error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        let city = result.address?.city || result.address?.town || result.address?.village || result.display_name.split(',')[0];
        let country = result.address?.country;

        const id = Math.random().toString(36).substring(2, 9);
        addSavedLocation({
            id,
            city,
            country: country || '',
            latitude: lat,
            longitude: lon,
        });
        selectLocation(id);

        setShowSearchModal(false);
        setSearchResults([]);
    };

    // Daily Verse (Mocked for Turkish focus)
    const dailyVerse = {
        text: "Hakkı bâtılla karıştırıp da bile bile hakkı gizlemeyin.",
        source: "Bakara: 42"
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

    if (!prayerTimes) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
                <View className="bg-white dark:bg-slate-800 p-6 rounded-[32px] items-center shadow-lg border border-slate-100 dark:border-slate-700 w-full">
                    <MapPin size={48} color="#2563EB" className="mb-4" />
                    <Text className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 text-center">Konum Belirlenemedi</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-center mb-6">
                        Namaz vakitlerini görmek için lütfen bir şehir seçin.
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowSearchModal(true)}
                        className="bg-blue-600 w-full py-4 rounded-2xl items-center"
                    >
                        <Text className="text-white font-bold text-lg">Şehir Seç</Text>
                    </TouchableOpacity>
                </View>

                {/* Re-use the Search Modal here so it works even in empty state */}
                <Modal visible={showSearchModal} animationType="slide" transparent={true}>
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-white dark:bg-slate-800 rounded-t-[48px] p-8 max-h-[90%]" style={{ paddingBottom: Math.max(insets.bottom, 34) }}>
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-2xl font-black text-blue-900 dark:text-blue-300">Konum Seçin</Text>
                                <TouchableOpacity onPress={() => setShowSearchModal(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                    <X size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest mb-3">Şehir Ara</Text>
                            <View className="flex-row items-center bg-slate-50 dark:bg-slate-700 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-600 mb-4">
                                <TextInput
                                    placeholder="Şehir veya ilçe ara..."
                                    placeholderTextColor="#94a3b8"
                                    value={citySearch}
                                    onChangeText={setCitySearch}
                                    className="flex-1 text-slate-800 dark:text-slate-200 font-medium"
                                    returnKeyType="search"
                                    onSubmitEditing={() => searchCity(citySearch)}
                                />
                                {isSearching ? (
                                    <ActivityIndicator size="small" color="#2563EB" className="ml-2" />
                                ) : citySearch.length >= 2 ? (
                                    <TouchableOpacity
                                        onPress={() => searchCity(citySearch)}
                                        className="ml-2 p-2 bg-blue-600 rounded-xl"
                                        activeOpacity={0.7}
                                    >
                                        <Search size={18} color="white" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            <FlatList
                                data={searchResults}
                                keyExtractor={(it) => String(it.place_id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => selectSearchResult(item)}
                                        className="flex-row items-center py-4 border-b border-slate-50 dark:border-slate-700"
                                    >
                                        <MapPin size={18} color="#2563EB" className="mr-3" />
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-slate-800 dark:text-slate-200">{getCityName(item)}</Text>
                                            <Text className="text-xs text-slate-400 dark:text-slate-500">{getProvinceAndCountry(item)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    citySearch.length > 2 && !isSearching ? (
                                        <Text className="text-center text-slate-400 dark:text-slate-500 mt-4">Sonuç bulunamadı.</Text>
                                    ) : null
                                }
                            />
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const dateKey = selectedDate.toISOString().split('T')[0];

    // TODO: Add seconds for 'gelismis' mode
    const formatTime = (date: Date) => {
        if (timeFormat === '12h') {
            return date.toLocaleTimeString('tr-TR', { hour: 'numeric', minute: 'numeric', hour12: true });
        }
        return formatPrayerTime(date);
    };

    // Determine Active Prayer (Current Time Window)
    const getActivePrayer = (next: string | null): string | null => {
        if (!next) return 'isha'; // Edge case
        switch (next) {
            case 'sunrise': return 'fajr'; // Waiting for sunrise -> We are in Fajr
            case 'dhuhr': return null;     // Waiting for Dhuhr (after Sunrise) -> Kerahat/Free time. No highlight or 'Gunes' passed.
            case 'asr': return 'dhuhr';
            case 'maghrib': return 'asr';
            case 'isha': return 'maghrib';
            case 'fajr': return 'isha';
            default: return null;
        }
    };

    // logic specific to 'isToday' - if viewing another date, no 'active' highlight
    const activePrayer = isToday ? getActivePrayer(realNextInfo.nextPrayer) : null;

    const prayers: PrayerTimeData[] = [
        { name: 'fajr', displayName: 'İmsak', time: prayerTimes.fajr, formattedTime: formatTime(prayerTimes.fajr), isNext: activePrayer === 'fajr' },
        { name: 'sunrise', displayName: 'Güneş', time: prayerTimes.sunrise, formattedTime: formatTime(prayerTimes.sunrise), isNext: false }, // Sunrise never highlighted as active
        { name: 'dhuhr', displayName: selectedDate.getDay() === 5 ? 'Cuma' : 'Öğle', time: prayerTimes.dhuhr, formattedTime: formatTime(prayerTimes.dhuhr), isNext: activePrayer === 'dhuhr' },
        { name: 'asr', displayName: 'İkindi', time: prayerTimes.asr, formattedTime: formatTime(prayerTimes.asr), isNext: activePrayer === 'asr' },
        { name: 'maghrib', displayName: 'Akşam', time: prayerTimes.maghrib, formattedTime: formatTime(prayerTimes.maghrib), isNext: activePrayer === 'maghrib' },
        { name: 'isha', displayName: 'Yatsı', time: prayerTimes.isha, formattedTime: formatTime(prayerTimes.isha), isNext: activePrayer === 'isha' },
    ];

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            {/* Custom Header with Manual Safe Area Padding */}
            <View 
                style={{
                    paddingTop: insets.top, // MANDATORY: Manual safe area padding for translucent status bar
                    paddingBottom: 12,
                    paddingHorizontal: 20,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                }}
            >
                {/* LEFT GROUP: City Name + Arrow (Clickable Together) */}
                <TouchableOpacity 
                    onPress={() => setShowSearchModal(true)} 
                    className="active:opacity-60"
                    style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        flex: 1 // Allow it to take space but keep items together
                    }}
                >
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-lg font-extrabold text-blue-900 dark:text-blue-300"
                        style={{ textAlign: 'left' }}
                    >
                        {storeCity?.toUpperCase() || 'KONUM SEÇİN'}
                    </Text>
                    <ChevronDown 
                        size={16} 
                        color={isDark ? "#93c5fd" : "#1e3a8a"} 
                        style={{ marginLeft: 6 }} // Small gap between text and arrow
                    />
                </TouchableOpacity>
                
                {/* RIGHT GROUP: Share Icon */}
                <TouchableOpacity
                    onPress={async () => {
                        const dateStr = selectedDate.toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            weekday: 'long',
                        });
                        let message = `🕌 Namaz Vakitleri - ${dateStr}\n\n`;
                        message += `📍 ${storeCity || 'Konum'}\n\n`;
                        if (prayerTimes) {
                            const prayersList: PrayerTimeData[] = [
                                { name: 'fajr', displayName: 'İmsak', time: prayerTimes.fajr, formattedTime: formatTime(prayerTimes.fajr), isNext: false },
                                { name: 'sunrise', displayName: 'Güneş', time: prayerTimes.sunrise, formattedTime: formatTime(prayerTimes.sunrise), isNext: false },
                                { name: 'dhuhr', displayName: selectedDate.getDay() === 5 ? 'Cuma' : 'Öğle', time: prayerTimes.dhuhr, formattedTime: formatTime(prayerTimes.dhuhr), isNext: false },
                                { name: 'asr', displayName: 'İkindi', time: prayerTimes.asr, formattedTime: formatTime(prayerTimes.asr), isNext: false },
                                { name: 'maghrib', displayName: 'Akşam', time: prayerTimes.maghrib, formattedTime: formatTime(prayerTimes.maghrib), isNext: false },
                                { name: 'isha', displayName: 'Yatsı', time: prayerTimes.isha, formattedTime: formatTime(prayerTimes.isha), isNext: false },
                            ];
                            prayersList.forEach((p) => {
                                if (p.name !== 'sunrise') {
                                    message += `${p.displayName}: ${p.formattedTime}\n`;
                                }
                            });
                        }
                        message += `\n📱 Namaz Vakitleri Uygulaması`;
                        try {
                            await Share.share({ message });
                        } catch (error) {
                            logger.error('Share failed', error);
                        }
                    }}
                    className="p-2 active:opacity-60"
                >
                    <Share2 size={20} color={isDark ? "#93c5fd" : "#1e3a8a"} />
                </TouchableOpacity>
            </View>
            
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ 
                    paddingHorizontal: 16,
                    paddingTop: 4, // Small gap after custom header
                    paddingBottom: 100 // Fixed: Ensure proper bottom padding (not more than 120)
                }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={() => loadPrayerTimes(new Date())} colors={['#2563EB']} />
                }
            >
                {/* Standart & Gelismis: Date Selector & Hijri - Compact */}
                {viewMode !== 'basit' && (
                    <View 
                        className="bg-white dark:bg-slate-800/80 rounded-3xl border border-blue-100 dark:border-slate-700 shadow-sm"
                        style={{ 
                            padding: isSmallScreen ? 10 : 12,
                            marginTop: 4, // Reduced spacing between header and date card
                            marginBottom: 4
                        }}
                    >
                        <HijriDate
                            date={selectedDate}
                            onDateChange={(d) => {
                                setSelectedDate(d);
                                loadPrayerTimes(d);
                            }}
                            onReset={() => {
                                const now = new Date();
                                setSelectedDate(now);
                                loadPrayerTimes(now);
                            }}
                        />
                    </View>
                )}

                {/* Prayer Times Table (Premium Look) */}
                <View 
                    className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-blue-50 dark:border-slate-700 mb-6"
                    style={{ 
                        padding: isSmallScreen ? 12 : 16
                    }}
                >
                    {prayers.map((prayer, index) => {
                        const isSunrise = prayer.name === 'sunrise';
                        const isCompleted = prayerLog[`${dateKey}_${prayer.name}`];

                        if (isSunrise) {
                            return (
                                <View
                                    key={prayer.name}
                                    className={`flex-row justify-between items-center px-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl my-1 border border-amber-100 dark:border-amber-800`}
                                    style={{ 
                                        paddingVertical: isSmallScreen ? 8 : 10,
                                        minHeight: isSmallScreen ? 36 : 40,
                                        alignItems: 'center' // Center content vertically
                                    }}
                                >
                                    <Text 
                                        className="text-amber-600 dark:text-amber-400 font-bold tracking-widest uppercase"
                                        style={{ fontSize: isSmallScreen ? 10 : 11 }}
                                    >
                                        ☀️ {prayer.displayName}
                                    </Text>
                                    <Text 
                                        className="text-amber-700 dark:text-amber-300 font-bold"
                                        style={{ 
                                            fontSize: isSmallScreen ? 13 : 14,
                                            marginLeft: 10 // Spacing between label and time (increased from 8)
                                        }}
                                    >
                                        {prayer.formattedTime}
                                    </Text>
                                </View>
                            );
                        }

                        return (
                            <View
                                key={prayer.name}
                                className={`flex-row justify-between items-center ${index !== prayers.length - 1 ? 'border-b border-blue-50 dark:border-slate-700' : ''}`}
                                style={{ paddingVertical: isSmallScreen ? 8 : 10 }}
                            >
                                <TouchableOpacity
                                    onPress={() => handleToggleLog(selectedDate, prayer.name)}
                                    className="flex-row items-center gap-2 flex-1"
                                >
                                    <View>
                                        {isCompleted ? (
                                            <CheckSquare size={isSmallScreen ? 18 : 20} color="#2563EB" />
                                        ) : (
                                            <Square size={isSmallScreen ? 18 : 20} color="#cbd5e1" />
                                        )}
                                    </View>
                                    <Text 
                                        className={`${prayer.isNext ? 'font-bold text-blue-700 dark:text-blue-400' : isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-600 dark:text-slate-300'}`}
                                        style={{ fontSize: isSmallScreen ? 14 : 16 }}
                                    >
                                        {prayer.displayName}
                                    </Text>
                                </TouchableOpacity>

                                <View className="flex-row items-center gap-2">
                                    <Text 
                                        className={`${prayer.isNext ? 'font-black text-blue-800 dark:text-blue-400' : isCompleted ? 'text-slate-300 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200 font-medium'}`}
                                        style={{ fontSize: isSmallScreen ? 16 : 18 }}
                                    >
                                        {prayer.formattedTime}
                                    </Text>

                                    {/* Standart & Gelismis: Notification Bell - Exclude sunrise */}
                                    {viewMode !== 'basit' && prayer.name !== 'sunrise' && (
                                        <NotificationToggle prayerName={prayer.name} />
                                    )}
                                </View>
                            </View>
                        )
                    })}

                    {/* Next Prayer Countdown (Integrated into list) */}
                    {isToday && (
                        <View 
                            className="mt-3 pt-3 border-t border-blue-100 dark:border-slate-700 items-center"
                        >
                            <Text 
                                className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-1"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                {t(realNextInfo.nextPrayer || 'fajr')} vaktine kalan süre
                            </Text>
                            <Text 
                                className="font-black text-blue-900 dark:text-blue-300 tracking-tighter"
                                style={{ fontSize: isSmallScreen ? 28 : 36 }}
                            >
                                {formatDuration(realNextInfo.timeUntil || 0)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Standart & Gelismis: Günün Ayeti */}
                {viewMode !== 'basit' && (
                    <View className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-[32px] border border-blue-100/50 dark:border-blue-800/50 mb-4">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-blue-800 dark:text-blue-300 font-bold text-sm tracking-tight">Günün Ayeti</Text>
                            <TouchableOpacity onPress={async () => {
                                try {
                                    await Share.share({
                                        message: `"${dailyVerse.text}" - ${dailyVerse.source} \n\nNamaz Vakitleri uygulamasından gönderildi.`
                                    });
                                } catch (error) {
                                    // ignore
                                }
                            }}>
                                <Share2 size={18} color={isDark ? "#93c5fd" : "#1d4ed8"} />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-slate-700 dark:text-slate-300 italic leading-relaxed text-base italic">
                            "{dailyVerse.text}"
                        </Text>
                        <Text className="text-right mt-2 text-blue-700 dark:text-blue-400 font-bold text-xs">- ({dailyVerse.source})</Text>
                    </View>
                )}

                {/* View Level Disclaimer */}
                <View className="mb-4 items-center opacity-40">
                    <Text className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase">Diyanet İşleri Başkanlığı ile uyumludur</Text>
                </View>
            </ScrollView>

            {/* Adhan Playing Overlay */}
            {
                isAdhanPlaying && (
                    <View className="absolute bottom-10 left-10 right-10 bg-red-600 p-5 rounded-full flex-row items-center justify-center shadow-2xl">
                        <TouchableOpacity onPress={() => stopAdhan()} className="flex-row items-center">
                            <VolumeX size={24} color="white" />
                            <Text className="text-white font-bold ml-2 text-lg">EZANI SUSTUR</Text>
                        </TouchableOpacity>
                    </View>
                )
            }

            {/* Search Modal */}
            {/* Combined Location & Search Modal */}
            <Modal visible={showSearchModal} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white dark:bg-slate-800 rounded-t-[48px] p-8 max-h-[90%]" style={{ paddingBottom: Math.max(insets.bottom, 34) }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-blue-900 dark:text-blue-300">Konumlarım</Text>
                            <TouchableOpacity onPress={() => setShowSearchModal(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Saved Locations List - Quick Switcher Only */}
                        {savedLocations.length > 0 ? (
                            <FlatList
                                data={savedLocations}
                                keyExtractor={(loc) => loc.id}
                                renderItem={({ item: loc }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            selectLocation(loc.id);
                                            setShowSearchModal(false);
                                        }}
                                        className={`flex-row items-center py-4 px-4 mb-2 rounded-2xl border ${location && location.latitude === loc.latitude ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600'}`}
                                    >
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${location && location.latitude === loc.latitude ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-600'}`}>
                                            <MapPin size={18} color={location && location.latitude === loc.latitude ? 'white' : (isDark ? '#cbd5e1' : '#94a3b8')} />
                                        </View>
                                        <View className="flex-1">
                                            <Text 
                                                className={`text-lg font-bold ${location && location.latitude === loc.latitude 
                                                    ? 'text-blue-900 dark:text-blue-100' 
                                                    : 'text-slate-800 dark:text-slate-100'
                                                }`}
                                            >
                                                {loc.city}
                                            </Text>
                                            {loc.country && (
                                                <Text 
                                                    className={`text-xs ${location && location.latitude === loc.latitude
                                                        ? 'text-slate-500 dark:text-blue-200'
                                                        : 'text-slate-400 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {loc.country}
                                                </Text>
                                            )}
                                        </View>
                                        {location && location.latitude === loc.latitude && (
                                            <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                                                <Text className="text-white text-xs font-bold">✓</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View className="py-8 items-center">
                                        <Text className="text-slate-400 dark:text-slate-500 text-center mb-2">Kayıtlı konum bulunamadı</Text>
                                        <Text className="text-slate-300 dark:text-slate-600 text-xs text-center">Yeni konum eklemek için Ayarlar'a gidin</Text>
                                    </View>
                                }
                            />
                        ) : (
                            <View className="py-8 items-center">
                                <Text className="text-slate-400 dark:text-slate-500 text-center mb-2">Kayıtlı konum bulunamadı</Text>
                                <Text className="text-slate-300 dark:text-slate-600 text-xs text-center">Yeni konum eklemek için Ayarlar'a gidin</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onDismiss={() => setAlertConfig(p => ({ ...p, visible: false }))}
                buttons={alertConfig.buttons}
            />
        </View >
    );
}

function formatDuration(ms: number) {
    if (ms <= 0) return "00:00:00";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
