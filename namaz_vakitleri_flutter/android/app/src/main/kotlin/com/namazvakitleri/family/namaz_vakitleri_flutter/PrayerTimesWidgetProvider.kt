package com.namazvakitleri.family.namaz_vakitleri_flutter

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

/**
 * Home screen widget provider for prayer times.
 * Flutter app updates data via home_widget; this provider is registered so
 * HomeWidget.updateWidget(androidName: "PrayerTimesWidgetProvider") can find it.
 */
class PrayerTimesWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_prayer_times)
            // home_widget stores data in SharedPreferences; key format is the id passed from Flutter
            val prefs = context.getSharedPreferences("FlutterHomeWidget", Context.MODE_PRIVATE)
            val city = prefs.getString("city", null) ?: "—"
            val nextPrayer = prefs.getString("next_prayer_name", null) ?: ""
            val nextTime = prefs.getString("next_prayer_time", null) ?: ""
            views.setTextViewText(R.id.widget_city, city)
            views.setTextViewText(
                R.id.widget_next_label,
                if (nextPrayer.isNotEmpty()) "Sonraki: $nextPrayer $nextTime" else "—"
            )
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
