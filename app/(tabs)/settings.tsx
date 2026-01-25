import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    Switch,
    ActivityIndicator,
    Pressable,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { t } from '../../lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../lib/logger';
import { useColorScheme } from 'react-native';
// Conditional import for expo-updates (not available in all environments)
// Use require() with try-catch to handle missing native module gracefully
let Updates: { reloadAsync?: () => Promise<void> } | null = null;
try {
    Updates = require('expo-updates');
} catch (e) {
    // expo-updates not available in development or certain builds - this is expected
    Updates = null;
}
import {
    CALCULATION_METHODS,
    CALCULATION_METHOD_DISPLAY_NAMES,
} from '../../constants/methods';
import { X, Search, MapPin, Volume2, Play, Bell, Square, ChevronRight, Layout, Info, Trash2, Check, Palette, Type, Clock, CircleDot, Calendar, BarChart3 } from 'lucide-react-native';
import { simulatePrayerNotification, refreshAllNotifications } from '../../lib/notifications';
import { Audio } from 'expo-av';
import { searchCities, getCityName, getProvinceAndCountry } from '../../lib/location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlert } from '../../components/CustomAlert';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const systemColorScheme = useColorScheme();

    const {
        calculationMethod, setCalculationMethod,
        viewMode, setViewMode,
        playAdhan, setPlayAdhan,
        setLocation,
        addSavedLocation,
        selectLocation,
        removeSavedLocation,
        location: currentLocation,
        isManualLocation,
        savedLocations,
        selectedLocationId,
        city: storeCity,
        country: storeCountry,
        theme, setTheme,
        notifications,
        toggleNotification,
        preAlarms,
        setPreAlarm,
        timeFormat, setTimeFormat,
        resetStore,
        asrMethod,
        setAsrMethod
    } = useStore();

    // Determine actual color scheme to avoid CSS interop issues during theme changes
    const actualColorScheme = theme === 'system' ? (systemColorScheme || 'light') : theme;
    const isDark = actualColorScheme === 'dark';

    const [citySearch, setCitySearch] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showLocationsModal, setShowLocationsModal] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const soundRef = React.useRef<Audio.Sound | null>(null);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ visible: false, title: '', buttons: [] });

    const searchCity = async (query: string) => {
        if (query.length < 2) return;
        setIsSearching(true);
        setSearchError(null);
        try {
            const data = await searchCities(query, 'tr');
            setSearchResults(data);
            setShowSearchModal(true);
        } catch (error) {
            logger.error('Search error', error);
            setSearchError("Bağlantı kurulamadı.");
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
        // Automatically select the new location
        selectLocation(id);

        setShowSearchModal(false);
        setSearchResults([]);
        // Location updated, no need to navigate away
    };

    const playPreview = async () => {
        try {
            if (isPreviewPlaying && soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                setIsPreviewPlaying(false);
                return;
            }
            const { sound } = await Audio.Sound.createAsync(require('../../assets/audio/adhan.mp3'));
            soundRef.current = sound;
            setIsPreviewPlaying(true);
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPreviewPlaying(false);
                    soundRef.current = null;
                }
            });
            await sound.playAsync();
        } catch (error) {
            setIsPreviewPlaying(false);
        }
    };

    // Mode Options - Memoized to prevent re-creation on theme changes
    const modes = useMemo(() => [
        { id: 'basit', label: 'Basit', desc: 'Sadece namaz vakitleri' },
        { id: 'standart', label: 'Standart', desc: 'Dengeli özellikler, ideal deneyim', recommended: true },
        { id: 'gelismis', label: 'Gelişmiş', desc: 'Tam kontrol ve ekstra özellikler' }
    ], []);

    const currentModeDesc = useMemo(() => modes.find(m => m.id === viewMode)?.desc, [modes, viewMode]);

    // Memoize the mode buttons to prevent re-renders that trigger CSS interop issues
    const modeButtons = useMemo(() => {
        return modes.map((mode) => {
            const isSelected = viewMode === mode.id;
            return (
                <Pressable
                    key={mode.id}
                    onPress={async () => {
                        logger.info(`[Settings] Mode selected: ${mode.id}`);
                        try {
                            const currentStore = useStore.getState();
                            const newStore = { ...currentStore, viewMode: mode.id };
                            await AsyncStorage.setItem('prayer-app-storage', JSON.stringify(newStore));

                            if (Updates && Updates.reloadAsync) {
                                await Updates.reloadAsync();
                            } else {
                                setViewMode(mode.id as any);
                                setAlertConfig({
                                    visible: true,
                                    title: 'Görünüm Modu Değiştirildi',
                                    message: 'Değişikliklerin tam olarak etkili olması için uygulamayı manuel olarak yeniden başlatmanız gerekebilir.',
                                    buttons: [{ text: 'Tamam' }]
                                });
                            }
                        } catch (error) {
                            logger.error('Failed to change view mode', error);
                            setViewMode(mode.id as any);
                        }
                    }}
                    style={{
                        flex: 1,
                        paddingVertical: 16,
                        borderRadius: 24,
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#2563EB' : 'transparent',
                        ...((isSelected && Platform.OS === 'ios') ? {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                        } : {}),
                        ...((isSelected && Platform.OS === 'android') ? {
                            elevation: 4,
                        } : {})
                    }}
                >
                    <Text style={{
                        fontWeight: 'bold',
                        color: isSelected ? 'white' : '#64748b'
                    }}>
                        {mode.label}
                    </Text>
                </Pressable>
            );
        });
    }, [modes, viewMode, isDark]);

    const handleResetApp = () => {
        setAlertConfig({
            visible: true,
            title: "Uygulamayı Sıfırla",
            message: "Tüm veriler silinecek ve uygulama fabrika ayarlarına dönecek. Emin misiniz?",
            buttons: [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sıfırla",
                    style: "destructive",
                    onPress: () => {
                        resetStore();
                        try {
                            if (router && typeof router.replace === 'function') {
                                router.replace('/onboarding');
                            }
                        } catch (error) {
                            logger.error('Navigation error', error);
                        }
                    }
                }
            ]
        });
    };

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <ScrollView 
                className="flex-1 p-4" 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
            >

                {/* 1. Konumlar (My Locations) - Always Visible */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-3 ml-1">
                        <View className="mr-2">
                            <MapPin size={18} color="#1d4ed8" />
                        </View>
                        <Text className="text-blue-900 dark:text-blue-300 font-black text-lg">Konumlarım</Text>
                    </View>
                    <View className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-blue-50 dark:border-slate-700 shadow-sm">
                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Mevcut Konum</Text>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-blue-900 dark:text-blue-300 text-xl font-black">{storeCity || 'Konum Seçilmedi'}</Text>
                            {savedLocations.length > 1 && (
                                <TouchableOpacity onPress={() => setShowLocationsModal(true)}>
                                    <Text className="text-blue-600 font-bold text-sm">Değiştir</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Simplified Add Location for Basit mode, keep consistent for now */}
                        <TouchableOpacity
                            onPress={() => setShowSearchModal(true)} // Open directly search modal to allow input
                            className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-base">Yeni Konum Ekle</Text>
                        </TouchableOpacity>

                        {savedLocations.length > 0 && viewMode !== 'basit' && (
                            <TouchableOpacity
                                onPress={() => setShowLocationsModal(true)}
                                className="mt-3 py-3 items-center"
                            >
                                <Text className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Kaydedilen Konumları Yönet ({savedLocations.length})</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* 2. Hesaplama (Calculation) - Hidden for Basit */}
                {viewMode !== 'basit' && (
                    <View className="mb-6">
                        <View className="flex-row items-center mb-3 ml-1">
                            <View className="mr-2">
                                <Layout size={18} color="#1d4ed8" />
                            </View>
                            <Text className="text-blue-900 dark:text-blue-300 font-black text-lg">Hesaplama</Text>
                        </View>
                        <View className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-blue-50 dark:border-slate-700 shadow-sm">
                            <View className="mb-4">
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Hesaplama Yöntemi</Text>
                                <Text className="text-slate-800 dark:text-slate-200 font-bold text-base">Diyanet İşleri Başkanlığı</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">Türkiye için varsayılan yöntemdir.</Text>
                            </View>

                            {/* Asr Method - Only if Advanced or Standard? Spec says Standard has it */}
                            <View style={{ marginBottom: 8 }}>
                                <Text style={{
                                    color: isDark ? '#94a3b8' : '#64748b',
                                    fontSize: 12,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    marginBottom: 8
                                }}>
                                    İkindi Vakti (Asr)
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                    borderRadius: 12,
                                    padding: 4
                                }}>
                                    {['Standard', 'Hanafi'].map((opt) => {
                                        const isSelected = asrMethod === opt;
                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                onPress={() => {
                                                    const method = opt as 'Standard' | 'Hanafi';
                                                    setAsrMethod(method);
                                                    refreshAllNotifications();
                                                }}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 8,
                                                    borderRadius: 8,
                                                    alignItems: 'center',
                                                    backgroundColor: isSelected ? (isDark ? '#475569' : '#ffffff') : 'transparent',
                                                    ...(isSelected && Platform.OS === 'ios' ? {
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 1 },
                                                        shadowOpacity: 0.1,
                                                        shadowRadius: 2,
                                                    } : {}),
                                                    ...(isSelected && Platform.OS === 'android' ? {
                                                        elevation: 2,
                                                    } : {})
                                                }}
                                            >
                                                <Text style={{
                                                    fontWeight: '700',
                                                    color: isSelected
                                                        ? (isDark ? '#93c5fd' : '#1e3a8a')
                                                        : (isDark ? '#64748b' : '#94a3b8')
                                                }}>
                                                    {opt === 'Standard' ? 'Standart' : 'Hanefi'}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* 3. Bildirimler (Notifications) */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-3 ml-1">
                        <View className="mr-2">
                            <Volume2 size={18} color="#1d4ed8" />
                        </View>
                        <Text className="text-blue-900 dark:text-blue-300 font-black text-lg">Bildirimler</Text>
                    </View>
                    <View className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-blue-50 dark:border-slate-700 shadow-sm">

                        {/* Master Toggle Logic - Simulating Master Toggle via enabling/disabling all */}
                        {/* For Basit mode, maybe just one big toggle? using playAdhan as primary sound toggle */}

                        <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-1">
                                <Text className="text-slate-800 dark:text-slate-200 font-bold text-base">Ezan Sesi</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-xs">Vakitlerde ezan okunsun.</Text>
                            </View>
                            <Switch
                                value={playAdhan}
                                onValueChange={(v) => {
                                    setPlayAdhan(v);
                                    refreshAllNotifications();
                                }}
                                trackColor={{ false: '#e2e8f0', true: '#2563EB' }}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={playPreview}
                            className={`flex-row items-center justify-center p-4 rounded-2xl mb-4 ${isPreviewPlaying ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
                        >
                            {isPreviewPlaying ? <Square size={18} color="#ef4444" fill="#ef4444" /> : <Play size={18} color="#2563EB" fill="#2563EB" />}
                            <Text className={`font-bold ml-2 ${isPreviewPlaying ? 'text-red-600 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                {isPreviewPlaying ? "Durdur" : "Ezan Sesi Dinle"}
                            </Text>
                        </TouchableOpacity>

                        {/* Per Prayer Toggles - Only for Standard/Advanced */}
                        {viewMode !== 'basit' && (
                            <View className="mt-2 border-t border-slate-50 dark:border-slate-700 pt-4">
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3">Vakit Bildirimleri</Text>
                                {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
                                    // Quick translation
                                    const name = p === 'fajr' ? 'İmsak' : p === 'dhuhr' ? 'Öğle' : p === 'asr' ? 'İkindi' : p === 'maghrib' ? 'Akşam' : 'Yatsı';
                                    return (
                                        <View key={p} className="flex-row items-center justify-between py-2">
                                            <Text className="text-slate-700 dark:text-slate-300 font-medium">{name}</Text>
                                            <Switch
                                                value={notifications[p]}
                                                onValueChange={(v) => {
                                                    toggleNotification(p, v);
                                                    refreshAllNotifications();
                                                }}
                                                trackColor={{ false: '#e2e8f0', true: '#2563EB' }}
                                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                            />
                                        </View>
                                    )
                                })}
                            </View>
                        )}

                        {/* Pre-Alarm Settings - Only for Standard/Advanced */}
                        {viewMode !== 'basit' && (
                            <View className="mt-4 border-t border-slate-50 pt-4">
                                <View className="flex-row items-center mb-3">
                                    <Clock size={16} color="#64748b" />
                                    <Text className="text-slate-500 text-xs font-bold uppercase ml-2">Ön Alarm (Sahur/İftar)</Text>
                                </View>
                                <Text className="text-slate-400 text-xs mb-3">Vakit girmeden önce hatırlatma alın</Text>
                                {['fajr', 'maghrib'].map((p) => {
                                    const name = p === 'fajr' ? 'İmsak (Sahur)' : 'Akşam (İftar)';
                                    const currentMinutes = preAlarms[p] || 0;
                                    const options = p === 'fajr' ? [0, 30, 45, 60] : [0, 15, 20, 30];
                                    return (
                                        <View key={p} className="mb-4">
                                            <View className="flex-row items-center justify-between mb-2">
                                                <Text className="text-slate-700 dark:text-slate-300 font-medium text-sm">{name}</Text>
                                                <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                    {currentMinutes > 0 ? `${currentMinutes} dk önce` : 'Kapalı'}
                                                </Text>
                                            </View>
                                            <View className="flex-row gap-2">
                                                {options.map((mins) => (
                                                    <TouchableOpacity
                                                        key={mins}
                                                        onPress={() => {
                                                            setPreAlarm(p, mins);
                                                            refreshAllNotifications();
                                                        }}
                                                        className={`flex-1 py-2 rounded-xl items-center border ${currentMinutes === mins
                                                                ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                                                                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                                                            }`}
                                                    >
                                                        <Text
                                                            className={`font-bold text-xs ${currentMinutes === mins ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                                                                }`}
                                                        >
                                                            {mins === 0 ? 'Kapalı' : `${mins}dk`}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>

                {/* 4. Görünüm (Appearance) */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-3 ml-1">
                        <View className="mr-2">
                            <Palette size={18} color="#1d4ed8" />
                        </View>
                        <Text className="text-blue-900 dark:text-blue-300 font-black text-lg">Görünüm</Text>
                    </View>
                    <View className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-blue-50 dark:border-slate-700 shadow-sm">

                        {/* Theme Selector */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                fontSize: 12,
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                marginBottom: 8
                            }}>
                                Tema
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                borderRadius: 12,
                                padding: 4
                            }}>
                                {['system', 'light', 'dark'].map((t) => {
                                    const isSelected = theme === t;
                                    return (
                                        <TouchableOpacity
                                            key={t}
                                            onPress={() => setTheme(t as any)}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                                alignItems: 'center',
                                                backgroundColor: isSelected ? (isDark ? '#475569' : '#ffffff') : 'transparent',
                                                ...(isSelected && Platform.OS === 'ios' ? {
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.1,
                                                    shadowRadius: 2,
                                                } : {}),
                                                ...(isSelected && Platform.OS === 'android' ? {
                                                    elevation: 2,
                                                } : {})
                                            }}
                                        >
                                            <Text style={{
                                                fontWeight: '700',
                                                color: isSelected
                                                    ? (isDark ? '#93c5fd' : '#1e3a8a')
                                                    : (isDark ? '#64748b' : '#94a3b8')
                                            }}>
                                                {t === 'system' ? 'Oto' : t === 'light' ? 'Açık' : 'Koyu'}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Time Format - Only Standart & Gelismis */}
                        {viewMode !== 'basit' && (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{
                                    color: isDark ? '#94a3b8' : '#64748b',
                                    fontSize: 12,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    marginBottom: 8
                                }}>
                                    Saat Biçimi
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                    borderRadius: 12,
                                    padding: 4
                                }}>
                                    {['24h', '12h'].map((fmt) => {
                                        const isSelected = timeFormat === fmt;
                                        return (
                                            <TouchableOpacity
                                                key={fmt}
                                                onPress={() => setTimeFormat(fmt as any)}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 8,
                                                    borderRadius: 8,
                                                    alignItems: 'center',
                                                    backgroundColor: isSelected ? (isDark ? '#475569' : '#ffffff') : 'transparent',
                                                    ...(isSelected && Platform.OS === 'ios' ? {
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 1 },
                                                        shadowOpacity: 0.1,
                                                        shadowRadius: 2,
                                                    } : {}),
                                                    ...(isSelected && Platform.OS === 'android' ? {
                                                        elevation: 2,
                                                    } : {})
                                                }}
                                            >
                                                <Text style={{
                                                    fontWeight: '700',
                                                    color: isSelected
                                                        ? (isDark ? '#93c5fd' : '#1e3a8a')
                                                        : (isDark ? '#64748b' : '#94a3b8')
                                                }}>
                                                    {fmt === '24h' ? '24 Saat' : '12 Saat'}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}


                    </View>
                </View>

                {/* 5. Görünüm Modu (View Mode) Selector */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 4 }}>
                        <View style={{ marginRight: 8 }}>
                            <Layout size={18} color="#1d4ed8" />
                        </View>
                        <Text style={{
                            color: isDark ? '#93c5fd' : '#1e3a8a',
                            fontWeight: '900',
                            fontSize: 18
                        }}>
                            Görünüm Modu
                        </Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            borderRadius: 32,
                            padding: 8,
                            flexDirection: 'row',
                            borderWidth: 1,
                            borderColor: isDark ? '#334155' : '#e0e7ff',
                        }}
                    >
                        {modeButtons}
                    </View>
                    <Text style={{
                        color: isDark ? '#94a3b8' : '#94a3b8',
                        textAlign: 'center',
                        fontSize: 12,
                        marginTop: 12,
                        fontStyle: 'italic'
                    }}>
                        {currentModeDesc}
                    </Text>
                </View>

                {/* 6. Ekstra Özellikler (Extra Features) */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-3 ml-1">
                        <View className="mr-2">
                            <Layout size={18} color="#1d4ed8" />
                        </View>
                        <Text className="text-blue-900 dark:text-blue-300 font-black text-lg">Ekstra Özellikler</Text>
                    </View>
                    <View className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-blue-50 dark:border-slate-700 shadow-sm">
                        <TouchableOpacity
                            onPress={() => {
                                try {
                                    if (router && typeof router.push === 'function') {
                                        router.push('/(tabs)/zikirmatik');
                                    }
                                } catch (error) {
                                    logger.error('Navigation error', error);
                                }
                            }}
                            className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700"
                        >
                            <View className="flex-row items-center">
                                <CircleDot size={20} color="#2563EB" />
                                <Text className="text-slate-800 dark:text-slate-200 font-bold text-base ml-3">Zikirmatik</Text>
                            </View>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                try {
                                    if (router && typeof router.push === 'function') {
                                        router.push('/(tabs)/kaza');
                                    }
                                } catch (error) {
                                    logger.error('Navigation error', error);
                                }
                            }}
                            className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700"
                        >
                            <View className="flex-row items-center">
                                <Calendar size={20} color="#2563EB" />
                                <Text className="text-slate-800 dark:text-slate-200 font-bold text-base ml-3">Kaza Takibi</Text>
                            </View>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                try {
                                    if (router && typeof router.push === 'function') {
                                        router.push('/(tabs)/statistics');
                                    }
                                } catch (error) {
                                    logger.error('Navigation error', error);
                                }
                            }}
                            className="flex-row justify-between items-center"
                        >
                            <View className="flex-row items-center">
                                <BarChart3 size={20} color="#2563EB" />
                                <Text className="text-slate-800 dark:text-slate-200 font-bold text-base ml-3">İstatistikler</Text>
                            </View>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 7. Hakkında (About) */}
                <View className="mb-20">
                    <View className="flex-row items-center mb-3 ml-1">
                        <View className="mr-2">
                            <Info size={18} color="#1d4ed8" />
                        </View>
                        <Text className="text-blue-900 dark:text-blue-300 font-black text-lg">Bilgi</Text>
                    </View>
                    <View className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-blue-50 dark:border-slate-700 shadow-sm">
                        <TouchableOpacity
                            onPress={() => {
                                try {
                                    if (router && typeof router.push === 'function') {
                                        router.push('/about');
                                    }
                                } catch (error) {
                                    logger.error('Navigation error', error);
                                }
                            }}
                            className="flex-row justify-between items-center mb-6"
                        >
                            <Text className="text-slate-800 dark:text-slate-200 font-bold text-base">Hakkında</Text>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleResetApp}
                            className="flex-row justify-between items-center"
                        >
                            <Text className="text-red-500 dark:text-red-400 font-bold text-base">Uygulamayı Sıfırla</Text>
                            <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-center mt-6 text-slate-300 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                        Namaz Vakitleri v1.0.0
                    </Text>
                </View>

            </ScrollView>

            {/* Search Modal */}
            <Modal visible={showSearchModal} animationType="slide" transparent={true}>
                {/* Reused Modal Logic from previous code - Search Only */}
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white dark:bg-slate-800 rounded-t-[48px] p-8 max-h-[80%]" style={{ paddingBottom: Math.max(insets.bottom, 34) }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-blue-900 dark:text-blue-300">Şehir Seçin</Text>
                            <TouchableOpacity onPress={() => setShowSearchModal(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
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
                                    className="flex-row items-center py-5 border-b border-slate-50 dark:border-slate-700"
                                >
                                    <MapPin size={18} color="#2563EB" className="mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200">{getCityName(item)}</Text>
                                        <Text className="text-slate-400 dark:text-slate-500 text-xs">{getProvinceAndCountry(item)}</Text>
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

            {/* Locations Management Modal */}
            <Modal visible={showLocationsModal} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white dark:bg-slate-800 rounded-t-[48px] p-8 max-h-[85%]" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-blue-900 dark:text-blue-300">Konumlarım</Text>
                            <TouchableOpacity onPress={() => setShowLocationsModal(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 mb-4 px-1">
                            Kayıtlı şehirleriniz arasında geçiş yapın veya silin.
                        </Text>
                        <FlatList
                            data={savedLocations}
                            keyExtractor={(it) => it.id}
                            renderItem={({ item }) => {
                                const isSelected = selectedLocationId === item.id;
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            selectLocation(item.id);
                                            setShowLocationsModal(false);
                                        }}
                                        className={`flex-row items-center py-4 px-4 mb-3 rounded-2xl border ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600'}`}
                                    >
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isSelected ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-600'}`}>
                                            <MapPin size={20} color={isSelected ? 'white' : (isDark ? '#cbd5e1' : '#94a3b8')} />
                                        </View>
                                        <View className="flex-1">
                                            <Text 
                                                className={`text-lg font-bold ${isSelected 
                                                    ? 'text-blue-900 dark:text-blue-100' 
                                                    : 'text-slate-700 dark:text-slate-100'
                                                }`}
                                            >
                                                {item.city}
                                            </Text>
                                            <Text className={`text-xs ${isSelected 
                                                ? 'text-slate-500 dark:text-blue-200' 
                                                : 'text-slate-400 dark:text-slate-300'
                                            }`}>
                                                {item.country}
                                            </Text>
                                        </View>
                                        {isSelected ? (
                                            <Check size={20} color={isDark ? "#93c5fd" : "#2563EB"} />
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setAlertConfig({
                                                        visible: true,
                                                        title: "Konumu Sil",
                                                        message: "Bu konumu silmek istediğinize emin misiniz?",
                                                        buttons: [
                                                            { text: "İptal", style: "cancel" },
                                                            { text: "Sil", style: "destructive", onPress: () => removeSavedLocation(item.id) }
                                                        ]
                                                    });
                                                }}
                                                className="p-2"
                                            >
                                                <Trash2 size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>
                                )
                            }}
                        />
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
