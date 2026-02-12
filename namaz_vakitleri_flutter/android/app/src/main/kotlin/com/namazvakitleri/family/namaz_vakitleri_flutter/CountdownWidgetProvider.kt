package com.namazvakitleri.family.namaz_vakitleri_flutter

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

/**
 * Countdown widget: shows time until next prayer and next prayer name/time.
 * Reads same FlutterHomeWidget SharedPreferences as PrayerTimesWidgetProvider.
 */
class CountdownWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        val prefs = context.getSharedPreferences("FlutterHomeWidget", Context.MODE_PRIVATE)
        val timeUntilMs = prefs.getString("time_until_next_ms", null)?.toLongOrNull() ?: -1L
        val nextPrayer = prefs.getString("next_prayer_name", null) ?: ""
        val nextTime = prefs.getString("next_prayer_time", null) ?: ""

        val countdownText = when {
            timeUntilMs < 0 -> "—"
            timeUntilMs == 0L -> "Şimdi"
            else -> formatCountdown(timeUntilMs)
        }

        val nextLine = when {
            nextPrayer.isEmpty() -> "—"
            nextTime.isNotEmpty() -> "Sonraki: $nextPrayer $nextTime"
            else -> "Sonraki: $nextPrayer"
        }

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_countdown)
            views.setTextViewText(R.id.widget_countdown_time, countdownText)
            views.setTextViewText(R.id.widget_countdown_next, nextLine)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private fun formatCountdown(ms: Long): String {
        val totalSeconds = (ms / 1000).toInt()
        val hours = totalSeconds / 3600
        val minutes = (totalSeconds % 3600) / 60
        val seconds = totalSeconds % 60
        return when {
            hours > 0 -> "%d:%02d:%02d".format(hours, minutes, seconds)
            else -> "%02d:%02d".format(minutes, seconds)
        }
    }
}
