import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
// Import the new Premium Component
import { PremiumQiblaCompass } from '../../components/PremiumQiblaCompass';
import { useStore } from '../../store/useStore';
import { Settings } from 'lucide-react-native';

export default function QiblaScreen() {
    const router = useRouter();
    const location = useStore((state) => state.location);

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <View style={{ flex: 1, paddingHorizontal: 8, paddingTop: 4, justifyContent: 'space-between' }}>
                {location ? (
                    <>
                        <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingTop: 4 }}>
                            <Text className="text-blue-900 dark:text-blue-300 text-3xl font-black mb-2 tracking-tight">Kıble Pusulası</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-center font-medium text-xs uppercase tracking-widest">
                                Yüksek Hassasiyetli Sensör
                            </Text>
                        </View>

                        {/* Integration of the Premium Component */}
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <PremiumQiblaCompass location={location} />
                        </View>

                    </>
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                        <Text className="text-blue-900 dark:text-blue-300 text-xl font-black mb-4">Konum Bulunamadı</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-center mb-10 leading-relaxed font-medium">
                            Kıble yönünü göstermek için geçerli bir konuma ihtiyacımız var. Lütfen konum servislerini açın veya manuel bir konum seçin.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/settings')}
                            className="bg-blue-600 px-10 py-5 rounded-2xl shadow-lg active:bg-blue-700"
                        >
                            <View className="flex-row items-center">
                                <Settings color="white" size={20} className="mr-2" />
                                <Text className="text-white font-bold text-lg">Konum Ayarlarına Git</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}
