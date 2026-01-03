import { storageService } from './storage';
import { Settings } from 'luxon';

export type Language = 'en' | 'tr';

export interface Translations {
  // Common
  location: string;
  manualLocation: string;
  unknownLocation: string;
  currentLocation: string;
  today: string;
  tomorrow: string;
  yesterday: string;
  nextPrayer: string;
  prayerTimes: string;
  qiblaDirection: string;
  settings: string;
  about: string;
  error: string;

  // Prayer names
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;

  // Time
  timeUntil: string;
  hours: string;
  minutes: string;
  seconds: string;
  day: string;
  days: string;

  // Settings
  calculationMethod: string;
  asrCalculation: string;
  standard: string;
  hanafi: string;
  highLatitudeRule: string;
  manualLocationOverride: string;
  enterCoordinates: string;
  latitude: string;
  longitude: string;
  save: string;
  clear: string;
  timeFormat: string;
  hour12: string;
  hour24: string;
  theme: string;
  light: string;
  dark: string;
  system: string;

  // About
  version: string;
  privacy: string;
  noTracking: string;
  noAnalytics: string;
  noAds: string;
  allCalculationsOffline: string;
  credits: string;
  prayerTimeCalculations: string;
  features: string;
  offlinePrayerTimeCalculations: string;
  multipleCalculationMethods: string;
  hijriDateDisplay: string;
  qiblaDirectionIndicator: string;
  manualLocationOverrideFeature: string;
  timeFormatFeature: string;
  darkLightThemeSupport: string;
  license: string;
  providedAsIs: string;

  // Days
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;

  // High latitude rules
  middleOfTheNight: string;
  seventhOfTheNight: string;
  twilightAngle: string;

  // Qibla
  webStaticAngle: string;
  nativeCompass: string;
  alignPhone: string;

  // Validation
  invalidInput: string;
  invalidLatitude: string;
  invalidLongitude: string;
  latitudeRange: string;
  longitudeRange: string;
  success: string;
  manualLocationSaved: string;
  manualLocationCleared: string;

  // Loading
  loadingPrayerTimes: string;
  calculatingNextPrayer: string;
  searching: string;

  // Settings - Additional
  languageLabel: string;
  citySearchPlaceholder: string;
  searchDescription: string;
  searchAndSave: string;
  returnToAutoLocation: string;
  calculationMethodTurkey: string;
  cityNotFound: string;
  networkError: string;
  searchError: string;
  locationSetTo: string;
  selectLocation: string;
  noResultsFound: string;

  // Hijri Months
  muharram: string;
  safar: string;
  rabiAlAwwal: string;
  rabiAlThani: string;
  jumadaAlUla: string;
  jumadaAlThani: string;
  rajab: string;
  shaban: string;
  ramadan: string;
  shawwal: string;
  dhuAlQidah: string;
  dhuAlHijjah: string;
  hijriYearSuffix: string;
  jumuah: string;
  district: string;
  province: string;
  region: string;
  city: string;
  town: string;
  village: string;
  itsTimeFor: string;
  notificationSound: string;
  playAdhanSound: string;
  playPreview: string;
  simulatePrayer: string;
  simulationTriggered: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  setupLocation: string;
}

