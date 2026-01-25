/**
 * Widget rendering unit tests.
 * Renders the actual widget components with FlexWidget/TextWidget mocked as
 * inspectable View/Text so we can assert on rendered text and styles.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import type { WidgetTheme } from '../lib/widget-bridge';

// Capture root background color for theme assertion
let lastRootBackgroundColor: string | undefined;

jest.mock('react-native-android-widget', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    FlexWidget: function FlexWidget(props: { children?: React.ReactNode; style?: Record<string, unknown> }) {
      const { style, children } = props;
      if (style && typeof style === 'object' && 'backgroundColor' in style) {
        lastRootBackgroundColor = style.backgroundColor as string;
      }
      return React.createElement(View, { testID: 'flex', style }, children);
    },
    TextWidget: function TextWidget(props: { text?: string }) {
      return React.createElement(Text, { testID: 'text' }, props.text ?? '');
    },
  };
});

describe('PrayerTimesWidget', () => {
  beforeEach(() => {
    lastRootBackgroundColor = undefined;
  });

  const renderWidget = (props: {
    city?: string | null;
    date?: string | null;
    hijriDate?: string | null;
    nextPrayerName?: string | null;
    nextPrayerTime?: string | null;
    theme?: WidgetTheme;
  }) => {
    const { PrayerTimesWidget } = require('../widgets/PrayerTimesWidget');
    const el = React.createElement(PrayerTimesWidget, {
      city: props.city ?? null,
      date: props.date ?? '',
      hijriDate: props.hijriDate ?? '',
      nextPrayerName: props.nextPrayerName ?? '',
      nextPrayerTime: props.nextPrayerTime ?? '',
      theme: props.theme ?? 'light',
    });
    return render(el);
  };

  it('renders empty state: "Konum Seçin" when city is null/empty', () => {
    renderWidget({ city: null, nextPrayerName: '', nextPrayerTime: '' });
    expect(screen.getByText('KONUM SEÇİN')).toBeTruthy();
  });

  it('renders populated state: shows next prayer name and time (Fajr, 05:00)', () => {
    renderWidget({
      city: 'Istanbul',
      date: '15 Haziran 2025',
      nextPrayerName: 'Fajr',
      nextPrayerTime: '05:00',
    });
    expect(screen.getByText('Fajr')).toBeTruthy();
    expect(screen.getByText('05:00')).toBeTruthy();
  });

  it('next prayer logic: shows İkindi/Asr when that is the next prayer', () => {
    renderWidget({
      city: 'Ankara',
      nextPrayerName: 'İkindi',
      nextPrayerTime: '16:30',
    });
    expect(screen.getByText('İkindi')).toBeTruthy();
    expect(screen.getByText('16:30')).toBeTruthy();
  });

  it('theme dark: root background is Slate-900 (#0f172a)', () => {
    renderWidget({
      city: 'Test',
      nextPrayerName: 'Maghrib',
      nextPrayerTime: '20:00',
      theme: 'dark',
    });
    expect(lastRootBackgroundColor).toBe('#0f172a');
  });
});

describe('DailyScheduleWidget', () => {
  it('renders schedule with next prayer İkindi and time 16:30', () => {
    const { DailyScheduleWidget } = require('../widgets/DailyScheduleWidget');
    const el = React.createElement(DailyScheduleWidget, {
      prayerTimes: {
        fajr: '05:00',
        sunrise: '06:30',
        dhuhr: '13:00',
        asr: '16:30',
        maghrib: '20:00',
        isha: '21:30',
      },
      nextPrayer: 'asr',
      theme: 'light',
    });
    const { getByText } = render(el);
    expect(getByText('İkindi')).toBeTruthy();
    expect(getByText('16:30')).toBeTruthy();
  });
});
