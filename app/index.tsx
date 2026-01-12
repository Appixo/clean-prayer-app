import { Redirect } from 'expo-router';
import { useStore } from '../store/useStore';

export default function Index() {
  const { location, savedLocations } = useStore();
  const needsOnboarding = savedLocations.length === 0 && !location;

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