const translations: Record<Language, Translations> = {
  en: {
    location: 'Location',
    manualLocation: 'Manual Location',
    unknownLocation: 'Unknown Location',
    currentLocation: 'Current Location',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    nextPrayer: 'Next Prayer',
    prayerTimes: 'Prayer Times',
    qiblaDirection: 'Qibla Direction',
    settings: 'Settings',
    about: 'About',
    error: 'Error',
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    timeUntil: 'Time until',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    day: 'day',
    days: 'days',
    calculationMethod: 'Calculation Method',
    asrCalculation: 'Asr Calculation',
    standard: 'Standard',
    hanafi: 'Hanafi',
    highLatitudeRule: 'High Latitude Rule',
    manualLocationOverride: 'Manual Location Override',
    enterCoordinates: 'Enter coordinates to override device location',
    latitude: 'Latitude (-90 to 90)',
    longitude: 'Longitude (-180 to 180)',
    save: 'Save',
    clear: 'Clear',
    timeFormat: 'Time Format',
    hour12: '12 Hour',
    hour24: '24 Hour',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    version: 'Version',
    privacy: 'Privacy',
    noTracking: 'No tracking',
    noAnalytics: 'No analytics',
    noAds: 'No ads',
    allCalculationsOffline: 'All calculations done offline',
    credits: 'Credits',
    prayerTimeCalculations: 'Prayer time calculations powered by:',
    features: 'Features',
    offlinePrayerTimeCalculations: 'Offline prayer time calculations',
    multipleCalculationMethods: 'Multiple calculation methods',
    hijriDateDisplay: 'Hijri date display with adjustment',
    qiblaDirectionIndicator: 'Qibla direction indicator',
    manualLocationOverrideFeature: 'Manual location override',
    timeFormatFeature: '12h/24h time format',
    darkLightThemeSupport: 'Dark/Light theme support',
    license: 'License',
    providedAsIs: 'This app is provided as-is for personal use. May Allah accept this as sadaqah jariyah.',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    middleOfTheNight: 'Middle of the Night',
    seventhOfTheNight: 'Seventh of the Night',
    twilightAngle: 'Twilight Angle',
    webStaticAngle: '(Web: Static angle. Native: Compass will be used)',
    nativeCompass: 'Native: Compass will be used',
    alignPhone: 'Align arrow with the Qibla',
    invalidInput: 'Invalid Input',
    invalidLatitude: 'Invalid Latitude',
    invalidLongitude: 'Invalid Longitude',
    latitudeRange: 'Latitude must be between -90 and 90.',
    longitudeRange: 'Longitude must be between -180 and 180.',
    success: 'Success',
    manualLocationSaved: 'Manual location saved.',
    manualLocationCleared: 'Manual location cleared. Using device location.',
    loadingPrayerTimes: 'Loading prayer times...',
    calculatingNextPrayer: 'Calculating next prayer...',
    searching: 'Searching...',
    languageLabel: 'Language',
    citySearchPlaceholder: 'Enter city name...',
    searchDescription: 'Search by city name (e.g., "Rotterdam", "London")',
    searchAndSave: 'Search & Save',
    returnToAutoLocation: 'Return to Auto-Location',
    calculationMethodTurkey: 'Diyanet İşleri Başkanlığı, Turkey',
    cityNotFound: 'No cities found. Please try a different search term.',
    networkError: 'Check Internet Connection',
    searchError: 'Could not search for city. Please try again.',
    locationSetTo: 'Location set to',
    selectLocation: 'Select Location',
    noResultsFound: 'No cities found',
    muharram: 'Muharram',
    safar: 'Safar',
    rabiAlAwwal: "Rabi' al-Awwal",
    rabiAlThani: "Rabi' al-Thani",
    jumadaAlUla: 'Jumada al-Ula',
    jumadaAlThani: 'Jumada al-Thani',
    rajab: 'Rajab',
    shaban: "Sha'ban",
    ramadan: 'Ramadan',
    shawwal: 'Shawwal',
    dhuAlQidah: "Dhu al-Qi'dah",
    dhuAlHijjah: 'Dhu al-Hijjah',
    hijriYearSuffix: 'AH',
    jumuah: 'Jumuah',
    district: 'District',
    province: 'Province',
    region: 'Region',
    city: 'City',
    town: 'Town',
    village: 'Village',
    itsTimeFor: 'It is time for',
    notificationSound: 'Notification Sound',
    playAdhanSound: 'Play Adhan Sound',
    playPreview: 'Play Preview',
    simulatePrayer: 'Simulate Prayer',
    simulationTriggered: 'Simulation Triggered',
    welcomeTitle: 'Welcome to Namaz Vakitleri',
    welcomeSubtitle: 'Please set your location to calculate accurate prayer times.',
    setupLocation: 'Setup Location',
  },
  tr: {
    location: 'Konum',
    manualLocation: 'Manuel Konum',
    unknownLocation: 'Bilinmeyen Konum',
    currentLocation: 'Mevcut Konum',
    today: 'Bugün',
    tomorrow: 'Yarın',
    yesterday: 'Dün',
    nextPrayer: 'Sonraki Namaz',
    prayerTimes: 'Namaz Vakitleri',
    qiblaDirection: 'Kıble Yönü',
    settings: 'Ayarlar',
    about: 'Hakkında',
    error: 'Hata',
    fajr: 'İmsak / Sabah',
    sunrise: 'Güneş',
    dhuhr: 'Öğle',
    asr: 'İkindi',
    maghrib: 'Akşam',
    isha: 'Yatsı',
    timeUntil: 'Kalan süre',
    hours: 'Saat',
    minutes: 'Dakika',
    seconds: 'Saniye',
    day: 'gün',
    days: 'gün',
    calculationMethod: 'Hesaplama Yöntemi',
    asrCalculation: 'İkindi Hesaplama',
    standard: 'Standart',
    hanafi: 'Hanefi',
    highLatitudeRule: 'Yüksek Enlem Kuralı',
    manualLocationOverride: 'Manuel Konum Geçersiz Kılma',
    enterCoordinates: 'Cihaz konumunu geçersiz kılmak için koordinatları girin',
    latitude: 'Enlem (-90 ile 90 arası)',
    longitude: 'Boylam (-180 ile 180 arası)',
    save: 'Kaydet',
    clear: 'Temizle',
    timeFormat: 'Saat Formatı',
    hour12: '12 Saat',
    hour24: '24 Saat',
    theme: 'Tema',
    light: 'Açık',
    dark: 'Koyu',
    system: 'Sistem',
    version: 'Sürüm',
    privacy: 'Gizlilik',
    noTracking: 'İzleme yok',
    noAnalytics: 'Analitik yok',
    noAds: 'Reklam yok',
    allCalculationsOffline: 'Tüm hesaplamalar çevrimdışı yapılır',
    credits: 'Teşekkürler',
    prayerTimeCalculations: 'Namaz vakti hesaplamaları şu kaynak tarafından sağlanmaktadır:',
    features: 'Özellikler',
    offlinePrayerTimeCalculations: 'Çevrimdışı namaz vakti hesaplamaları',
    multipleCalculationMethods: 'Birden fazla hesaplama yöntemi',
    hijriDateDisplay: 'Ayarlanabilir Hicri tarih gösterimi',
    qiblaDirectionIndicator: 'Kıble yönü göstergesi',
    manualLocationOverrideFeature: 'Manuel konum geçersiz kılma',
    timeFormatFeature: '12/24 saat formatı',
    darkLightThemeSupport: 'Koyu/Açık tema desteği',
    license: 'Lisans',
    providedAsIs: 'Bu uygulama kişisel kullanım için olduğu gibi sağlanmıştır. Allah bunu sürekli sadaka olarak kabul etsin.',
    sunday: 'Pazar',
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    middleOfTheNight: 'Gecenin Ortası',
    seventhOfTheNight: 'Gecenin Yedide Biri',
    twilightAngle: 'Alacakaranlık Açısı',
    webStaticAngle: '(Web: Statik açı. Yerel: Pusula kullanılacak)',
    nativeCompass: 'Yerel: Pusula kullanılacak',
    alignPhone: 'Oku Kıble ile hizalayın',
    invalidInput: 'Geçersiz Girdi',
    invalidLatitude: 'Geçersiz Enlem',
    invalidLongitude: 'Geçersiz Boylam',
    latitudeRange: 'Enlem -90 ile 90 arasında olmalıdır.',
    longitudeRange: 'Boylam -180 ile 180 arasında olmalıdır.',
    success: 'Başarılı',
    manualLocationSaved: 'Manuel konum kaydedildi.',
    manualLocationCleared: 'Manuel konum temizlendi. Cihaz konumu kullanılıyor.',
    loadingPrayerTimes: 'Namaz vakitleri yükleniyor...',
    calculatingNextPrayer: 'Sonraki namaz hesaplanıyor...',
    searching: 'Aranıyor...',
    languageLabel: 'Dil',
    citySearchPlaceholder: 'Şehir adı girin...',
    searchDescription: 'Şehir adıyla arayın (Örn: "İstanbul", "Ankara")',
    searchAndSave: 'Ara ve Kaydet',
    returnToAutoLocation: 'Otomatik Konuma Dön',
    calculationMethodTurkey: 'Diyanet İşleri Başkanlığı',
    cityNotFound: 'Şehir bulunamadı. Lütfen farklı bir arama terimi deneyin.',
    networkError: 'İnternet Bağlantısını Kontrol Edin',
    searchError: 'Şehir aranamadı. Lütfen tekrar deneyin.',
    locationSetTo: 'Konum ayarlandı',
    selectLocation: 'Konum Seç',
    noResultsFound: 'Şehir bulunamadı',
    muharram: 'Muharrem',
    safar: 'Safer',
    rabiAlAwwal: 'Rebiülevvel',
    rabiAlThani: 'Rebiülahir',
    jumadaAlUla: 'Cemaziyelevvel',
    jumadaAlThani: 'Cemaziyelahir',
    rajab: 'Recep',
    shaban: 'Şaban',
    ramadan: 'Ramazan',
    shawwal: 'Şevval',
    dhuAlQidah: 'Zilkade',
    dhuAlHijjah: 'Zilhicce',
    hijriYearSuffix: 'H',
    jumuah: 'Cuma',
    district: 'Bölge',
    province: 'İl',
    region: 'Bölge',
    city: 'Şehir',
    town: 'Kasaba',
    village: 'Köy',
    itsTimeFor: 'Vakti geldi',
    notificationSound: 'Bildirim Sesi',
    playAdhanSound: 'Ezan Sesini Çal',
    playPreview: 'Önizleme Çal',
    simulatePrayer: 'Namaz Simüle Et',
    simulationTriggered: 'Simülasyon Tetiklendi',
    welcomeTitle: 'Namaz Vakitleri\'ne Hoş Geldiniz',
    welcomeSubtitle: 'Namaz vakitlerini hesaplamak için lütfen konumunuzu ayarlayın.',
    setupLocation: 'Konumu Ayarla',
  },
};

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  storageService.setLanguage(lang);
  // Sync luxon locale immediately
  Settings.defaultLocale = lang;
}

