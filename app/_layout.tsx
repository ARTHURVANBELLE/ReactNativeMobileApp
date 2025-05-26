import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { isAuthenticated } from '@/utils/session';
import LoginScreen from '@/components/login';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  // Authentication state
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const authenticated = await isAuthenticated();
        setAuthState(authenticated ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthState('unauthenticated');
      }
    }
    
    if (loaded) {
      SplashScreen.hideAsync();
      checkAuth();
    }
  }, [loaded]);

  // Set up a periodic check for authentication status (optional)
  useEffect(() => {
    if (!loaded) return;
    
    const checkInterval = setInterval(async () => {
      try {
        const authenticated = await isAuthenticated();
        setAuthState(authenticated ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        console.error('Error in periodic auth check:', error);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {authState === 'loading' ? (
          // Show loading state while checking authentication
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
        ) : authState === 'authenticated' ? (
          // Show the main app navigation when authenticated
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        ) : (
          // Show login screen when not authenticated
          <Stack>
            <Stack.Screen 
              name="index" 
              options={{ headerShown: false }} 
            />
          </Stack>
        )}
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
