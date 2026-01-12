import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    FlatList,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { t } from '../../lib/i18n';
import {
    CALCULATION_METHODS,
    CALCULATION_METHOD_DISPLAY_NAMES,
} from '../../constants/methods';
import { X, Search, MapPin, Volume2, Play, Bell, Square, ChevronRight, Layout, Info, Trash2, Check } from 'lucide-react-native';
import { simulatePrayerNotification, refreshAllNotifications } from '../../lib/notifications';
import { Audio } from 'expo-av';
import { logger } from '../../lib/logger';
import { searchCities, getCityName, getProvinceAndCountry } from '../../lib/location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const {
        calculationMethod, setCalculationMethod,
        viewLevel, setViewLevel,
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
        theme, setTheme
    } = useStore();

    const [citySearch, setCitySearch] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showLocationsModal, setShowLocationsModal] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const soundRef = React.useRef<Audio.Sound | null>(null);

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
        router.replace('/(tabs)');
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

    return (
        <View className="flex-1 bg-slate-50">
            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>

                {/* Görünüm Seviyesi (View Level) */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-3 ml-1">
                        <Layout size={18} color="#1d4ed8" className="mr-2" />
                        <Text className="text-blue-900 font-black text-lg">Uygulama Görünümü</Text>
                    </View>
                    <View className="bg-white rounded-[32px] p-2 flex-row border border-blue-50 shadow-sm">
                        {[1, 2, 3].map((level) => (
                            <TouchableOpacity
                                key={level}
                                onPress={() => setViewLevel(level as 1 | 2 | 3)}
                                className={`flex-1 py-4 rounded-[24px] items-center ${viewLevel === level ? 'bg-blue-600 shadow-md' : ''}`}
                            >
                                <Text className={`font-bold ${viewLevel === level ? 'text-white' : 'text-slate-500'}`}>
                                    Seviye {level}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text className="text-slate-400 text-[10px] mt-2 ml-4 italic">
                        {viewLevel === 1 && "Sadece temel vakitler ve geri sayım gösterilir."}
                        {viewLevel === 2 && "Vakitler, Hicri takvim ve günün ayeti gösterilir."}
                        {viewLevel === 3 && "Tüm özellikler ve detaylı bilgiler aktif edilir."}
                    </Text>
                </View>

                {/* Konum Ayarları */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-3 ml-1">
                        <MapPin size={18} color="#1d4ed8" className="mr-2" />
                        <Text className="text-blue-900 font-black text-lg">Konum</Text>
                    </View>
                    <View className="bg-white rounded-[32px] p-6 border border-blue-50 shadow-sm">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Mevcut Konum</Text>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-blue-900 text-xl font-black">{storeCity || 'Konum Seçilmedi'}</Text>
                            {savedLocations.length > 1 && (
                                <TouchableOpacity onPress={() => setShowLocationsModal(true)}>
                                    <Text className="text-blue-600 font-bold text-sm">Değiştir</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 py-1 border border-slate-100 mb-3">
                            <Search size={18} color="#94a3b8" />
                            <TextInput
                                placeholder="Şehir veya ilçe ara..."
                                value={citySearch}
                                onChangeText={setCitySearch}
                                className="flex-1 p-3 text-slate-800 font-medium"
                                returnKeyType="search"
                                onSubmitEditing={() => searchCity(citySearch)}
                            />
                            {isSearching && <ActivityIndicator size="small" color="#2563EB" />}
                        </View>

                        <TouchableOpacity
                            onPress={() => searchCity(citySearch)}
                            className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-base">Yeni Konum Ekle</Text>
                        </TouchableOpacity>

                        {savedLocations.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setShowLocationsModal(true)}
                                className="mt-3 py-3 items-center"
                            >
                                <Text className="text-slate-500 font-semibold text-sm">Kaydedilen Konumlar ({savedLocations.length})</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Sesli Bildirimler */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-3 ml-1">
                        <Volume2 size={18} color="#1d4ed8" className="mr-2" />
                        <Text className="text-blue-900 font-black text-lg">Ezan ve Bildirimler</Text>
                    </View>
                    <View className="bg-white rounded-[32px] p-6 border border-blue-50 shadow-sm">
                        <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-1">
                                <Text className="text-slate-800 font-bold text-base">Ezan Oku</Text>
                                <Text className="text-slate-400 text-xs">Vakit geldiğinde ezan sesi çalar.</Text>
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
                            className={`flex-row items-center justify-center p-4 rounded-2xl ${isPreviewPlaying ? 'bg-red-50' : 'bg-blue-50'}`}
                        >
                            {isPreviewPlaying ? <Square size={18} color="#ef4444" fill="#ef4444" /> : <Play size={18} color="#2563EB" fill="#2563EB" />}
                            <Text className={`font-bold ml-2 ${isPreviewPlaying ? 'text-red-600' : 'text-blue-700'}`}>
                                {isPreviewPlaying ? "Durdur" : "Ezan Sesi Dinle"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hakkında */}
                <View className="mb-20">
                    <View className="flex-row items-center mb-3 ml-1">
                        <Info size={18} color="#1d4ed8" className="mr-2" />
                        <Text className="text-blue-900 font-black text-lg">Bilgi</Text>
                    </View>
                    <View className="bg-white rounded-[32px] p-6 border border-blue-50 shadow-sm">
                        <TouchableOpacity
                            onPress={() => router.push('/about')}
                            className="flex-row justify-between items-center"
                        >
                            <Text className="text-slate-800 font-bold text-base">Hakkında</Text>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-center mt-6 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                        Namaz Vakitleri v1.0.0
                    </Text>
                </View>

            </ScrollView>

            {/* Search Modal */}
            <Modal visible={showSearchModal} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[48px] p-8 max-h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-blue-900">Şehir Seçin</Text>
                            <TouchableOpacity onPress={() => setShowSearchModal(false)} className="p-2 bg-slate-100 rounded-full">
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(it) => String(it.place_id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => selectSearchResult(item)}
                                    className="flex-row items-center py-5 border-b border-slate-50"
                                >
                                    <MapPin size={18} color="#2563EB" className="mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-slate-800">{getCityName(item)}</Text>
                                        <Text className="text-xs text-slate-400">{getProvinceAndCountry(item)}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Locations Management Modal */}
            <Modal visible={showLocationsModal} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[48px] p-8 max-h-[85%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-blue-900">Konumlarım</Text>
                            <TouchableOpacity onPress={() => setShowLocationsModal(false)} className="p-2 bg-slate-100 rounded-full">
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-slate-500 mb-4 px-1">
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
                                        className={`flex-row items-center py-4 px-4 mb-3 rounded-2xl border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}
                                    >
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isSelected ? 'bg-blue-600' : 'bg-slate-100'}`}>
                                            <MapPin size={20} color={isSelected ? 'white' : '#94a3b8'} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`text-lg font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                                {item.city}
                                            </Text>
                                            <Text className="text-xs text-slate-400">{item.country}</Text>
                                        </View>
                                        {isSelected ? (
                                            <Check size={20} color="#2563EB" />
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Konumu Sil",
                                                        "Bu konumu silmek istediğinize emin misiniz?",
                                                        [
                                                            { text: "İptal", style: "cancel" },
                                                            { text: "Sil", style: "destructive", onPress: () => removeSavedLocation(item.id) }
                                                        ]
                                                    );
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
        </View>
    );
}
