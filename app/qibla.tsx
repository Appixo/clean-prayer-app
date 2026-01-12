import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { QiblaCompass } from '../components/QiblaCompass';
import { useStore } from '../store/useStore';
import { t } from '../lib/i18n';
import { ArrowLeft } from 'lucide-react-native';

export default function QiblaScreen() {
    const router = useRouter();
    const location = useStore((state) => state.location);

    return (
        <View className="flex-1 bg-[#1a1a1a]">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View className="pt-12 px-6 pb-4 flex-row items-center justify-between border-b border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-800 rounded-full">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">{t('qiblaDirection')}</Text>
                <View className="w-10" />
            </View>

            <View className="flex-1 px-6 justify-center">
                {location ? (
                    <>
                        <View className="mb-10 items-center">
                            <Text className="text-gray-400 text-center mb-2">
                                {t('qiblaInstructions')}
                            </Text>
                        </View>

                        <QiblaCompass location={location} />

                        <View className="mt-12 p-4 bg-gray-800/50 rounded-2xl border border-gray-800">
                            <Text className="text-gray-400 text-sm italic text-center">
                                {t('rotateToAlign')}
                            </Text>
                        </View>
                    </>
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-white text-lg font-bold mb-4">{t('locationError')}</Text>
                        <Text className="text-gray-400 text-center mb-8">
                            {t('gpsFailedMessage')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/settings')}
                            className="bg-blue-500 px-8 py-4 rounded-2xl"
                        >
                            <Text className="text-white font-bold">{t('useManualSearch')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}
