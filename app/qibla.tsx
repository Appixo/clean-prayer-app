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
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View className="pt-12 px-4 pb-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-800 rounded-full">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">{t('qiblaDirection')}</Text>
                <View className="w-10" />
            </View>

            <View className="flex-1">
                {location ? (
                    <QiblaCompass location={location} />
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-white">{t('unknownLocation')}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}
