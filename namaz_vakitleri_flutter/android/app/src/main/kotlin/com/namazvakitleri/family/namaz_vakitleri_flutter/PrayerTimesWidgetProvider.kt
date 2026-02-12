package com.namazvakitleri.family.namaz_vakitleri_flutter

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * Home screen widget provider for prayer times.
 * Flutter calls HomeWidget.updateWidget(androidName: "PrayerTimesWidgetProvider");
 * androidName must match this class's simple name; manifest receiver is .PrayerTimesWidgetProvider.
 * Reads SharedPreferences("FlutterHomeWidget") including last_updated (HH:mm:ss) for debug.
 * When city or fajr is missing (e.g. fresh install), shows empty state and tap-to-open.
 */
class PrayerTimesWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_prayer_times)
            val prefs = context.getSharedPreferences("FlutterHomeWidget", Context.MODE_PRIVATE)
            val city = prefs.getString("city", null).orEmpty().trim()
            val fajr = prefs.getString("fajr", null).orEmpty().trim()
            val isEmpty = city.isEmpty() || fajr.isEmpty()

            if (isEmpty) {
                views.setTextViewText(R.id.widget_next_time, "Uygulamayı açın ve konum seçin")
                views.setTextViewText(R.id.widget_next_label, "Dokunun: uygulamayı açın")
                views.setTextViewText(R.id.widget_context, "")
                views.setTextViewText(R.id.widget_last_updated, "")
                val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                    ?: Intent(Intent.ACTION_MAIN).apply {
                        addCategory(Intent.CATEGORY_LAUNCHER)
                        setPackage(context.packageName)
                    }
                val pending = PendingIntent.getActivity(
                    context,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pending)
            } else {
                val date = prefs.getString("date", null) ?: ""
                val nextPrayer = prefs.getString("next_prayer_name", null) ?: ""
                val nextTime = prefs.getString("next_prayer_time", null) ?: ""
                val lastUpdated = prefs.getString("last_updated", null) ?: ""
                views.setTextViewText(R.id.widget_next_time, if (nextTime.isNotEmpty()) nextTime else "—")
                views.setTextViewText(
                    R.id.widget_next_label,
                    if (nextPrayer.isNotEmpty()) "Sonraki: $nextPrayer" else "—"
                )
                val contextLine = if (date.isNotEmpty()) "$city • $date" else city
                views.setTextViewText(R.id.widget_context, contextLine)
                views.setTextViewText(
                    R.id.widget_last_updated,
                    if (lastUpdated.isNotEmpty()) "Güncellendi: $lastUpdated" else "—"
                )
                views.setOnClickPendingIntent(R.id.widget_root, null)
            }
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
