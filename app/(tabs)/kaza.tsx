import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, useWindowDimensions, useColorScheme } from 'react-native';
import { useStore } from '../../store/useStore';
import { Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react-native';
import { calculatePrayerTimes } from '../../lib/prayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const PRAYER_DISPLAY_NAMES: Record<string, string> = {
    fajr: 'Sabah',
    dhuhr: 'Öğle',
    asr: 'İkindi',
    maghrib: 'Akşam',
    isha: 'Yatsı',
};

export default function KazaScreen() {
    const { location, calculationMethod, asrMethod, highLatitudeRule, prayerLog, theme } = useStore();
    const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
    const insets = useSafeAreaInsets();
    const { height: screenHeight, width: screenWidth } = useWindowDimensions();
    const systemColorScheme = useColorScheme();
    const actualColorScheme = theme === 'system' ? (systemColorScheme || 'light') : theme;
    const isDark = actualColorScheme === 'dark';
    const isSmallScreen = screenHeight < 700;

    // Generate last 30 days (but we'll show fewer on small screens)
    const days = useMemo(() => {
        const daysArray = [];
        const today = new Date();
        const daysToShow = isSmallScreen ? 14 : 30; // Show 14 days on small screens, 30 on larger
        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            daysArray.push(date);
        }
        return daysArray;
    }, [isSmallScreen]);

    // Calculate missed prayers
    const missedPrayers = useMemo(() => {
        if (!location) return {};
        
        const missed: Record<string, number> = {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
        };

        days.forEach((date) => {
            const dateKey = date.toISOString().split('T')[0];
            const prayerTimes = calculatePrayerTimes(
                location,
                calculationMethod,
                asrMethod,
                highLatitudeRule,
                date
            );

            PRAYER_NAMES.forEach((prayer) => {
                const prayerTime = prayerTimes[prayer] as Date;
                const now = new Date();
                
                // Check if prayer time has passed
                if (prayerTime < now) {
                    const logKey = `${dateKey}_${prayer}`;
                    const isPrayed = prayerLog[logKey];
                    
                    if (!isPrayed) {
                        missed[prayer]++;
                    }
                }
            });
        });

        return missed;
    }, [days, location, calculationMethod, asrMethod, highLatitudeRule, prayerLog]);

    const totalMissed = Object.values(missedPrayers).reduce((sum, count) => sum + count, 0);

    const getPrayerStatus = (date: Date, prayer: string): 'prayed' | 'missed' | 'pending' | 'future' => {
        if (!location) return 'future';
        
        const dateKey = date.toISOString().split('T')[0];
        const logKey = `${dateKey}_${prayer}`;
        const isPrayed = prayerLog[logKey];
        
        if (isPrayed) return 'prayed';
        
        const prayerTimes = calculatePrayerTimes(
            location,
            calculationMethod,
            asrMethod,
            highLatitudeRule,
            date
        );
        const prayerTime = prayerTimes[prayer as keyof typeof prayerTimes] as Date;
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday && prayerTime > now) return 'future';
        if (prayerTime < now) return 'missed';
        return 'pending';
    };

    const selectedDayData = selectedDate ? {
        date: new Date(selectedDate),
        prayers: PRAYER_NAMES.map((prayer) => ({
            name: prayer,
            displayName: PRAYER_DISPLAY_NAMES[prayer],
            status: getPrayerStatus(new Date(selectedDate), prayer),
        })),
    } : null;

    // Calculate calendar cell size based on screen width and number of days per row
    const daysPerRow = 7; // 7 days per week
    const calendarPadding = 32; // Total horizontal padding
    const gap = 4; // Gap between cells
    const availableWidth = screenWidth - calendarPadding;
    const cellSize = Math.floor((availableWidth - (gap * (daysPerRow - 1))) / daysPerRow);
    const rows = Math.ceil(days.length / daysPerRow);
    const calendarHeight = (cellSize * rows) + (gap * (rows - 1)) + 60; // 60 for title and legend

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
                        Kaza Namazı Takibi
                    </Text>
                    <Text 
                        className="text-slate-500 dark:text-slate-400"
                        style={{ fontSize: isSmallScreen ? 11 : 12 }}
                    >
                        Kaçırdığınız namazları takip edin
                    </Text>
                </View>

                {/* Summary Card - Compact */}
                <View 
                    className="bg-white dark:bg-slate-800 rounded-[24px] border border-blue-50 dark:border-slate-700 shadow-sm"
                    style={{ 
                        padding: isSmallScreen ? 12 : 16,
                        marginBottom: 8
                    }}
                >
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                            <AlertCircle size={isSmallScreen ? 18 : 20} color="#ef4444" />
                            <Text 
                                className="text-slate-800 dark:text-slate-200 font-bold ml-2"
                                style={{ fontSize: isSmallScreen ? 14 : 16 }}
                            >
                                Toplam Kaza
                            </Text>
                        </View>
                        <Text 
                            className="text-red-600 dark:text-red-400 font-black"
                            style={{ fontSize: isSmallScreen ? 28 : 32 }}
                        >
                            {totalMissed}
                        </Text>
                    </View>
                    
                    <View className="border-t border-slate-100 dark:border-slate-700 pt-3">
                        {PRAYER_NAMES.map((prayer) => {
                            const count = missedPrayers[prayer];
                            if (count === 0) return null;
                            return (
                                <View key={prayer} className="flex-row items-center justify-between" style={{ paddingVertical: 2 }}>
                                    <Text 
                                        className="text-slate-600 dark:text-slate-300 font-medium"
                                        style={{ fontSize: isSmallScreen ? 12 : 13 }}
                                    >
                                        {PRAYER_DISPLAY_NAMES[prayer]}
                                    </Text>
                                    <Text 
                                        className="text-red-500 dark:text-red-400 font-bold"
                                        style={{ fontSize: isSmallScreen ? 12 : 13 }}
                                    >
                                        {count} kaza
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Calendar Grid - Flexible */}
                <View 
                    className="bg-white dark:bg-slate-800 rounded-[24px] border border-blue-50 dark:border-slate-700 shadow-sm"
                    style={{ 
                        padding: isSmallScreen ? 8 : 12,
                        flex: 1,
                        minHeight: 0
                    }}
                >
                    <Text 
                        className="text-slate-800 dark:text-slate-200 font-bold mb-2"
                        style={{ fontSize: isSmallScreen ? 13 : 14 }}
                    >
                        {isSmallScreen ? 'Son 14 Gün' : 'Son 30 Gün'}
                    </Text>
                    <View 
                        className="flex-row flex-wrap"
                        style={{ gap: gap }}
                    >
                        {days.map((date, index) => {
                            const dateKey = date.toISOString().split('T')[0];
                            const isToday = date.toDateString() === new Date().toDateString();
                            const dayPrayers = PRAYER_NAMES.map((p) => getPrayerStatus(date, p));
                            const missedCount = dayPrayers.filter((s) => s === 'missed').length;
                            const prayedCount = dayPrayers.filter((s) => s === 'prayed').length;

                            return (
                                <TouchableOpacity
                                    key={dateKey}
                                    onPress={() => setSelectedDate(dateKey)}
                                    style={{
                                        width: cellSize,
                                        height: cellSize,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: isToday ? 2 : 1.5,
                                        backgroundColor: isToday
                                            ? '#dbeafe'
                                            : missedCount > 0
                                            ? '#fef2f2'
                                            : prayedCount === PRAYER_NAMES.length
                                            ? '#ecfdf5'
                                            : '#f1f5f9',
                                        borderColor: isToday
                                            ? '#2563EB'
                                            : missedCount > 0
                                            ? '#fca5a5'
                                            : prayedCount === PRAYER_NAMES.length
                                            ? '#6ee7b7'
                                            : '#cbd5e1',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: isSmallScreen ? 10 : 11,
                                            fontWeight: 'bold',
                                            color: isToday
                                                ? '#1e3a8a'
                                                : missedCount > 0
                                                ? '#b91c1c'
                                                : prayedCount === PRAYER_NAMES.length
                                                ? '#047857'
                                                : '#475569',
                                        }}
                                    >
                                        {date.getDate()}
                                    </Text>
                                    {missedCount > 0 && (
                                        <View 
                                            className="absolute bg-red-500 rounded-full"
                                            style={{ 
                                                top: 2, 
                                                right: 2, 
                                                width: isSmallScreen ? 4 : 5, 
                                                height: isSmallScreen ? 4 : 5 
                                            }} 
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    
                    {/* Legend - Compact */}
                    <View 
                        className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700"
                        style={{ marginTop: 6 }}
                    >
                        <View className="flex-row items-center">
                            <View 
                                className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-600 rounded"
                                style={{ width: isSmallScreen ? 8 : 10, height: isSmallScreen ? 8 : 10, marginRight: 4 }}
                            />
                            <Text 
                                className="text-slate-600 dark:text-slate-400"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                Tümü Kılındı
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            <View 
                                className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded"
                                style={{ width: isSmallScreen ? 8 : 10, height: isSmallScreen ? 8 : 10, marginRight: 4 }}
                            />
                            <Text 
                                className="text-slate-600 dark:text-slate-400"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                Kaza Var
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            <View 
                                className="bg-blue-100 dark:bg-blue-900/30 border border-blue-600 dark:border-blue-500 rounded"
                                style={{ width: isSmallScreen ? 8 : 10, height: isSmallScreen ? 8 : 10, marginRight: 4 }}
                            />
                            <Text 
                                className="text-slate-600 dark:text-slate-400"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                Bugün
                            </Text>
                        </View>
                    </View>
                </View>

                {!location && (
                    <View 
                        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl"
                        style={{ padding: isSmallScreen ? 8 : 12, marginTop: 8 }}
                    >
                        <Text 
                            className="text-amber-800 dark:text-amber-300 font-bold mb-1"
                            style={{ fontSize: isSmallScreen ? 12 : 13 }}
                        >
                            Konum Gerekli
                        </Text>
                        <Text 
                            className="text-amber-700 dark:text-amber-400"
                            style={{ fontSize: isSmallScreen ? 10 : 11 }}
                        >
                            Kaza takibi için lütfen bir konum seçin.
                        </Text>
                    </View>
                )}
            </View>

            {/* Day Detail Modal */}
            <Modal
                visible={selectedDate !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedDate(null)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View 
                        className="bg-white dark:bg-slate-800 rounded-t-[48px] max-h-[70%]"
                        style={{ 
                            padding: isSmallScreen ? 20 : 32,
                            paddingBottom: Math.max(insets.bottom, 20)
                        }}
                    >
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-blue-900 dark:text-blue-300">
                                {selectedDayData?.date.toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    weekday: 'long',
                                })}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setSelectedDate(null)}
                                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full"
                            >
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedDayData?.prayers.map((prayer) => (
                                <View
                                    key={prayer.name}
                                    className="flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700"
                                >
                                    <Text className="text-slate-800 dark:text-slate-200 font-bold text-base">
                                        {prayer.displayName}
                                    </Text>
                                    <View className="flex-row items-center">
                                        {prayer.status === 'prayed' && (
                                            <>
                                                <CheckCircle2 size={20} color="#10b981" />
                                                <Text className="text-emerald-600 dark:text-emerald-400 font-bold ml-2">Kılındı</Text>
                                            </>
                                        )}
                                        {prayer.status === 'missed' && (
                                            <>
                                                <AlertCircle size={20} color="#ef4444" />
                                                <Text className="text-red-600 dark:text-red-400 font-bold ml-2">Kaza</Text>
                                            </>
                                        )}
                                        {prayer.status === 'future' && (
                                            <Text className="text-slate-400 dark:text-slate-500 font-medium">Henüz Vakit Gelmedi</Text>
                                        )}
                                        {prayer.status === 'pending' && (
                                            <Text className="text-amber-600 dark:text-amber-400 font-medium">Bekleniyor</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setSelectedDate(null)}
                            className="bg-blue-600 dark:bg-blue-500 py-4 rounded-2xl items-center mt-4"
                        >
                            <Text className="text-white font-bold text-base">Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
