import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, Suspense, ReactNode } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { addAuthStateListener } from '@/utils/session';

import { useColorScheme } from '@/hooks/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { isAuthenticated } from '@/utils/session';
import { DefaultTheme as PaperDefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { theme } from '@/utils/theme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

// Create a custom theme
const paperTheme = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: '#FC4C02',  // Customized primary color
    accent: '#f1c40f',
  },
};

// Create a Show component similar to SolidJS
type ShowProps = {
  when: boolean | undefined;
  fallback: ReactNode;
  children: ReactNode;
};

function Show({ when, fallback, children }: ShowProps) {
  return <>{when ? children : fallback}</>;
}

// Create an AuthWrapper component to handle auth state
function AuthWrapper({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();
  const [isLayoutMounted, setIsLayoutMounted] = useState(false);

  // Mark layout as mounted after first render
  useEffect(() => {
    setIsLayoutMounted(true);
  }, []);

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const authenticated = await isAuthenticated();
        setAuthState(authenticated ? 'authenticated' : 'unauthenticated');
        
        // Don't navigate here - we'll handle it in a separate effect
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthState('unauthenticated');
      }
    }
    
    checkAuth();
    
    // Register for real-time auth state updates
    const unsubscribe = addAuthStateListener((isAuthenticated) => {
      setAuthState(isAuthenticated ? 'authenticated' : 'unauthenticated');
    });
    
    return unsubscribe;
  }, []);

  // Handle navigation separately after layout is mounted and auth state is determined
  useEffect(() => {
    // Only navigate if layout is mounted and auth state is not loading
    if (isLayoutMounted && authState !== 'loading') {
      // Wait for a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        if (authState === 'authenticated') {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [authState, isLayoutMounted, router]);

  // Loading state
  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FC4C02" />
      </View>
    );
  }

  // Unauthenticated state
  if (authState === 'unauthenticated') {
    return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // Authenticated state
  return children;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Show nothing until fonts are loaded
  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StyledThemeProvider theme={theme}>
        <PaperProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Suspense 
              fallback={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#FC4C02" />
                </View>
              }
            >
              <AuthWrapper>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </AuthWrapper>
            </Suspense>
          </ThemeProvider>
        </PaperProvider>
      </StyledThemeProvider>
    </QueryClientProvider>
  );
}
