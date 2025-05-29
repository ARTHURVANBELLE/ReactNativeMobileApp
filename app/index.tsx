import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import LoginScreen from '@/components/login';
import { isAuthenticated } from '@/utils/session';

// This is a special file that will automatically be rendered when the app loads.
// When using authentication in the root layout, this will only be shown when unauthenticated
export default function Index() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setAuthState(authenticated ? 'authenticated' : 'unauthenticated');
        
        if (authenticated) {
          // Navigate to the tabs when authenticated
          router.replace('/(tabs)/home');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthState('unauthenticated');
      }
    };

    checkAuth();
  }, [router]);

  // Show loading indicator while checking authentication
  if (authState === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FC4C02" />
      </View>
    );
  }

  // Redirect to tabs if authenticated
  if (authState === 'authenticated') {
    return <Redirect href="/(tabs)/home" />;
  }

  // Show login screen if not authenticated
  return <LoginScreen onLoginSuccess={() => setAuthState('authenticated')} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
