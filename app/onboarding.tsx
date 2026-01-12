import { Bell, Check, MapPin, Search, Volume2, X, ArrowLeft, Layout } from 'lucide-react-native';
import { getCurrentLocation, searchCities, getCityName, getProvinceAndCountry } from '../lib/location';
import { logger } from '../lib/logger';
import { useStore } from '../store/useStore';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        addSavedLocation, selectLocation,
        toggleNotification, notifications,
        setPlayAdhan, playAdhan,
        setViewLevel, viewLevel
    } = useStore();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [showManualSearch, setShowManualSearch] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Step 1: Location
    const handleGPSOnce = async () => {
        setLoading(true);
        try {
            const result = await getCurrentLocation();
            if (result && result.coordinates) {
                const id = Math.random().toString(36).substring(2, 9);
                const savedLoc = {
                    id,
                    city: result.name || 'Konumum',
                    country: result.country || '',
                    latitude: result.coordinates.latitude,
                    longitude: result.coordinates.longitude,
                };
                addSavedLocation(savedLoc);
                selectLocation(id);
                setStep(2);
            } else {
                throw new Error('Konum bulunamadı');
            }
        } catch (error) {
            Alert.alert("Konum Hatası", "GPS konumunuz alınamadı. Lütfen manuel arama yapın.");
        } finally {
            setLoading(false);
        }
    };

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
        setStep(2);
    };

    const renderLocationStep = () => {
        if (showManualSearch) {
            return (
                <View className="flex-1 px-6 pt-6">
                    <TouchableOpacity onPress={() => setShowManualSearch(false)} className="flex-row items-center mb-6">
                        <ArrowLeft size={24} color="#1d4ed8" />
                        <Text className="text-blue-900 text-lg font-bold ml-2">Geri</Text>
                    </TouchableOpacity>

                    <Text className="text-3xl font-black text-blue-900 mb-2 text-center">Şehir Arayın</Text>
                    <Text className="text-slate-500 text-center mb-6">Namaz vakitleri için bulunduğunuz şehri seçin.</Text>

                    <View className="relative mb-4">
                        <TextInput
                            placeholder="Şehir adı yazın..."
                            placeholderTextColor="#94a3b8"
                            value={citySearch}
                            onChangeText={setCitySearch}
                            className="bg-white p-5 rounded-2xl text-slate-800 border border-blue-100 pr-12"
                            onSubmitEditing={() => searchCity(citySearch)}
                        />
                        {isSearching && <ActivityIndicator className="absolute right-4 top-5" size="small" color="#2563EB" />}
                    </View>

                    <ScrollView className="flex-1 mt-2">
                        {searchResults.map((item) => (
                            <TouchableOpacity
                                key={String(item.place_id)}
                                onPress={() => selectSearchResult(item)}
                                className="p-5 border-b border-blue-50 active:bg-blue-50"
                            >
                                <View className="flex-row items-center">
                                    <MapPin size={20} color="#2563EB" className="mr-3" />
                                    <View>
                                        <Text className="text-slate-800 text-lg font-bold">{getCityName(item)}</Text>
                                        <Text className="text-slate-400 text-xs">{getProvinceAndCountry(item)}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            );
        }

        return (
            <View className="flex-1 px-8 pt-10 justify-center">
                <Text className="text-4xl font-black text-blue-900 mb-2 text-center">Konumunuz</Text>
                <Text className="text-slate-500 text-center mb-12 text-lg">Hangi şehir için namaz vakitlerini görmek istersiniz?</Text>

                <View className="gap-5">
                    <TouchableOpacity
                        onPress={handleGPSOnce}
                        className="bg-blue-600 w-full p-6 rounded-[32px] flex-row items-center shadow-lg"
                    >
                        <MapPin size={24} color="white" />
                        <Text className="text-white font-black text-xl flex-1 text-center mr-6">GPS ile Bul</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowManualSearch(true)}
                        className="bg-white w-full p-6 rounded-[32px] flex-row items-center border border-blue-100 shadow-sm"
                    >
                        <Search size={24} color="#2563EB" />
                        <Text className="text-blue-700 font-bold text-xl flex-1 text-center mr-6">Şehir Ara</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Step 2: View Level Selection
    const renderViewLevelStep = () => (
        <View className="flex-1 px-8 pt-10 justify-center">
            <Text className="text-4xl font-black text-blue-900 mb-2 text-center">Uygulama Modu</Text>
            <Text className="text-slate-500 text-center mb-12 text-lg">Uygulamayı nasıl kullanmak istersiniz?</Text>

            <View className="gap-4">
                {[
                    { id: 1, label: 'Sade', desc: 'Sadece namaz vakitleri' },
                    { id: 2, label: 'Standart', desc: 'Vakitler + Dini Günler' },
                    { id: 3, label: 'Tam Mod', desc: 'Uygulamanın tüm özellikleri' }
                ].map((l) => (
                    <TouchableOpacity
                        key={l.id}
                        onPress={() => setViewLevel(l.id as 1 | 2 | 3)}
                        className={`p-6 rounded-[32px] border-2 flex-row items-center ${viewLevel === l.id ? 'border-blue-600 bg-blue-50' : 'border-blue-50 bg-white'}`}
                    >
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${viewLevel === l.id ? 'bg-blue-600' : 'bg-blue-100/50'}`}>
                            <Layout size={24} color={viewLevel === l.id ? 'white' : '#1d4ed8'} />
                        </View>
                        <View className="flex-1">
                            <Text className={`text-xl font-black ${viewLevel === l.id ? 'text-blue-900' : 'text-slate-700'}`}>{l.label}</Text>
                            <Text className="text-slate-500 text-sm">{l.desc}</Text>
                        </View>
                        {viewLevel === l.id && <Check size={24} color="#2563EB" />}
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                onPress={() => setStep(3)}
                className="bg-blue-600 w-full p-6 rounded-[32px] items-center shadow-lg mt-10"
            >
                <Text className="text-white font-black text-xl">Devam Et</Text>
            </TouchableOpacity>
        </View>
    );

    // Step 3: Notifications
    const renderNotificationStep = () => (
        <View className="flex-1 px-8 pt-10 justify-center">
            <Text className="text-4xl font-black text-blue-900 mb-2 text-center">Bildirimler</Text>
            <Text className="text-slate-500 text-center mb-12 text-lg">Vakit geldiğinde bildirim almak ister misiniz?</Text>

            <View className="bg-white rounded-[40px] p-6 gap-2 border border-blue-50 shadow-sm">
                {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
                    <View key={p} className="flex-row items-center justify-between py-4 border-b border-blue-50 last:border-0">
                        <Text className="text-lg font-bold text-slate-800">
                            {p === 'fajr' ? 'İmsak' : p === 'dhuhr' ? 'Öğle' : p === 'asr' ? 'İkindi' : p === 'maghrib' ? 'Akşam' : 'Yatsı'}
                        </Text>
                        <Switch
                            value={notifications[p]}
                            onValueChange={(val) => toggleNotification(p, val)}
                            trackColor={{ false: '#e2e8f0', true: '#2563EB' }}
                        />
                    </View>
                ))}
            </View>

            <TouchableOpacity
                onPress={() => setStep(4)}
                className="bg-blue-600 w-full p-6 rounded-[32px] items-center shadow-lg mt-10"
            >
                <Text className="text-white font-black text-xl">Devam Et</Text>
            </TouchableOpacity>
        </View>
    );

    // Step 4: Adhan Step
    const renderAdhanStep = () => (
        <View className="flex-1 px-8 pt-10 justify-center items-center">
            <Text className="text-4xl font-black text-blue-900 mb-2 text-center">Ezan Sesi</Text>
            <Text className="text-slate-500 text-center mb-12 text-lg">Bildirimlerde tam ezan sesi çalsın mı?</Text>

            <TouchableOpacity
                onPress={() => setPlayAdhan(!playAdhan)}
                className={`p-10 rounded-[64px] items-center justify-center mb-10 w-full border-2 ${playAdhan ? 'bg-blue-50 border-blue-200' : 'bg-white border-blue-50'}`}
            >
                <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 shadow-sm ${playAdhan ? 'bg-blue-600' : 'bg-slate-100'}`}>
                    <Volume2 size={48} color={playAdhan ? 'white' : '#94a3b8'} />
                </View>
                <Text className="text-2xl font-black text-blue-900 mb-2">
                    {playAdhan ? "Ezan Sesi Açık" : "Ezan Sesi Kapalı"}
                </Text>
                <Text className="text-slate-500 text-center font-medium">
                    {playAdhan ? "Vakitlerde profesyonel ezan kaydı çalacak." : "Standart telefon bildirimi çalacak."}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setStep(5)}
                className="bg-blue-600 w-full p-6 rounded-[32px] items-center shadow-lg"
            >
                <Text className="text-white font-black text-xl">Kurulumu Tamamla</Text>
            </TouchableOpacity>
        </View>
    );

    // Step 5: Success
    const renderSuccessStep = () => (
        <View className="flex-1 justify-center items-center px-10 bg-slate-50">
            <View className="bg-blue-600 w-24 h-24 rounded-full mb-8 items-center justify-center shadow-2xl">
                <Check size={48} color="white" />
            </View>
            <Text className="text-4xl font-black text-blue-900 mb-4 text-center">Hazırsınız!</Text>
            <Text className="text-slate-500 text-center text-lg mb-16 font-medium leading-relaxed">
                Uygulama başarıyla kuruldu. Dualarınızın kabul olması dileğiyle.
            </Text>
            <TouchableOpacity
                onPress={() => router.replace('/(tabs)')}
                className="bg-blue-600 w-full p-6 rounded-[32px] shadow-xl active:bg-blue-700"
            >
                <Text className="text-white text-center font-black text-xl">Uygulamaya Git</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="flex-1">
                {step === 1 && renderLocationStep()}
                {step === 2 && renderViewLevelStep()}
                {step === 3 && renderNotificationStep()}
                {step === 4 && renderAdhanStep()}
                {step === 5 && renderSuccessStep()}
            </View>

            {/* Progress Dots */}
            {step < 5 && !showManualSearch && (
                <View className="flex-row justify-center pb-10 gap-3">
                    {[1, 2, 3, 4].map((s) => (
                        <View
                            key={s}
                            className={`h-2.5 rounded-full ${step === s ? 'w-10 bg-blue-600' : 'w-2.5 bg-blue-100'}`}
                        />
                    ))}
                </View>
            )}
        </SafeAreaView>
    );
}
