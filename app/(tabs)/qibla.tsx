import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { QiblaCompass } from '../../components/QiblaCompass';
import { useStore } from '../../store/useStore';
import { Settings } from 'lucide-react-native';

export default function QiblaScreen() {
    const router = useRouter();
    const location = useStore((state) => state.location);

    return (
        <View className="flex-1 bg-slate-50">
            <View className="flex-1 px-6 justify-center">
                {location ? (
                    <>
                        <View className="mb-10 items-center">
                            <Text className="text-blue-900 text-2xl font-black mb-2">Kıble Yönü</Text>
                            <Text className="text-slate-500 text-center font-medium">
                                Pusulanızı kalibre etmek için telefonunuzu sekiz (8) çizecek şekilde sallayın.
                            </Text>
                        </View>

                        <View className="bg-white p-8 rounded-[48px] shadow-sm border border-blue-50 items-center">
                            <QiblaCompass location={location} />
                        </View>

                        <View className="mt-12 p-6 bg-blue-50 rounded-[32px] border border-blue-100 items-center">
                            <Text className="text-blue-800 text-sm font-bold text-center leading-relaxed">
                                Mavi hattı takip ederek Kabe istikametini bulabilirsiniz.
                            </Text>
                        </View>
                    </>
                ) : (
                    <View className="flex-1 items-center justify-center p-8">
                        <Text className="text-blue-900 text-xl font-black mb-4">Konum Bulunamadı</Text>
                        <Text className="text-slate-500 text-center mb-10 leading-relaxed font-medium">
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
