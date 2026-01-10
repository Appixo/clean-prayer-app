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
import { useStore } from '../store/useStore';
import { t, type Language } from '../lib/i18n';
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
  const navigation = useNavigation();
  const systemColorScheme = useNativeColorScheme();

  // Zustand Store
  const {
    calculationMethod, setCalculationMethod,
    asrMethod, setAsrMethod,
    highLatitudeRule, setHighLatitudeRule,
    timeFormat, setTimeFormat,
    theme, setTheme,
    language, setLanguage,
    playAdhan, setPlayAdhan,
    setLocation,
    location: currentLocation,
    isManualLocation,
    city: storeCity,
    country: storeCountry
  } = useStore();

  const [citySearch, setCitySearch] = useState<string>('');
  const [searchResult, setSearchResult] = useState<{ lat: number; lon: number; display_name: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // UI state for collapsible sections
  const [calcMethodExpanded, setCalcMethodExpanded] = useState(false);
  const [highLatExpanded, setHighLatExpanded] = useState(false);

  // Update header title based on language
  useEffect(() => {
    navigation.setOptions({ title: t('settings') });
  }, [language, navigation]);

  useEffect(() => {
    if (isManualLocation && currentLocation) {
      if (storeCity && storeCity !== 'Unknown City') {
        setCitySearch(storeCity + (storeCountry ? `, ${storeCountry}` : ''));
      } else {
        setCitySearch(`${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`);
      }
    } else if (storeCity) {
      // Just to prepopulate but wait, if it's auto, we might not want to prepopulate manual search
      // setCitySearch(storeCity);
    }
  }, [isManualLocation, currentLocation, storeCity, storeCountry]);

  // NativeWind hook
  const { setColorScheme: setNwColorScheme } = useNativeWindColorScheme();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      setNwColorScheme(systemColorScheme || 'light');
    } else {
      setNwColorScheme(newTheme as 'light' | 'dark');
    }
  };

  const handleToggleAdhan = (value: boolean) => {
    setPlayAdhan(value);
    refreshAllNotifications();
  };

  const searchCity = async () => {
    if (!citySearch.trim()) {
      Alert.alert(t('error'), 'Please enter a city name');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    try {
      const langCode = language === 'tr' ? 'tr' : 'en';

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citySearch)}&format=json&limit=20&addressdetails=1&accept-language=${langCode}`,
        {
          headers: {
            'User-Agent': 'CleanPrayerApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data)) {
        // Sort results similar to before
        const sortedData = [...data].sort((a, b) => {
          const typeA = (a.addresstype || a.type || "").toLowerCase();
          const typeB = (b.addresstype || b.type || "").toLowerCase();

          const isCityA = typeA === 'city' || typeA === 'town' || typeA === 'village' || a.class === 'place';
          const isCityB = typeB === 'city' || typeB === 'town' || typeB === 'village' || b.class === 'place';

          if (isCityA && !isCityB) return -1;
          if (!isCityA && isCityB) return 1;
          return 0;
        });
        setSearchResults(sortedData);
      } else {
        setSearchResults([]);
      }

      setShowSearchModal(true);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(t('error'), t('searchError') || 'Could not search for city');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const locationName = formatLocationName(result);

    // Save to store
    // We try to parse city/country from address if possible
    let city = result.address?.city || result.address?.town || result.address?.village || result.display_name.split(',')[0];
    let country = result.address?.country;

    setLocation({ latitude: lat, longitude: lon }, city, country, undefined, true);

    setCitySearch(locationName);
    setSearchResult({ lat, lon, display_name: result.display_name });
    setShowSearchModal(false);
    setSearchResults([]);
    Alert.alert(t('success'), `${t('locationSetTo')}: ${locationName}`);
  };

  const formatLocationName = (result: any): string => {
    if (!result) return '';
    if (typeof result === 'string') return result;

    const { address, display_name } = result;
    if (!address) return display_name.split(',').slice(0, 2).join(',');

    const city = address.city || address.town || address.village || address.suburb;
    const country = address.country;

    if (city && country) return `${city}, ${country}`;
    return display_name.split(',').slice(0, 2).join(',');
  };

  const clearManualLocation = () => {
    // If we clear manual location, we should probably trigger a re-fetch of GPS location? 
    // Or just set isManual=false and let Home screen handle it?
    // Let's set isManual=false. Home screen should detect this and re-fetch GPS.
    if (!currentLocation) {
      // Fallback or just unset
      useStore.getState().setLocation({ latitude: 0, longitude: 0 }, undefined, undefined, undefined, false); // Hacky reset
    } else {
      useStore.getState().setLocation(currentLocation, storeCity || undefined, storeCountry || undefined, undefined, false);
    }
    setCitySearch('');
    setSearchResult(null);
    Alert.alert(t('success'), t('manualLocationCleared'));
  };

  const clearInput = () => {
    setCitySearch('');
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
                onPress={() => setLanguage(lang)}
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
                  <X size={24} color={systemColorScheme === 'dark' ? '#ffffff' : '#000000'} />
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

        {/* Calculation Method */}
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
                  onPress={() => {
                    setCalculationMethod(method);
                    setCalcMethodExpanded(false);
                  }}
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
              onPress={() => setAsrMethod('Standard')}
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
              onPress={() => setAsrMethod('Hanafi')}
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

        {/* High Latitude Rule */}
        {/* Simplified for brevity while refactoring, logic remains same */}
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
                let displayName = HIGH_LATITUDE_RULE_DISPLAY_NAMES[rule];
                if (rule === 'MiddleOfTheNight') displayName = t('middleOfTheNight');
                else if (rule === 'SeventhOfTheNight') displayName = t('seventhOfTheNight');
                else if (rule === 'TwilightAngle') displayName = t('twilightAngle');

                return (
                  <TouchableOpacity
                    key={rule}
                    onPress={() => {
                      setHighLatitudeRule(rule);
                      setHighLatExpanded(false);
                    }}
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
              onPress={() => setTimeFormat('12h')}
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
              onPress={() => setTimeFormat('24h')}
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

        {/* Theme Settings */}
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
