import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { getUpcomingReligiousDays } from '../../lib/religiousDays';
import { getReligiousDayExplanation } from '../../lib/religiousDaysExplanations';
import { Calendar as CalendarIcon, ChevronRight, X, Info } from 'lucide-react-native';
import { DateTime } from 'luxon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReligiousCalendarScreen() {
    const insets = useSafeAreaInsets();
    const upcomingDays = getUpcomingReligiousDays(20);
    const [selectedDay, setSelectedDay] = useState<{ name: string; date: string } | null>(null);
    const explanation = selectedDay ? getReligiousDayExplanation(selectedDay.name) : undefined;

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <ScrollView 
                className="flex-1 p-4" 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingTop: 4, paddingBottom: Math.max(insets.bottom, 20) }}
            >
                <View className="mb-6" style={{ paddingTop: 0 }}>
                    <Text className="text-2xl font-black text-blue-900 dark:text-blue-300 mb-2">Dini Günler</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">Diyanet İşleri Başkanlığı dini günler takvimi</Text>
                </View>

                <View className="bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden shadow-sm border border-blue-50 dark:border-slate-700">
                    {upcomingDays.map((day, index) => {
                        const date = DateTime.fromISO(day.date);
                        const isToday = date.hasSame(DateTime.now(), 'day');

                        return (
                            <TouchableOpacity
                                key={`${day.date}-${day.name}`}
                                onPress={() => setSelectedDay({ name: day.name, date: day.date })}
                                activeOpacity={0.7}
                                className={`flex-row items-center p-5 ${index !== upcomingDays.length - 1 ? 'border-b border-blue-50 dark:border-slate-700' : ''} ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                <View className="bg-blue-100 dark:bg-blue-900/40 w-14 h-14 rounded-2xl items-center justify-center mr-4">
                                    <Text className="text-blue-800 dark:text-blue-300 font-black text-xl">{date.day}</Text>
                                    <Text className="text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase">{date.toFormat('MMM')}</Text>
                                </View>

                                <View className="flex-1">
                                    <Text className={`text-base font-bold ${isToday ? 'text-blue-900 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {day.name}
                                    </Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                        {date.setLocale('tr').toFormat('dd MMMM yyyy, cccc')}
                                    </Text>
                                </View>

                                <ChevronRight size={20} color="#94a3b8" className="ml-2" />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View className="mt-10 mb-20 p-6 bg-slate-100 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
                    <Text className="text-slate-800 dark:text-slate-200 font-bold mb-2 flex-row items-center">
                        <CalendarIcon size={16} color="#475569" className="dark:text-slate-400" />
                        <Text className="ml-2">Hicri Takvim</Text>
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        Dini günler ve bayramlar, Ay takvimine (Hicri Takvim) göre belirlendiği için Miladi takvimde her yıl farklı tarihlere denk gelmektedir.
                    </Text>
                </View>
            </ScrollView>

            {/* Explanation Modal */}
            <Modal
                visible={selectedDay !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedDay(null)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white dark:bg-slate-800 rounded-t-[48px] p-8" style={{ maxHeight: '85%', paddingBottom: Math.max(insets.bottom, 34) }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-1">
                                <Text className="text-2xl font-black text-blue-900 dark:text-blue-300 mb-1">
                                    {selectedDay?.name}
                                </Text>
                                {selectedDay && (
                                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                                        {DateTime.fromISO(selectedDay.date).setLocale('tr').toFormat('dd MMMM yyyy, cccc')}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => setSelectedDay(null)}
                                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full"
                            >
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {explanation ? (
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '60%' }}>
                                <View className="mb-6">
                                    <View className="flex-row items-center mb-3">
                                        <Info size={18} color="#2563EB" />
                                        <Text className="text-blue-900 dark:text-blue-300 font-bold text-lg ml-2">Açıklama</Text>
                                    </View>
                                    <Text className="text-slate-700 dark:text-slate-300 text-base leading-6">
                                        {explanation.description}
                                    </Text>
                                </View>

                                <View className="mb-6">
                                    <View className="flex-row items-center mb-3">
                                        <CalendarIcon size={18} color="#10b981" />
                                        <Text className="text-emerald-700 dark:text-emerald-400 font-bold text-lg ml-2">Önemi</Text>
                                    </View>
                                    <Text className="text-slate-700 dark:text-slate-300 text-base leading-6">
                                        {explanation.significance}
                                    </Text>
                                </View>
                            </ScrollView>
                        ) : (
                            <View className="py-8">
                                <Text className="text-slate-500 dark:text-slate-400 text-center">
                                    Bu gün hakkında detaylı bilgi bulunmamaktadır.
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => setSelectedDay(null)}
                            className="bg-blue-600 dark:bg-blue-500 py-4 rounded-2xl items-center mt-4"
                            style={{ marginBottom: Math.max(insets.bottom, 8) }}
                        >
                            <Text className="text-white font-bold text-base">Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
