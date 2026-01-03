import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  useColorScheme as useNativeColorScheme,
  Switch,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { storageService } from '../lib/storage';
import { t, getLanguage, setLanguage, type Language } from '../lib/i18n';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import {
  CALCULATION_METHODS,
  CALCULATION_METHOD_DISPLAY_NAMES,
  HIGH_LATITUDE_RULES,
  HIGH_LATITUDE_RULE_DISPLAY_NAMES,
} from '../constants/methods';
import type {
  CalculationMethod,
  AsrMethod,
  HighLatitudeRule,
  TimeFormat,
  Theme,
} from '../types';
import { ChevronDown, ChevronUp, X, Search, MapPin, Volume2, Play, Bell } from 'lucide-react-native';
import { simulatePrayerNotification, refreshAllNotifications } from '../lib/notifications';
import { Audio } from 'expo-av';

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const systemColorScheme = useNativeColorScheme();
  const [, forceUpdate] = useState({});

  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>(
    storageService.getCalculationMethod()
  );
  const [asrMethod, setAsrMethod] = useState<AsrMethod>(
    storageService.getAsrMethod()
  );
  const [highLatitudeRule, setHighLatitudeRule] = useState<HighLatitudeRule>(
    storageService.getHighLatitudeRule()
  );
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(
    storageService.getTimeFormat()
  );
  const [theme, setTheme] = useState<Theme>(storageService.getTheme());
  const [language, setLanguageState] = useState<Language>(getLanguage());
  const [playAdhan, setPlayAdhan] = useState<boolean>(storageService.getPlayAdhan());

  const [citySearch, setCitySearch] = useState<string>('');
  const [searchResult, setSearchResult] = useState<{ lat: number; lon: number; display_name: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    lat: string;
    lon: string;
    display_name: string;
    place_id: number;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      suburb?: string;
      hamlet?: string;
      municipality?: string;
      state?: string;
      province?: string;
      region?: string;
      county?: string;
      country?: string;
      postcode?: string;
    };
    type?: string;
    addresstype?: string;
    class?: string;
  }>>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Update header title based on language
  useEffect(() => {
    navigation.setOptions({ title: t('settings') });
  }, [language, navigation]);

  // UI state for collapsible sections
  const [calcMethodExpanded, setCalcMethodExpanded] = useState(false);
  const [highLatExpanded, setHighLatExpanded] = useState(false);

  useEffect(() => {
    const manualLocation = storageService.getManualLocation();
    const savedName = storageService.getManualLocationName();

    if (savedName) {
      setCitySearch(savedName);
    } else if (manualLocation) {
      setCitySearch(`${manualLocation.latitude.toFixed(4)}, ${manualLocation.longitude.toFixed(4)}`);
    }
  }, []);

  const searchCity = async () => {
    if (!citySearch.trim()) {
      Alert.alert(t('error'), 'Please enter a city name');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    try {
      // Get current language code for API
      const currentLang = getLanguage();
      const langCode = currentLang === 'tr' ? 'tr' : 'en';

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citySearch)}&format=json&limit=20&addressdetails=1&accept-language=${langCode}`,
        {
          headers: {
            'User-Agent': 'CleanPrayerApp/1.0', // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data)) {
        // Sort results: City/Town first, Administrative last
        const sortedData = [...data].sort((a, b) => {
          const typeA = (a.addresstype || a.type || "").toLowerCase();
          const typeB = (b.addresstype || b.type || "").toLowerCase();

          const isCityA = typeA === 'city' || typeA === 'town' || typeA === 'village' || a.class === 'place';
          const isCityB = typeB === 'city' || typeB === 'town' || typeB === 'village' || b.class === 'place';

          const isAdminA = typeA === 'administrative' || typeA === 'boundary';
          const isAdminB = typeB === 'administrative' || typeB === 'boundary';

          if (isCityA && !isCityB) return -1;
          if (!isCityA && isCityB) return 1;

          if (isAdminA && !isAdminB) return 1;
          if (!isAdminA && isAdminB) return -1;

          return 0;
        });
        setSearchResults(sortedData);
      } else {
        setSearchResults([]);
      }

      setShowSearchModal(true);
    } catch (error) {
      console.error('Search error:', error);
      // Check if it's a network error
      const isNetworkError = error instanceof TypeError && (
        error.message.includes('Network request failed') ||
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch')
      );

      if (isNetworkError) {
        Alert.alert(t('error'), t('networkError') || 'Check Internet Connection');
      } else {
        Alert.alert(t('error'), t('searchError') || 'Could not search for city. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Format the location name as "City, Region, Country"
    const locationName = formatLocationName(result);

    storageService.setManualLocation({ latitude: lat, longitude: lon }, locationName);
    setCitySearch(locationName);
    setSearchResult({ lat, lon, display_name: result.display_name });
    setShowSearchModal(false);
    setSearchResults([]);
    Alert.alert(t('success'), `${t('locationSetTo') || 'Location set to'}: ${locationName}`);
  };

  // Format location name from Nominatim result to clean "City, Region, Country" format
  const formatLocationName = (result: any): string => {
    if (!result) return '';

    // If it's a string, it might be from storage or a fallback
    if (typeof result === 'string') {
      const parts = result.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const city = parts[0];
        const region = parts[1];
        const country = parts[2];
        if (city.toLowerCase() === region.toLowerCase()) {
          return `${city}, ${country}`;
        }
        return `${city}, ${region}, ${country}`;
      }
      return result;
    }

    const { address, display_name } = result;

    if (!address) {
      // Fallback to manual parsing if address details missing
      const parts = display_name.split(',').map((p: string) => p.trim());
      if (parts.length >= 3) {
        const city = parts[0];
        const region = parts[1];
        const country = parts[2];
        if (city.toLowerCase() === region.toLowerCase()) {
          return `${city}, ${country}`;
        }
        return `${city}, ${region}, ${country}`;
      }
      return display_name;
    }

    // Try to get the most specific location name (city/town/village)
    const city = address.city || address.town || address.village || address.suburb || address.hamlet || address.municipality;
    // Get the administrative region
    const province = address.state || address.province || address.region || address.county;
    const country = address.country;

    const parts = [];
    if (city) {
      parts.push(city);
    }

    // Add province if it exists and is different from the city
    if (province && (!city || province.toLowerCase() !== city.toLowerCase())) {
      parts.push(province);
    }

    if (country) {
      parts.push(country);
    }

    // If we couldn't build it from address parts, use display_name fallback
    if (parts.length === 0) {
      return display_name.split(',')[0].trim();
    }

    return parts.join(', ');
  };

  const clearManualLocation = () => {
    storageService.setManualLocation(null);
    setCitySearch('');
    setSearchResult(null);
    Alert.alert(t('success'), t('manualLocationCleared'));
  };

  const clearInput = () => {
    setCitySearch('');
  };

  const handleCalculationMethodChange = (method: CalculationMethod) => {
    setCalculationMethod(method);
    storageService.setCalculationMethod(method);
    setCalcMethodExpanded(false);
  };

  const handleAsrMethodChange = (method: AsrMethod) => {
    setAsrMethod(method);
    storageService.setAsrMethod(method);
  };

  const handleHighLatitudeRuleChange = (rule: HighLatitudeRule) => {
    setHighLatitudeRule(rule);
    storageService.setHighLatitudeRule(rule);
    setHighLatExpanded(false);
  };

  const handleTimeFormatChange = (format: TimeFormat) => {
    setTimeFormat(format);
    storageService.setTimeFormat(format);
  };

  const { colorScheme: nwColorScheme, setColorScheme: setNwColorScheme } = useNativeWindColorScheme();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    storageService.setTheme(newTheme);

    if (newTheme === 'system') {
      setNwColorScheme(systemColorScheme || 'light');
    } else {
      setNwColorScheme(newTheme as 'light' | 'dark');
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang);
    forceUpdate({});
  };

  const handleToggleAdhan = (value: boolean) => {
    setPlayAdhan(value);
    storageService.setPlayAdhan(value);
    refreshAllNotifications(); // Reschedule with new sound preference
  };

  const playPreview = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/adhan.mp3')
      );
      await sound.playAsync();
    } catch (error) {

      console.error('Preview error:', error);
      Alert.alert(t('error'), 'Could not play audio preview');
    }
  };

  const handleSimulate = async () => {
    await simulatePrayerNotification();
    Alert.alert(t('success'), t('simulationTriggered'));
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 px-4 py-4">
      <View className="mb-8">
        {/* Language Selection */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-3">
            {t('languageLabel')}
          </Text>
          <View className="flex-row gap-2">
            {(['en', 'tr'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => handleLanguageChange(lang)}
                className={`flex-1 p-3 rounded-xl border ${language === lang
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800'
                  }`}
              >
                <Text
                  className={`text-center font-bold ${language === lang ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}
                >
                  {lang === 'en' ? 'English' : 'Türkçe'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Manual Location Overlay Card */}
        <View className="mb-6 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <Text className="text-blue-900 dark:text-blue-100 text-lg font-bold mb-1">
            {t('manualLocationOverride')}
          </Text>
          <Text className="text-blue-700/60 dark:text-blue-300/60 text-sm mb-4">
            {t('searchDescription')}
          </Text>

          <View className="relative mb-3">
            <TextInput
              placeholder={t('citySearchPlaceholder')}
              placeholderTextColor="#94a3b8"
              value={citySearch}
              onChangeText={setCitySearch}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl text-gray-900 dark:text-gray-100 border border-blue-200 dark:border-blue-800 pr-12"
            />
            {citySearch.length > 0 && (
              <TouchableOpacity
                onPress={clearInput}
                className="absolute right-3 top-3.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-full"
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={searchCity}
            disabled={isSearching}
            className={`w-full ${isSearching ? 'bg-blue-400' : 'bg-blue-500'} dark:bg-blue-600 p-4 rounded-xl flex-row justify-center items-center shadow-md mb-3`}
          >
            <Search size={22} color="white" />
            <Text className="text-white text-center font-bold text-lg ml-2">
              {isSearching ? t('searching') : t('searchAndSave')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearManualLocation}
            className="w-full py-2"
          >
            <Text className="text-blue-600 dark:text-blue-400 text-center font-semibold text-sm">
              {t('clear')} ({t('returnToAutoLocation')})
            </Text>
          </TouchableOpacity>

          {searchResult && (
            <View className="mt-3 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
              <Text className="text-green-600 dark:text-green-400 text-xs text-center font-medium">
                ✓ {formatLocationName(searchResult.lat ? searchResult : searchResult.display_name)}
              </Text>
            </View>
          )}
        </View>

        {/* Search Results Modal */}
        <Modal
          visible={showSearchModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSearchModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[80%]">
              <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-gray-900 dark:text-gray-100 text-xl font-bold">
                  {t('selectLocation')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowSearchModal(false);
                    setSearchResults([]);
                  }}
                  className="p-2"
                >
                  <X size={24} color={nwColorScheme === 'dark' ? '#ffffff' : '#000000'} />
                </TouchableOpacity>
              </View>

              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => String(item.place_id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => selectSearchResult(item)}
                      className="p-4 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
                    >
                      <View className="flex-row items-start">
                        <View className="mt-1 mr-3">
                          <MapPin size={20} color="#3b82f6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-gray-100 text-base font-semibold">
                            {formatLocationName(item)}
                          </Text>
                          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1" numberOfLines={3}>
                            {/* Raw subtitle: Show display_name + friendly type label */}
                            {(() => {
                              const rawType = (item.addresstype || item.type || '').toLowerCase();
                              let friendlyType = '';
                              if (rawType === 'city_district' || rawType === 'suburb' || rawType === 'neighbourhood' || rawType === 'quarter') {
                                friendlyType = t('district');
                              } else if (rawType === 'state' || rawType === 'province') {
                                friendlyType = t('province');
                              } else if (rawType === 'region' || rawType === 'administrative' || rawType === 'boundary') {
                                friendlyType = t('region');
                              } else if (rawType === 'city') {
                                friendlyType = t('city');
                              } else if (rawType === 'town') {
                                friendlyType = t('town');
                              } else if (rawType === 'village' || rawType === 'hamlet') {
                                friendlyType = t('village');
                              } else {
                                friendlyType = t(rawType as any) || rawType || t('location');
                              }
                              return `${item.display_name} (${friendlyType})`;
                            })()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  className="max-h-[500px]"
                />
              ) : (
                <View className="p-8 items-center">
                  <Text className="text-gray-500 dark:text-gray-400 text-center">
                    {t('noResultsFound')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Adhan Sound Settings */}
        <View className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center mb-4">
            <Volume2 size={20} color="#3b82f6" className="mr-2" />
            <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold">
              {t('notificationSound')}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-2">
            <View className="flex-1 mr-4">
              <Text className="text-gray-900 dark:text-gray-100 font-semibold">
                {t('playAdhanSound')}
              </Text>
            </View>
            <Switch
              value={playAdhan}
              onValueChange={handleToggleAdhan}
              trackColor={{ false: '#94a3b8', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>

          <TouchableOpacity
            onPress={playPreview}
            className="mt-3 flex-row items-center justify-center bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl"
          >
            <Play size={18} color="#3b82f6" fill="#3b82f6" />
            <Text className="text-blue-600 dark:text-blue-400 font-bold ml-2">
              {t('playPreview')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calculation Method (Collapsible) */}
        <View className="mb-4">
          <TouchableOpacity
            onPress={() => setCalcMethodExpanded(!calcMethodExpanded)}
            className="flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <View className="flex-1">
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                {t('calculationMethod')}
              </Text>
              <Text className="text-gray-900 dark:text-gray-100 text-base font-bold" numberOfLines={1}>
                {calculationMethod === 'Turkey' ? t('calculationMethodTurkey') : CALCULATION_METHOD_DISPLAY_NAMES[calculationMethod]}
              </Text>
            </View>
            <View className="ml-2">
              {calcMethodExpanded ? <ChevronUp size={24} color="#3b82f6" /> : <ChevronDown size={24} color="#3b82f6" />}
            </View>
          </TouchableOpacity>

          {calcMethodExpanded && (
            <View className="mt-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
              {CALCULATION_METHODS.map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() => handleCalculationMethodChange(method)}
                  className={`p-4 mb-1 rounded-lg ${calculationMethod === method ? 'bg-blue-500' : 'bg-transparent'}`}
                >
                  <Text className={`font-semibold ${calculationMethod === method ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                    {method === 'Turkey' ? t('calculationMethodTurkey') : CALCULATION_METHOD_DISPLAY_NAMES[method]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Asr Method */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-3 px-1">
            {t('asrCalculation')}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleAsrMethodChange('Standard')}
              className={`flex-1 p-3 rounded-xl border ${asrMethod === 'Standard'
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800'
                }`}
            >
              <Text className={`text-center font-bold ${asrMethod === 'Standard' ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                {t('standard')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAsrMethodChange('Hanafi')}
              className={`flex-1 p-3 rounded-xl border ${asrMethod === 'Hanafi'
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800'
                }`}
            >
              <Text className={`text-center font-bold ${asrMethod === 'Hanafi' ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                {t('hanafi')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* High Latitude Rule (Collapsible) */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setHighLatExpanded(!highLatExpanded)}
            className="flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <View className="flex-1">
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                {t('highLatitudeRule')}
              </Text>
              <Text className="text-gray-900 dark:text-gray-100 text-base font-bold" numberOfLines={1}>
                {highLatitudeRule === 'MiddleOfTheNight' ? t('middleOfTheNight') :
                  highLatitudeRule === 'SeventhOfTheNight' ? t('seventhOfTheNight') :
                    highLatitudeRule === 'TwilightAngle' ? t('twilightAngle') :
                      HIGH_LATITUDE_RULE_DISPLAY_NAMES[highLatitudeRule]}
              </Text>
            </View>
            <View className="ml-2">
              {highLatExpanded ? <ChevronUp size={24} color="#3b82f6" /> : <ChevronDown size={24} color="#3b82f6" />}
            </View>
          </TouchableOpacity>

          {highLatExpanded && (
            <View className="mt-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
              {HIGH_LATITUDE_RULES.map((rule) => {
                let displayName = '';
                if (rule === 'MiddleOfTheNight') displayName = t('middleOfTheNight');
                else if (rule === 'SeventhOfTheNight') displayName = t('seventhOfTheNight');
                else if (rule === 'TwilightAngle') displayName = t('twilightAngle');
                else displayName = HIGH_LATITUDE_RULE_DISPLAY_NAMES[rule];

                return (
                  <TouchableOpacity
                    key={rule}
                    onPress={() => handleHighLatitudeRuleChange(rule)}
                    className={`p-4 mb-1 rounded-lg ${highLatitudeRule === rule ? 'bg-blue-500' : 'bg-transparent'}`}
                  >
                    <Text className={`font-semibold ${highLatitudeRule === rule ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Time Format */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-3 px-1">
            {t('timeFormat')}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleTimeFormatChange('12h')}
              className={`flex-1 p-3 rounded-xl border ${timeFormat === '12h'
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800'
                }`}
            >
              <Text className={`text-center font-bold ${timeFormat === '12h' ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                {t('hour12')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTimeFormatChange('24h')}
              className={`flex-1 p-3 rounded-xl border ${timeFormat === '24h'
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800'
                }`}
            >
              <Text className={`text-center font-bold ${timeFormat === '24h' ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                {t('hour24')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme */}
        <View className="mb-10">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-3 px-1">
            {t('theme')}
          </Text>
          <View className="flex-row gap-2">
            {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
              <TouchableOpacity
                key={themeOption}
                onPress={() => handleThemeChange(themeOption)}
                className={`flex-1 p-3 rounded-xl border ${theme === themeOption
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800'
                  }`}
              >
                <Text
                  className={`text-center font-bold ${theme === themeOption ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}
                >
                  {themeOption === 'system' ? t('system') : t(themeOption)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* QA Section */}
        <View className="mt-4 pt-8 border-t border-gray-200 dark:border-gray-800 mb-10">
          <TouchableOpacity
            onPress={handleSimulate}
            className="bg-purple-500 dark:bg-purple-600 p-4 rounded-xl flex-row justify-center items-center shadow-md"
          >
            <Bell size={20} color="white" className="mr-2" />
            <Text className="text-white text-center font-bold text-lg ml-2">
              {t('simulatePrayer')}
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-500 dark:text-gray-400 text-[10px] text-center mt-2 italic">
            Simulates immediate notification & adhan sound
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

