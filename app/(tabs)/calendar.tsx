import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { getUpcomingReligiousDays } from '../../lib/religiousDays';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react-native';
import { DateTime } from 'luxon';

export default function ReligiousCalendarScreen() {
    const upcomingDays = getUpcomingReligiousDays(20);

    return (
        <View className="flex-1 bg-slate-50">
            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <View className="mb-6">
                    <Text className="text-2xl font-black text-blue-900 mb-2">Dini Günler</Text>
                    <Text className="text-slate-500 text-sm">Diyanet İşleri Başkanlığı dini günler takvimi</Text>
                </View>

                <View className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-blue-50">
                    {upcomingDays.map((day, index) => {
                        const date = DateTime.fromISO(day.date);
                        const isToday = date.hasSame(DateTime.now(), 'day');

                        return (
                            <View
                                key={`${day.date}-${day.name}`}
                                className={`flex-row items-center p-5 ${index !== upcomingDays.length - 1 ? 'border-b border-blue-50' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                            >
                                <View className="bg-blue-100 w-14 h-14 rounded-2xl items-center justify-center mr-4">
                                    <Text className="text-blue-800 font-black text-xl">{date.day}</Text>
                                    <Text className="text-blue-600 font-bold text-[10px] uppercase">{date.toFormat('MMM')}</Text>
                                </View>

                                <View className="flex-1">
                                    <Text className={`text-base font-bold ${isToday ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {day.name}
                                    </Text>
                                    <Text className="text-slate-500 text-xs mt-0.5">
                                        {date.setLocale('tr').toFormat('dd MMMM yyyy, cccc')}
                                    </Text>
                                </View>

                                <TouchableOpacity className="ml-2">
                                    <ChevronRight size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <View className="mt-10 mb-20 p-6 bg-slate-100 rounded-3xl border border-slate-200">
                    <Text className="text-slate-800 font-bold mb-2 flex-row items-center">
                        <CalendarIcon size={16} color="#475569" /> Hicri Takvim
                    </Text>
                    <Text className="text-slate-600 text-sm leading-relaxed">
                        Dini günler ve bayramlar, Ay takvimine (Hicri Takvim) göre belirlendiği için Miladi takvimde her yıl farklı tarihlere denk gelmektedir.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
