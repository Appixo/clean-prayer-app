import 'package:hijri/hijri_calendar.dart';

/// Formats a [DateTime] as a short Hijri date string (e.g. "15 Ramadan 1446").
String formatHijriDate(DateTime date) {
  try {
    final h = HijriCalendar.fromDate(date);
    return '${h.hDay} ${h.getLongMonthName()} ${h.hYear}';
  } catch (_) {
    return '';
  }
}

/// Current date in Hijri format.
String get currentHijriDate => formatHijriDate(DateTime.now());
