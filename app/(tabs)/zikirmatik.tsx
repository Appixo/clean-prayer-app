import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store/useStore';
import { RotateCcw, Target, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

interface ZikirmatikHistory {
    date: string; // YYYY-MM-DD
    count: number;
}

export default function ZikirmatikScreen() {
    const [count, setCount] = useState(0);
    const [sessionStart, setSessionStart] = useState<Date | null>(null);
    const [history, setHistory] = useState<ZikirmatikHistory[]>([]);
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const systemColorScheme = useColorScheme();
    const theme = useStore((state) => state.theme);
    const actualColorScheme = theme === 'system' ? (systemColorScheme || 'light') : theme;
    const isDark = actualColorScheme === 'dark';
    
    // Load history from store
    const zikirmatikHistory = useStore((state) => state.zikirmatikHistory || {});
    
    useEffect(() => {
        // Convert store history to array format
        const historyArray: ZikirmatikHistory[] = Object.entries(zikirmatikHistory)
            .map(([date, count]) => ({ date, count: count as number }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3); // Show only last 3 days to fit on screen
        setHistory(historyArray);
    }, [zikirmatikHistory]);

    const handleTap = () => {
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        if (count === 0) {
            setSessionStart(new Date());
        }
        
        setCount(count + 1);
    };

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCount(0);
        setSessionStart(null);
    };

    const handleQuickSet = (target: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCount(target);
        if (count === 0) {
            setSessionStart(new Date());
        }
    };

    const handleSave = () => {
        if (count === 0) return;
        
        const today = new Date().toISOString().split('T')[0];
        const currentHistory = useStore.getState().zikirmatikHistory || {};
        const todayCount = (currentHistory[today] || 0) as number;
        
        useStore.getState().updateZikirmatikHistory(today, todayCount + count);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleReset();
        
        // Refresh history
        const updatedHistory = useStore.getState().zikirmatikHistory || {};
        const historyArray: ZikirmatikHistory[] = Object.entries(updatedHistory)
            .map(([date, count]) => ({ date, count: count as number }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 7);
        setHistory(historyArray);
    };

    const totalThisWeek = history.reduce((sum, day) => sum + day.count, 0);
    
    // Calculate available height (screen height minus safe areas and padding)
    const availableHeight = screenHeight - insets.top - insets.bottom - 100; // 100 for tab bar and padding
    const isSmallScreen = screenHeight < 700;

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <View 
                style={{ 
                    flex: 1, 
                    paddingHorizontal: 20,
                    paddingTop: 4, // Minimal top padding since header is shown
                    paddingBottom: Math.max(insets.bottom, 20),
                    justifyContent: 'space-between'
                }}
            >
                {/* Header - Compact */}
                <View style={{ alignItems: 'center', paddingTop: 0, paddingBottom: isSmallScreen ? 4 : 6 }}>
                    <Text 
                        className="font-black text-blue-900 dark:text-blue-300"
                        style={{ fontSize: isSmallScreen ? 20 : 24, marginBottom: 2 }}
                    >
                        Zikirmatik
                    </Text>
                    <Text 
                        className="text-slate-500 dark:text-slate-400"
                        style={{ fontSize: isSmallScreen ? 10 : 11 }}
                    >
                        Subhanallah, Alhamdulillah, Allahu Akbar
                    </Text>
                </View>

                {/* Counter Display - Flexible but constrained */}
                <View 
                    className="bg-white dark:bg-slate-800 rounded-[32px] items-center shadow-lg border border-blue-100 dark:border-slate-700"
                    style={{ 
                        padding: isSmallScreen ? 16 : 24,
                        minHeight: isSmallScreen ? 100 : 120,
                        justifyContent: 'center'
                    }}
                >
                    <Text 
                        className="font-black text-blue-900 dark:text-blue-300"
                        style={{ 
                            fontSize: isSmallScreen ? 56 : 72,
                            marginBottom: isSmallScreen ? 4 : 8
                        }}
                    >
                        {count}
                    </Text>
                    <Text className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">
                        {count === 0 ? 'Başlamak için dokunun' : 'Zikir Sayısı'}
                    </Text>
                </View>

                {/* Main Counter Button - Responsive size */}
                <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    <TouchableOpacity
                        onPress={handleTap}
                        className="bg-blue-600 rounded-full items-center justify-center shadow-2xl active:bg-blue-700"
                        style={{
                            width: isSmallScreen ? screenHeight * 0.25 : screenHeight * 0.3,
                            height: isSmallScreen ? screenHeight * 0.25 : screenHeight * 0.3,
                            maxWidth: 200,
                            maxHeight: 200,
                            minWidth: 140,
                            minHeight: 140,
                            shadowColor: '#2563EB',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 16,
                            elevation: 12,
                        }}
                    >
                        <Text 
                            className="text-white font-black"
                            style={{ fontSize: isSmallScreen ? 18 : 22 }}
                        >
                            DOKUN
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Set Buttons - Fixed height */}
                <View 
                    className="flex-row gap-2"
                    style={{ marginTop: isSmallScreen ? 8 : 12, marginBottom: 8 }}
                >
                    <TouchableOpacity
                        onPress={() => handleQuickSet(33)}
                        className="flex-1 bg-blue-50 dark:bg-blue-900/30 rounded-2xl items-center border border-blue-100 dark:border-blue-800"
                        style={{ paddingVertical: isSmallScreen ? 10 : 12 }}
                    >
                        <Target size={18} color="#2563EB" />
                        <Text className="text-blue-700 dark:text-blue-400 font-bold mt-1" style={{ fontSize: 12 }}>33</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleQuickSet(99)}
                        className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl items-center border border-emerald-100 dark:border-emerald-800"
                        style={{ paddingVertical: isSmallScreen ? 10 : 12 }}
                    >
                        <Target size={18} color="#10b981" />
                        <Text className="text-emerald-700 dark:text-emerald-400 font-bold mt-1" style={{ fontSize: 12 }}>99</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleQuickSet(100)}
                        className="flex-1 bg-amber-50 dark:bg-amber-900/30 rounded-2xl items-center border border-amber-100 dark:border-amber-800"
                        style={{ paddingVertical: isSmallScreen ? 10 : 12 }}
                    >
                        <Target size={18} color="#f59e0b" />
                        <Text className="text-amber-700 dark:text-amber-400 font-bold mt-1" style={{ fontSize: 12 }}>100</Text>
                    </TouchableOpacity>
                </View>

                {/* Action Buttons - Fixed height */}
                <View 
                    className="flex-row gap-2"
                    style={{ marginBottom: 8 }}
                >
                    <TouchableOpacity
                        onPress={handleReset}
                        className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-2xl items-center flex-row justify-center"
                        style={{ paddingVertical: isSmallScreen ? 10 : 12 }}
                    >
                        <RotateCcw size={16} color="#64748b" />
                        <Text className="text-slate-700 dark:text-slate-300 font-bold ml-2" style={{ fontSize: 13 }}>Sıfırla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={count === 0}
                        className={`flex-1 rounded-2xl items-center flex-row justify-center ${count === 0 ? 'bg-slate-200 dark:bg-slate-700' : 'bg-emerald-600 dark:bg-emerald-500'}`}
                        style={{ paddingVertical: isSmallScreen ? 10 : 12 }}
                    >
                        <TrendingUp size={16} color={count === 0 ? '#94a3b8' : 'white'} />
                        <Text 
                            className={`font-bold ml-2 ${count === 0 ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`}
                            style={{ fontSize: 13 }}
                        >
                            Kaydet
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* History Section - Compact, always visible but smaller on small screens */}
                {history.length > 0 && (
                    <View 
                        className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-blue-50 dark:border-slate-700"
                        style={{ 
                            padding: isSmallScreen ? 8 : 10,
                            marginTop: isSmallScreen ? 4 : 6
                        }}
                    >
                        <View className="flex-row items-center justify-between mb-1">
                            <Text 
                                className="text-blue-900 dark:text-blue-300 font-black"
                                style={{ fontSize: isSmallScreen ? 11 : 12 }}
                            >
                                Geçmiş
                            </Text>
                            <Text 
                                className="text-slate-500 dark:text-slate-400"
                                style={{ fontSize: isSmallScreen ? 9 : 10 }}
                            >
                                Bu Hafta: <Text className="font-bold text-blue-600 dark:text-blue-400">{totalThisWeek}</Text>
                            </Text>
                        </View>
                        {history.slice(0, isSmallScreen ? 1 : 2).map((day, index) => {
                            const date = new Date(day.date);
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                                <View
                                    key={day.date}
                                    className={`flex-row items-center justify-between ${index !== history.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                                    style={{ paddingVertical: isSmallScreen ? 4 : 5 }}
                                >
                                    <View>
                                        <Text 
                                            className="text-slate-800 dark:text-slate-200 font-bold"
                                            style={{ fontSize: isSmallScreen ? 10 : 11 }}
                                        >
                                            {isToday ? 'Bugün' : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                        </Text>
                                    </View>
                                    <Text 
                                        className="text-blue-600 dark:text-blue-400 font-black"
                                        style={{ fontSize: isSmallScreen ? 12 : 13 }}
                                    >
                                        {day.count}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
}
