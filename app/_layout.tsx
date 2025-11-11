import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as Location from 'expo-location';

export default function RootLayout() {
  // Pre-request location permission when app starts
  useEffect(() => {
    (async () => {
      // This pre-requests permission so it's ready when user gets to main app
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}