export function getLanguage(): Language {
  const stored = storageService.getLanguage();
  return (stored as Language) || 'en';
}

// Initialize language from storage (synchronously if possible, or default)
// Since storageService.initialize() loads everything into memory, 
// a subsequent call to getLanguage() in the component will get the correct value.
// However, at module load time, the cache might be empty.
// But since we delay rendering in _layout until initialize() is done, this is fine.
currentLanguage = 'en'; // Default
// We will update currentLanguage when getLanguage is called or via a side effect, 
// but t() uses module-level variable. 
// We should update currentLanguage inside the component or specific re-init.
// Actually, `t` function should call `getLanguage()` every time? No, expensive.
// Better: `getLanguage` uses storageService memory cache.
// `t` should use `getLanguage()`?
// Let's make `t` dynamic or keep currentLanguage in sync.
//
// Refactor:
// We rely on `storageService.initialize()` happening BEFORE the app renders content.
// Inside `_layout`, we await initialize(). After that, `storageService.getLanguage()` will return the stored value.
// We must ensure `currentLanguage` variable is updated then.
//
// Let's change `t` to use `currentLanguage` but we need to update `currentLanguage` from storage.
// We can expose an `initLanguage` function.

export function initLanguage() {
  const stored = storageService.getLanguage();
  if (stored) {
    currentLanguage = stored as Language;
  }
  // Sync luxon locale
  Settings.defaultLocale = currentLanguage;
}

export function t(key: keyof Translations): string {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

// Export translation object for direct access if needed
export { translations };

