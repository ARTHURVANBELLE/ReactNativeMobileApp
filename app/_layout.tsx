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

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

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

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const authenticated = await isAuthenticated();
        setAuthState(authenticated ? 'authenticated' : 'unauthenticated');
        
        if (authenticated) {
          // Redirect to the home tab specifically, not just the tabs layout
          router.replace('/(tabs)/home');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthState('unauthenticated');
      }
    }
    
    checkAuth();
    
    // Register for real-time auth state updates
    const unsubscribe = addAuthStateListener((isAuthenticated) => {
      setAuthState(isAuthenticated ? 'authenticated' : 'unauthenticated');
      
      // Navigate immediately when auth state changes
      if (isAuthenticated) {
        // Redirect to home tab when authenticated
        router.replace('/(tabs)/home');
      } else {
        router.replace('/');
      }
    });
    
    return unsubscribe;
  }, []);

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
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
