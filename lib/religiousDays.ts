export interface ReligiousDay {
    date: string; // YYYY-MM-DD
    name: string;
    description?: string;
}

export const religiousDays: ReligiousDay[] = [
    // 2025 Religious Days (Diyanet)
    { date: '2025-01-01', name: 'Üç Ayların Başlangıcı' },
    { date: '2025-01-02', name: 'Regaip Kandili' },
    { date: '2025-01-26', name: 'Miraç Kandili' },
    { date: '2025-02-13', name: 'Berat Kandili' },
    { date: '2025-03-01', name: 'Ramazan Başlangıcı' },
    { date: '2025-03-26', name: 'Kadir Gecesi' },
    { date: '2025-03-30', name: 'Ramazan Bayramı 1. Gün' },
    { date: '2025-03-31', name: 'Ramazan Bayramı 2. Gün' },
    { date: '2025-04-01', name: 'Ramazan Bayramı 3. Gün' },
    { date: '2025-06-05', name: 'Arife' },
    { date: '2025-06-06', name: 'Kurban Bayramı 1. Gün' },
    { date: '2025-06-07', name: 'Kurban Bayramı 2. Gün' },
    { date: '2025-06-08', name: 'Kurban Bayramı 3. Gün' },
    { date: '2025-06-09', name: 'Kurban Bayramı 4. Gün' },
    { date: '2025-06-26', name: 'Hicri Yılbaşı' },
    { date: '2025-07-05', name: 'Aşure Günü' },
    { date: '2025-09-04', name: 'Mevlid Kandili' },

    // 2026 Religious Days (Diyanet)
    { date: '2026-12-21', name: 'Üç Ayların Başlangıcı' },
    { date: '2026-12-24', name: 'Regaip Kandili' },
    { date: '2026-01-16', name: 'Miraç Kandili' }, // Check Miraç 2026
    { date: '2026-02-02', name: 'Berat Kandili' },
    { date: '2026-02-18', name: 'Ramazan Başlangıcı' },
    { date: '2026-03-15', name: 'Kadir Gecesi' },
    { date: '2026-03-20', name: 'Ramazan Bayramı 1. Gün' },
    { date: '2026-03-21', name: 'Ramazan Bayramı 2. Gün' },
    { date: '2026-03-22', name: 'Ramazan Bayramı 3. Gün' },
    { date: '2026-05-26', name: 'Arife' },
    { date: '2026-05-27', name: 'Kurban Bayramı 1. Gün' },
    { date: '2026-05-28', name: 'Kurban Bayramı 2. Gün' },
    { date: '2026-05-29', name: 'Kurban Bayramı 3. Gün' },
    { date: '2026-05-30', name: 'Kurban Bayramı 4. Gün' },
    { date: '2026-06-16', name: 'Hicri Yılbaşı' },
    { date: '2026-06-25', name: 'Aşure Günü' },
    { date: '2026-08-25', name: 'Mevlid Kandili' },
];

export function getUpcomingReligiousDays(limit: number = 5): ReligiousDay[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return religiousDays
        .filter(day => new Date(day.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, limit);
}

export function isSpecialReligiousDay(date: Date): ReligiousDay | undefined {
    const dateStr = date.toISOString().split('T')[0];
    return religiousDays.find(day => day.date === dateStr);
}
