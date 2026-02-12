package com.namazvakitleri.family.namaz_vakitleri_flutter

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

/**
 * Schedule widget: shows today's full prayer times (Fajr through Isha).
 * Reads same FlutterHomeWidget SharedPreferences as other widgets.
 */
class ScheduleWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        val prefs = context.getSharedPreferences("FlutterHomeWidget", Context.MODE_PRIVATE)
        val city = prefs.getString("city", null) ?: "—"
        val date = prefs.getString("date", null) ?: ""
        val contextLine = if (date.isNotEmpty()) "$city • $date" else city

        fun time(key: String) = prefs.getString(key, null) ?: "—"

        val fajr = "Fajr: ${time("fajr")}"
        val sunrise = "Güneş: ${time("sunrise")}"
        val dhuhr = "Öğle: ${time("dhuhr")}"
        val asr = "İkindi: ${time("asr")}"
        val maghrib = "Akşam: ${time("maghrib")}"
        val isha = "Yatsı: ${time("isha")}"

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_schedule)
            views.setTextViewText(R.id.widget_schedule_context, contextLine)
            views.setTextViewText(R.id.widget_schedule_fajr, fajr)
            views.setTextViewText(R.id.widget_schedule_sunrise, sunrise)
            views.setTextViewText(R.id.widget_schedule_dhuhr, dhuhr)
            views.setTextViewText(R.id.widget_schedule_asr, asr)
            views.setTextViewText(R.id.widget_schedule_maghrib, maghrib)
            views.setTextViewText(R.id.widget_schedule_isha, isha)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
