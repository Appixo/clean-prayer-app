import '../../domain/entities/religious_day.dart';

/// Diyanet religious days (bundled). Sorted by date for display.
List<ReligiousDay> get religiousDaysList => List.unmodifiable(_religiousDays);

final List<ReligiousDay> _religiousDays = [
  // 2025 Religious Days (Diyanet)
  ReligiousDay(date: '2025-01-01', name: 'Üç Ayların Başlangıcı'),
  ReligiousDay(date: '2025-01-02', name: 'Regaip Kandili'),
  ReligiousDay(date: '2025-01-26', name: 'Miraç Kandili'),
  ReligiousDay(date: '2025-02-13', name: 'Berat Kandili'),
  ReligiousDay(date: '2025-03-01', name: 'Ramazan Başlangıcı'),
  ReligiousDay(date: '2025-03-26', name: 'Kadir Gecesi'),
  ReligiousDay(date: '2025-03-30', name: 'Ramazan Bayramı 1. Gün'),
  ReligiousDay(date: '2025-03-31', name: 'Ramazan Bayramı 2. Gün'),
  ReligiousDay(date: '2025-04-01', name: 'Ramazan Bayramı 3. Gün'),
  ReligiousDay(date: '2025-06-05', name: 'Arife'),
  ReligiousDay(date: '2025-06-06', name: 'Kurban Bayramı 1. Gün'),
  ReligiousDay(date: '2025-06-07', name: 'Kurban Bayramı 2. Gün'),
  ReligiousDay(date: '2025-06-08', name: 'Kurban Bayramı 3. Gün'),
  ReligiousDay(date: '2025-06-09', name: 'Kurban Bayramı 4. Gün'),
  ReligiousDay(date: '2025-06-26', name: 'Hicri Yılbaşı'),
  ReligiousDay(date: '2025-07-05', name: 'Aşure Günü'),
  ReligiousDay(date: '2025-09-04', name: 'Mevlid Kandili'),
  // 2026 Religious Days (Diyanet)
  ReligiousDay(date: '2026-01-16', name: 'Miraç Kandili'),
  ReligiousDay(date: '2026-02-02', name: 'Berat Kandili'),
  ReligiousDay(date: '2026-02-18', name: 'Ramazan Başlangıcı'),
  ReligiousDay(date: '2026-03-15', name: 'Kadir Gecesi'),
  ReligiousDay(date: '2026-03-20', name: 'Ramazan Bayramı 1. Gün'),
  ReligiousDay(date: '2026-03-21', name: 'Ramazan Bayramı 2. Gün'),
  ReligiousDay(date: '2026-03-22', name: 'Ramazan Bayramı 3. Gün'),
  ReligiousDay(date: '2026-05-26', name: 'Arife'),
  ReligiousDay(date: '2026-05-27', name: 'Kurban Bayramı 1. Gün'),
  ReligiousDay(date: '2026-05-28', name: 'Kurban Bayramı 2. Gün'),
  ReligiousDay(date: '2026-05-29', name: 'Kurban Bayramı 3. Gün'),
  ReligiousDay(date: '2026-05-30', name: 'Kurban Bayramı 4. Gün'),
  ReligiousDay(date: '2026-06-16', name: 'Hicri Yılbaşı'),
  ReligiousDay(date: '2026-06-25', name: 'Aşure Günü'),
  ReligiousDay(date: '2026-08-25', name: 'Mevlid Kandili'),
  ReligiousDay(date: '2026-12-21', name: 'Üç Ayların Başlangıcı'),
  ReligiousDay(date: '2026-12-24', name: 'Regaip Kandili'),
];

/// All religious days sorted by date (for Dini Günler list).
List<ReligiousDay> getAllReligiousDaysSorted() {
  final list = List<ReligiousDay>.from(_religiousDays);
  list.sort((a, b) => a.date.compareTo(b.date));
  return list;
}

/// Upcoming religious days from today, limited.
List<ReligiousDay> getUpcomingReligiousDays({int limit = 5}) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final list = getAllReligiousDaysSorted().where((day) {
    final parts = day.date.split('-');
    if (parts.length != 3) return false;
    final d = DateTime(
      int.parse(parts[0]),
      int.parse(parts[1]),
      int.parse(parts[2]),
    );
    return d.isAfter(today) || d.isAtSameMomentAs(today);
  }).toList();
  return list.take(limit).toList();
}
